import { execFile } from 'node:child_process'
import { inflateRawSync } from 'node:zlib'
import sharp from 'sharp'
import { memberIdFileLimit } from '../../shared/memberIdTypes.js'

const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex')
const jpegSignature = Buffer.from('ffd8ff', 'hex')
const compoundSignature = Buffer.from('d0cf11e0a1b11ae1', 'hex')
const pdfType = 'application/pdf'
const docType = 'application/msword'
const docxType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const pixelLimit = 20_000_000
const badSides = 'The ID is unreadable. Include one clear image of the front and one of the back.'
const badFormat = 'Upload JPG, PNG, PDF, DOC, or DOCX files up to 5 MB each.'

export class MemberIdFileError extends Error {}
export class MemberIdConverterError extends Error {}

const startsWith = (bytes, signature) => bytes.subarray(0, signature.length).equals(signature)
const invalid = () => new MemberIdFileError(badSides)

function imageType(bytes) {
  if (startsWith(bytes, jpegSignature)) return 'image/jpeg'
  if (startsWith(bytes, pngSignature)) return 'image/png'
  return null
}

export function memberIdFileType(bytes) {
  if (/^%PDF-\d\.\d/.test(bytes.toString('ascii', 0, 8))) return pdfType
  if (startsWith(bytes, compoundSignature)) return docType
  if (bytes.length >= 22 && bytes.readUInt32LE(0) === 0x04034b50) return docxType
  return imageType(bytes)
}

async function idImage(bytes) {
  const type = imageType(bytes)
  if (!type) throw invalid()
  try {
    const image = sharp(bytes, { limitInputPixels: pixelLimit, failOn: 'warning' })
    const { width, height, format, pages = 1 } = await image.metadata()
    if (type !== `image/${format}` || pages !== 1 || Math.min(width, height) < 140) throw invalid()
    return await image
      .autoOrient()
      .resize(1700, 1700, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .removeAlpha()
      .png()
      .toBuffer()
  } catch {
    throw invalid()
  }
}

// A two-sided scan can place both images on one page. Split on a substantial
// blank gutter and keep each side large enough for portrait detection later.
async function splitScannedPage(image) {
  const { data, info } = await sharp(image)
    .resize(180, 180, { fit: 'inside' })
    .greyscale()
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info

  function findGutter(length, depth, sample) {
    const filled = Array.from({ length }, (_, line) => {
      let marks = 0
      for (let offset = 0; offset < depth; offset += 1) {
        if (sample(line, offset) < 235) marks += 1
      }
      return marks >= depth * 0.12
    })
    const first = filled.indexOf(true)
    const last = filled.lastIndexOf(true)
    const sideMinimum = Math.ceil(length * 0.19)
    let gapStart = -1
    for (let index = first + sideMinimum; index <= last - sideMinimum; index += 1) {
      if (!filled[index]) {
        if (gapStart < 0) gapStart = index
      } else if (gapStart >= 0) {
        if (index - gapStart >= length * 0.045) return (index + gapStart) / 2 / length
        gapStart = -1
      }
    }
    return null
  }

  const rows = findGutter(height, width, (row, column) => data[row * width + column])
  const columns = findGutter(width, height, (column, row) => data[row * width + column])
  if (!rows && !columns) throw invalid()
  const source = sharp(image)
  const size = await source.metadata()
  const horizontal = rows !== null
  const split = Math.round((horizontal ? rows : columns) * (horizontal ? size.height : size.width))
  const boxes = horizontal
    ? [
        { left: 0, top: 0, width: size.width, height: split },
        { left: 0, top: split, width: size.width, height: size.height - split }
      ]
    : [
        { left: 0, top: 0, width: split, height: size.height },
        { left: split, top: 0, width: size.width - split, height: size.height }
      ]
  return Promise.all(boxes.map((box) => source.clone().extract(box).png().toBuffer()))
}

async function checkSideContent(image) {
  const pixels = await sharp(image)
    .resize(200, 200, { fit: 'inside' })
    .toColourspace('b-w')
    .raw()
    .toBuffer()
  let dark = 0
  let detail = 0
  let total = 0
  let totalSquared = 0
  for (const pixel of pixels) {
    if (pixel < 20) dark += 1
    if (pixel < 205) detail += 1
    total += pixel
    totalSquared += pixel * pixel
  }
  const variance = totalSquared / pixels.length - (total / pixels.length) ** 2
  if (detail < pixels.length * 0.012 || dark > pixels.length * 0.9 || variance < 20) throw invalid()
}

function renderPdfPage(bytes, page) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      process.env.ID_PDF_RENDERER || 'pdftoppm',
      ['-f', String(page), '-l', String(page), '-singlefile', '-scale-to', '1700', '-png', '-'],
      { encoding: 'buffer', timeout: 7000, maxBuffer: 8 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        if (!error && stdout.length) return resolve(stdout)
        if (error?.code === 'ENOENT' || error?.code === 'EACCES' || error?.killed)
          return reject(
            new MemberIdConverterError(
              'PDF reading is unavailable. Ask the gym admin to check the server setup.'
            )
          )
        if (page === 2 && /first page.*last page|wrong page range/i.test(stderr.toString()))
          return resolve(null)
        reject(invalid())
      }
    )
    child.stdin.on('error', () => {
      // The callback reports a renderer that failed before reading stdin.
    })
    child.stdin.end(bytes)
  })
}

// Read only the required ZIP entries, without extracting filenames onto disk.
// Central directory sizes and bounded inflation prevent oversized archives.
function docxPictures(bytes) {
  const eocd = bytes.lastIndexOf(Buffer.from('504b0506', 'hex'))
  if (eocd < 0 || eocd + 22 > bytes.length || bytes.readUInt16LE(eocd + 4) !== 0) throw invalid()
  const count = bytes.readUInt16LE(eocd + 10)
  let cursor = bytes.readUInt32LE(eocd + 16)
  if (count > 256 || cursor + bytes.readUInt32LE(eocd + 12) !== eocd) throw invalid()
  const entries = new Map()
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > eocd || bytes.readUInt32LE(cursor) !== 0x02014b50) throw invalid()
    const nameEnd = cursor + 46 + bytes.readUInt16LE(cursor + 28)
    const next = nameEnd + bytes.readUInt16LE(cursor + 30) + bytes.readUInt16LE(cursor + 32)
    if (next > eocd) throw invalid()
    const name = bytes.toString('utf8', cursor + 46, nameEnd)
    if (entries.has(name)) throw invalid()
    entries.set(name, cursor)
    cursor = next
  }

  function readEntry(name, limit) {
    const index = entries.get(name)
    if (index === undefined) throw invalid()
    const method = bytes.readUInt16LE(index + 10)
    const size = bytes.readUInt32LE(index + 24)
    const compressed = bytes.readUInt32LE(index + 20)
    const local = bytes.readUInt32LE(index + 42)
    if (
      size > limit ||
      local + 30 > eocd ||
      bytes.readUInt32LE(local) !== 0x04034b50 ||
      bytes.readUInt16LE(index + 8) & 1
    )
      throw invalid()
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28)
    if (start + compressed > eocd || ![0, 8].includes(method)) throw invalid()
    const input = bytes.subarray(start, start + compressed)
    const result = method === 0 ? input : inflateRawSync(input, { maxOutputLength: limit })
    if (result.length !== size) throw invalid()
    return result
  }

  const types = readEntry('[Content_Types].xml', 100_000).toString('utf8')
  if (
    !types.includes(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
    )
  )
    throw new MemberIdFileError(badFormat)
  const document = readEntry('word/document.xml', 512_000).toString('utf8')
  const relationships = readEntry('word/_rels/document.xml.rels', 100_000).toString('utf8')
  const embeddedIds = Array.from(
    document.matchAll(/<(?:\w+:)?(?:blip|imagedata)\b[^>]*\br:(?:embed|id)=["']([^"']+)["']/g),
    (match) => match[1]
  )
  const media = new Map()
  for (const [entry] of relationships.matchAll(/<Relationship\s[^>]+>/g)) {
    const id = /\bId=["']([^"']+)["']/.exec(entry)?.[1]
    const target = /\bTarget=["'](media\/[a-z0-9_.-]+)["']/i.exec(entry)?.[1]
    if (id && target && !/\bTargetMode=["']External/i.test(entry)) media.set(id, `word/${target}`)
  }
  const pictures = embeddedIds.filter((id) => media.has(id))
  if (pictures.length < 1 || pictures.length > 2) throw invalid()
  return pictures.map((id) => readEntry(media.get(id), memberIdFileLimit))
}

// Legacy Word documents use a Compound File Binary directory. Checking for
// WordDocument in that directory distinguishes DOC from other OLE formats.
function wordStreams(bytes) {
  if (bytes.length < 512 || bytes.readUInt16LE(28) !== 0xfffe) throw invalid()
  const shift = bytes.readUInt16LE(30)
  if (![9, 12].includes(shift)) throw invalid()
  const sectorSize = 1 << shift
  const sectorCount = Math.floor(bytes.length / sectorSize) - 1
  function sector(id) {
    if (id >= sectorCount) throw invalid()
    const offset = (id + 1) * sectorSize
    return bytes.subarray(offset, offset + sectorSize)
  }
  const fatCount = bytes.readUInt32LE(44)
  if (fatCount < 1 || fatCount > 109) throw invalid()
  const fat = Array.from({ length: fatCount }, (_, index) =>
    sector(bytes.readUInt32LE(76 + 4 * index))
  )
  function nextSector(id) {
    const offset = id * 4
    const block = fat[Math.floor(offset / sectorSize)]
    if (!block) throw invalid()
    return block.readUInt32LE(offset % sectorSize)
  }

  function blocks(first, getBlock, nextBlock, count = sectorCount) {
    const list = []
    const seen = new Set()
    let id = first
    while (id !== 0xfffffffe && list.length < count) {
      if (seen.has(id)) throw invalid()
      seen.add(id)
      list.push(getBlock(id))
      id = nextBlock(id)
    }
    if (id !== 0xfffffffe) throw invalid()
    return Buffer.concat(list)
  }

  const directory = blocks(bytes.readUInt32LE(48), sector, nextSector)
  const streams = new Map()
  let root
  for (let offset = 0; offset + 128 <= directory.length; offset += 128) {
    const kind = directory[offset + 66]
    const nameSize = directory.readUInt16LE(offset + 64)
    if (nameSize < 4 || nameSize > 64 || nameSize % 2 || ![2, 5].includes(kind)) continue
    const name = directory.toString('utf16le', offset, offset + nameSize - 2)
    const start = directory.readUInt32LE(offset + 116)
    const size = directory.readBigUInt64LE(offset + 120)
    if (size > BigInt(bytes.length)) throw invalid()
    const stream = { start, size: Number(size) }
    if (kind === 5) root = stream
    else streams.set(name, stream)
  }
  if (!root || !streams.has('WordDocument')) throw new MemberIdFileError(badFormat)

  let miniFat
  let miniStream
  function readStream(name) {
    const entry = streams.get(name)
    if (!entry?.size) return Buffer.alloc(0)
    if (entry.size >= 4096) {
      const data = blocks(entry.start, sector, nextSector, Math.ceil(entry.size / sectorSize))
      if (data.length < entry.size) throw invalid()
      return data.subarray(0, entry.size)
    }
    if (bytes.readUInt16LE(32) !== 6 || bytes.readUInt32LE(56) !== 4096) throw invalid()
    miniFat ??= blocks(bytes.readUInt32LE(60), sector, nextSector, bytes.readUInt32LE(64))
    miniStream ??= blocks(root.start, sector, nextSector, Math.ceil(root.size / sectorSize))
    const data = blocks(
      entry.start,
      (id) => {
        if (id * 64 + 64 > root.size) throw invalid()
        return miniStream.subarray(id * 64, id * 64 + 64)
      },
      (id) => miniFat.readUInt32LE(id * 4),
      Math.ceil(entry.size / 64)
    )
    if (data.length < entry.size) throw invalid()
    return data.subarray(0, entry.size)
  }

  const word = readStream('WordDocument')
  if (word.length < 32 || word.readUInt16LE(0) !== 0xa5ec) throw new MemberIdFileError(badFormat)
  return [readStream('Data'), word]
}

function scanPictures(bytes) {
  const pictures = []
  const jpegEnd = Buffer.from('ffd9', 'hex')
  let start = 0
  // Corrupt streams can contain many false signatures. Bound the number of
  // candidates inspected even when there is no decodable picture.
  for (
    let candidate = 0;
    candidate < 16 && start < bytes.length && pictures.length < 3;
    candidate += 1
  ) {
    const jpeg = bytes.indexOf(jpegSignature, start)
    const png = bytes.indexOf(pngSignature, start)
    if (jpeg < 0 && png < 0) break
    if (jpeg >= 0 && (png < 0 || jpeg < png)) {
      let marker = jpeg + 2
      while (marker + 4 < bytes.length && bytes[marker] === 0xff) {
        if (bytes[marker + 1] === 0xda) break // start of image scan
        const size = bytes.readUInt16BE(marker + 2)
        if (size < 2) break
        marker += size + 2
      }
      const end = bytes.indexOf(jpegEnd, marker)
      if (end < 0) break
      pictures.push(bytes.subarray(jpeg, end + 2))
      start = end + 2
      continue
    }
    let offset = png + pngSignature.length
    while (offset + 12 <= bytes.length) {
      const end = offset + bytes.readUInt32BE(offset) + 12
      if (end > bytes.length) break
      if (bytes.toString('ascii', offset + 4, offset + 8) === 'IEND') {
        pictures.push(bytes.subarray(png, end))
        break
      }
      offset = end
    }
    start = Math.max(png + pngSignature.length, offset)
  }
  return pictures
}

function compoundPictures(bytes) {
  const [data, word] = wordStreams(bytes)
  const pictures = scanPictures(data)
  return pictures.length ? pictures : scanPictures(word)
}

async function documentSides({ mimeType, bytes }) {
  let pictures
  if (mimeType !== memberIdFileType(bytes)) throw new MemberIdFileError(badFormat)
  if (mimeType === pdfType) {
    const front = await renderPdfPage(bytes, 1)
    const back = await renderPdfPage(bytes, 2)
    pictures = back ? [front, back] : [front]
  } else if (mimeType === docxType) {
    pictures = docxPictures(bytes)
  } else if (mimeType === docType) {
    pictures = compoundPictures(bytes)
  } else {
    throw new MemberIdFileError(badFormat)
  }
  if (pictures.length === 1) return splitScannedPage(await idImage(pictures[0]))
  if (pictures.length !== 2) throw invalid()
  return Promise.all(pictures.map(idImage))
}

export async function validateMemberIdFiles(files) {
  if (
    files.some(
      ({ bytes }) => !Buffer.isBuffer(bytes) || !bytes.length || bytes.length > memberIdFileLimit
    )
  )
    throw new MemberIdFileError(badFormat)

  try {
    let sides
    if (files.length === 1 && files[0].side === 'document') {
      sides = await documentSides(files[0])
    } else {
      const front = files.find(({ side }) => side === 'front')
      const back = files.find(({ side }) => side === 'back')
      if (files.length !== 2 || !front || !back) throw invalid()
      if ([front, back].some(({ bytes, mimeType }) => imageType(bytes) !== mimeType))
        throw new MemberIdFileError(badFormat)
      sides = await Promise.all([idImage(front.bytes), idImage(back.bytes)])
    }
    await Promise.all(sides.map(checkSideContent))
    if (sides[0].equals(sides[1])) throw invalid()
  } catch (error) {
    if (error instanceof MemberIdConverterError || error instanceof MemberIdFileError) throw error
    throw invalid()
  }
}

export async function memberIdFrontImage(file) {
  try {
    return file.side === 'front' ? await idImage(file.bytes) : (await documentSides(file))[0]
  } catch (error) {
    if (error instanceof MemberIdConverterError || error instanceof MemberIdFileError) throw error
    throw invalid()
  }
}
