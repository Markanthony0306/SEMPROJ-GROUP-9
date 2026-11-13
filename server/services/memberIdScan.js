import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'
import { memberIdImageLimit, memberIdImageTypes } from '../../shared/memberIdTypes.js'
import { faceDescriptorDistance } from '../lib/face-auth.js'
import { readDocumentPortrait, readLiveFace } from './faceVerification.js'
import { parseMemberId } from './memberIdParsing.js'

export class MemberIdImageError extends Error {}

const englishModelUrl =
  'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz'
let englishModel

function loadEnglishModel() {
  englishModel ||= (async () => {
    if (process.env.ID_OCR_LANG_PATH) {
      await readFile(join(process.env.ID_OCR_LANG_PATH, 'eng.traineddata.gz'))
      return process.env.ID_OCR_LANG_PATH
    }
    const response = await fetch(englishModelUrl, { signal: AbortSignal.timeout(20_000) })
    if (!response.ok) throw new Error('English OCR model could not be loaded.')
    const data = new Uint8Array(await response.arrayBuffer())
    if (data.length > 16 * 1024 * 1024 || data[0] !== 0x1f || data[1] !== 0x8b)
      throw new Error('Invalid English OCR model.')
    const directory = await mkdtemp(join(tmpdir(), 'fitpulse-ocr-'))
    await writeFile(join(directory, 'eng.traineddata.gz'), data)
    return directory
  })().catch((error) => {
    englishModel = undefined
    throw error
  })
  return englishModel
}

async function createIdWorker() {
  const langPath = await loadEnglishModel()
  let rejectStartup
  const startupError = new Promise((_, reject) => {
    rejectStartup = reject
  })
  const startup = createWorker('eng', 1, {
    langPath,
    cacheMethod: 'none',
    errorHandler: () => rejectStartup(new Error('The OCR worker failed.'))
  })
  return Promise.race([startup, startupError])
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

function hasClippedText(tsv, width, height) {
  return (tsv || '').split('\n').some((line) => {
    const columns = line.split('\t')
    if (columns[0] !== '5' || Number(columns[10]) < 60 || !/\p{L}{2}/u.test(columns[11] || ''))
      return false
    const [x, y, boxWidth, boxHeight] = columns.slice(6, 10).map(Number)
    return x < 2 || y < 2 || x + boxWidth > width - 2 || y + boxHeight > height - 2
  })
}

export async function scanMemberId(image, mimeType, idType) {
  if (
    !Buffer.isBuffer(image) ||
    image.length === 0 ||
    image.length > memberIdImageLimit ||
    !memberIdImageTypes.includes(mimeType)
  ) {
    throw new MemberIdImageError('Upload a JPG or PNG image up to 5 MB.')
  }

  let decoded
  try {
    const input = sharp(image, { limitInputPixels: 20_000_000, failOn: 'warning' })
    const metadata = await input.metadata()
    if (mimeType !== `image/${metadata.format}` || (metadata.pages || 1) > 1)
      throw new MemberIdImageError('Upload a single, valid JPG or PNG image.')
    if (
      Math.min(metadata.width, metadata.height) < 360 ||
      Math.max(metadata.width, metadata.height) < 560
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
      'The image could not be read. Retake the photo and upload a JPG or PNG.'
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

  const portrait = await readDocumentPortrait({ data, width, height })
  if (!portrait) {
    throw new MemberIdImageError(
      'Could not find one clear, uncropped ID portrait. Retake the photo with all four edges visible.'
    )
  }

  const prepared = await rgb().greyscale().normalise().png().toBuffer()
  const worker = await createIdWorker()
  try {
    const result = await worker.recognize(prepared, {}, { text: true, tsv: true })
    if (hasClippedText(result.data.tsv, width, height))
      throw new MemberIdImageError(
        'Text appears cut off at the edge. Retake the photo with all four edges visible.'
      )
    const parsed = parseMemberId(idType, result.data)
    if (parsed.lineCount < 3) {
      throw new MemberIdImageError(
        'Too little text was readable. Retake the photo without glare and include the entire ID.'
      )
    }
    return { ...parsed, portrait }
  } finally {
    await worker.terminate()
  }
}

export async function compareMemberIdFace(frames, actions, portrait, threshold) {
  const live = await readLiveFace(frames, actions)
  if (!live)
    return {
      status: 'needs_review',
      score: null,
      reason: 'The live gesture could not be confirmed.'
    }
  const distance = faceDescriptorDistance(portrait, live)
  // This is an inverse distance score, not a probability of identity.
  const score = Math.round(100 / (1 + distance))
  if (distance <= threshold) return { status: 'verified', score, reason: null }
  return {
    status: distance > threshold + 0.25 ? 'rejected' : 'needs_review',
    score,
    reason:
      distance > threshold + 0.25
        ? 'The live face differs substantially from the ID portrait.'
        : 'The face similarity is too close to the cutoff. Retake the scan or request admin review.'
  }
}
