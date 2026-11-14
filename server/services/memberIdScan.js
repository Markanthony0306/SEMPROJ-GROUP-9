import sharp from 'sharp'
import { memberIdImageLimit, memberIdImageTypes } from '../../shared/memberIdTypes.js'
import { readDocumentPortrait } from './faceVerification.js'
import { parseMemberId } from './memberIdParsing.js'
import { MemberIdError } from './memberIdRecords.js'

export class MemberIdImageError extends Error {}

async function recognizeDocument(image) {
  const endpoint = process.env.ID_PADDLE_OCR_URL || 'http://127.0.0.1:8080/ocr'
  try {
    const url = new URL(endpoint)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid OCR URL.')
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        file: image.toString('base64'),
        fileType: 1,
        useDocOrientationClassify: false,
        useDocUnwarping: false,
        useTextlineOrientation: false,
        visualize: false
      })
    })
    if (!response.ok) throw new Error('OCR request failed.')
    const payload = await response.json()
    const result = payload?.result?.ocrResults?.[0]?.prunedResult
    const { rec_texts: texts, rec_scores: scores, rec_polys: polygons } = result ?? {}
    if (
      !Array.isArray(texts) ||
      !Array.isArray(scores) ||
      !Array.isArray(polygons) ||
      texts.length !== scores.length ||
      texts.length !== polygons.length
    ) {
      throw new Error('Invalid OCR response.')
    }

    return texts.map((text, index) => {
      const score = scores[index]
      const polygon = polygons[index]
      if (
        typeof text !== 'string' ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > 1 ||
        !Array.isArray(polygon) ||
        polygon.length < 4 ||
        !polygon.every(
          (point) => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
        )
      ) {
        throw new Error('Invalid OCR line.')
      }
      return { text, confidence: Math.round(score * 100), polygon }
    })
  } catch {
    throw new MemberIdError(
      503,
      'The server ID reader is unavailable. Try again or contact the gym admin.',
      'ID_READER_UNAVAILABLE'
    )
  }
}

function checkQuality(data, width, height) {
  let dark = 0
  let bright = 0
  let edgeEnergy = 0
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      const value = data[index]
      if (value < 15) dark += 1
      if (value > 250) bright += 1
      const laplacian =
        4 * value - data[index - 1] - data[index + 1] - data[index - width] - data[index + width]
      edgeEnergy += laplacian ** 2
    }
  }
  const pixels = (width - 2) * (height - 2)
  if (bright / pixels > 0.88 || dark / pixels > 0.75)
    throw new MemberIdImageError(
      'The image is overexposed, has heavy glare, or is too dark. Retake it in even light.'
    )
  if (edgeEnergy / pixels < 65)
    throw new MemberIdImageError(
      'The image looks blurry. Hold the camera still and retake the photo.'
    )
}

function hasClippedText(lines, width, height) {
  return lines.some(
    ({ text, confidence, polygon }) =>
      confidence >= 60 &&
      /\p{L}{2}/u.test(text) &&
      polygon.some(([x, y]) => x < 2 || y < 2 || x > width - 2 || y > height - 2)
  )
}

export async function scanMemberId(image, mimeType, idType, { front = true } = {}) {
  if (
    !Buffer.isBuffer(image) ||
    image.length === 0 ||
    image.length > memberIdImageLimit ||
    !memberIdImageTypes.includes(mimeType)
  ) {
    throw new MemberIdImageError('Capture a JPG or PNG image up to 5 MB.')
  }

  let decoded
  try {
    const input = sharp(image, { limitInputPixels: 20_000_000, failOn: 'warning' })
    const metadata = await input.metadata()
    if (mimeType !== `image/${metadata.format}` || (metadata.pages || 1) > 1)
      throw new MemberIdImageError('Capture a single, valid JPG or PNG image.')
    if (
      Math.min(metadata.width, metadata.height) < 300 ||
      Math.max(metadata.width, metadata.height) < 500
    )
      throw new MemberIdImageError('The image is too small. Retake it with the entire ID in frame.')
    decoded = await input
      .autoOrient()
      .resize(1700, 1700, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .toColourspace('srgb')
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
  } catch (error) {
    if (error instanceof MemberIdImageError) throw error
    throw new MemberIdImageError(
      'The image could not be read. Rescan that side of the ID.'
    )
  }
  const {
    data,
    info: { width, height, channels }
  } = decoded
  const rgb = () => sharp(data, { raw: { width, height, channels } })
  const quality = await rgb()
    .resize({ width: 560, withoutEnlargement: true })
    .greyscale()
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })
  checkQuality(quality.data, quality.info.width, quality.info.height)

  const portrait = front ? await readDocumentPortrait({ data, width, height }) : null
  if (front && !portrait) {
    throw new MemberIdImageError(
      'Could not find one clear, uncropped ID portrait. Retake the photo with all four edges visible.'
    )
  }

  const prepared = await rgb().greyscale().normalise().png().toBuffer()
  const lines = await recognizeDocument(prepared)
  if (hasClippedText(lines, width, height)) {
    throw new MemberIdImageError(
      'Text appears cut off at the edge. Retake the photo with all four edges visible.'
    )
  }
  const parsed = parseMemberId(idType, { lines })
  if (front && parsed.lineCount < 3) {
    throw new MemberIdImageError(
      'Too little text was readable. Retake the photo without glare and include the entire ID.'
    )
  }
  return { ...parsed, portrait }
}
