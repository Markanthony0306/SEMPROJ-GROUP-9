const PREVIEW_WIDTH = 480
const SAMPLE_WIDTH = 288
const SAMPLE_HEIGHT = 180
const SIGNATURE_COLUMNS = 12
const SIGNATURE_ROWS = 8

let scannerPromise

function openCvReady(module) {
  if (module.Mat) return { cv: module }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('The ID scanner took too long to load.')),
      20000
    )
    const ready = (cv) => {
      clearTimeout(timeout)
      resolve({ cv })
    }
    if (typeof module.then === 'function') {
      // Wrap the OpenCV module to avoid resolving the same thenable again.
      module.then(ready, (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    } else {
      module.onRuntimeInitialized = () => ready(module)
    }
  })
}

export function loadMemberIdCamera() {
  scannerPromise ||= import('./memberIdCameraRuntime.js')
    .then(async ({ openCvModule, scanner }) => {
      const { cv } = await openCvReady(openCvModule)
      return { cv, scanner }
    })
    .catch((error) => {
      scannerPromise = undefined
      throw error
    })
  return scannerPromise
}

function cornersOfCard(cv, scanner, source) {
  const gray = new cv.Mat()
  const edges = new cv.Mat()
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  try {
    cv.cvtColor(source, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, gray, new cv.Size(3, 3), 0)
    cv.Canny(gray, edges, 40, 120)
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    let best = null
    let bestScore = 0
    const frameArea = source.cols * source.rows
    // The jscanify browser module reads OpenCV through this global.
    globalThis.cv = cv
    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index)
      const polygon = new cv.Mat()
      try {
        const area = cv.contourArea(contour)
        if (area <= frameArea * 0.06) continue
        cv.approxPolyDP(contour, polygon, cv.arcLength(contour, true) * 0.025, true)
        if (polygon.rows !== 4 || !cv.isContourConvex(polygon)) continue
        const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } =
          scanner.getCornerPoints(polygon)
        const corners = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner]
        if (corners.some((point) => !point)) continue
        const { width, height } = cardSize(corners)
        if (width / height < 1.2 || width / height > 2.15) continue
        const centered = isCentered(corners, source.cols, source.rows)
        const visible = insideFrame(corners, source.cols, source.rows)
        const score = area * (centered ? 1 : 0.35) * (visible ? 1 : 0.1)
        if (score > bestScore) {
          best = corners
          bestScore = score
        }
      } finally {
        polygon.delete()
        contour.delete()
      }
    }
    return best
  } finally {
    hierarchy.delete()
    contours.delete()
    edges.delete()
    gray.delete()
  }
}

function insideFrame(corners, width, height) {
  return corners.every(
    ({ x, y }) =>
      x >= width * 0.025 && x <= width * 0.975 && y >= height * 0.025 && y <= height * 0.975
  )
}

function isCentered(corners, width, height) {
  const centerX = corners.reduce((sum, { x }) => sum + x, 0) / corners.length / width
  const centerY = corners.reduce((sum, { y }) => sum + y, 0) / corners.length / height
  return Math.abs(centerX - 0.5) < 0.2 && Math.abs(centerY - 0.5) < 0.2
}

function cardSize([topLeft, topRight, bottomRight, bottomLeft]) {
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
  return {
    width: (distance(topLeft, topRight) + distance(bottomLeft, bottomRight)) / 2,
    height: (distance(topLeft, bottomLeft) + distance(topRight, bottomRight)) / 2
  }
}

function warpCard(cv, source, corners, width, height, read) {
  const points = cv.matFromArray(
    4,
    1,
    cv.CV_32FC2,
    corners.flatMap(({ x, y }) => [x, y])
  )
  const target = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    width - 1,
    0,
    width - 1,
    height - 1,
    0,
    height - 1
  ])
  const result = new cv.Mat()
  let transform
  try {
    transform = cv.getPerspectiveTransform(points, target)
    cv.warpPerspective(source, result, transform, new cv.Size(width, height))
    return read(result)
  } finally {
    transform?.delete()
    result.delete()
    target.delete()
    points.delete()
  }
}

function checkImageQuality(pixels) {
  const gray = new Uint8Array(SAMPLE_WIDTH * SAMPLE_HEIGHT)
  let bright = 0
  let dark = 0
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * 4
    const luma = 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2]
    gray[index] = luma
    if (luma > 250) bright += 1
    if (luma < 25) dark += 1
  }
  if (bright / gray.length > 0.85) return { hint: 'Tilt the ID slightly to reduce glare.' }
  if (dark / gray.length > 0.55) return { hint: 'Move into even light so the ID is readable.' }

  let edgeEnergy = 0
  const tiles = new Float32Array(SIGNATURE_COLUMNS * SIGNATURE_ROWS)
  const tileCounts = new Uint16Array(tiles.length)
  for (let y = 2; y < SAMPLE_HEIGHT - 2; y += 1) {
    const row = Math.floor((y * SIGNATURE_ROWS) / SAMPLE_HEIGHT)
    for (let x = 2; x < SAMPLE_WIDTH - 2; x += 1) {
      const index = y * SAMPLE_WIDTH + x
      const value = gray[index]
      const laplacian =
        4 * value -
        gray[index - 1] -
        gray[index + 1] -
        gray[index - SAMPLE_WIDTH] -
        gray[index + SAMPLE_WIDTH]
      edgeEnergy += laplacian ** 2
      const tile = row * SIGNATURE_COLUMNS + Math.floor((x * SIGNATURE_COLUMNS) / SAMPLE_WIDTH)
      tiles[tile] += value
      tileCounts[tile] += 1
    }
  }
  if (edgeEnergy / gray.length < 65) return { hint: 'Hold steady and let the camera focus.' }

  for (let tile = 0; tile < tiles.length; tile += 1) tiles[tile] /= tileCounts[tile]
  // A cluster of white tiles is suspicious on an otherwise colored card.
  const mean = tiles.reduce((sum, value) => sum + value, 0) / tiles.length
  if (bright / gray.length < 0.45 && tiles.filter((value) => value > 252).length >= 5)
    return { hint: 'Tilt the ID slightly to reduce glare.' }
  return { fingerprint: Array.from(tiles, (value) => value - mean) }
}

export function matchesOtherIdSide(fingerprint, previous) {
  if (!previous || fingerprint.length !== previous.length) return false
  let forward = 0
  let rotated = 0
  for (let index = 0; index < fingerprint.length; index += 1) {
    forward += Math.abs(fingerprint[index] - previous[index])
    rotated += Math.abs(fingerprint[index] - previous[previous.length - index - 1])
  }
  return Math.min(forward, rotated) / fingerprint.length < 10
}

export function createMemberIdFrameReader({ cv, scanner }) {
  const frame = document.createElement('canvas')
  const analysis = document.createElement('canvas')
  const capture = document.createElement('canvas')
  const frameContext = frame.getContext('2d', { willReadFrequently: true })
  const analysisContext = analysis.getContext('2d', { willReadFrequently: true })
  if (!frameContext || !analysisContext)
    throw new Error('This browser could not read the ID camera.')

  function read(video) {
    const scale = Math.min(1, 1440 / Math.max(video.videoWidth, video.videoHeight))
    const width = Math.round(video.videoWidth * scale)
    const height = Math.round(video.videoHeight * scale)
    if (frame.width !== width) frame.width = width
    if (frame.height !== height) frame.height = height
    const previewScale = PREVIEW_WIDTH / Math.max(width, height)
    const analysisWidth = Math.round(width * previewScale)
    const analysisHeight = Math.round(height * previewScale)
    if (analysis.width !== analysisWidth) analysis.width = analysisWidth
    if (analysis.height !== analysisHeight) analysis.height = analysisHeight
    frameContext.drawImage(video, 0, 0, width, height)
    analysisContext.drawImage(frame, 0, 0, analysis.width, analysis.height)
    const source = cv.imread(analysis)
    try {
      const corners = cornersOfCard(cv, scanner, source)
      if (!corners) return { hint: 'Hold the ID horizontally with all four corners visible.' }
      const outline = corners.map(({ x, y }) => ({ x: x / analysis.width, y: y / analysis.height }))
      const size = cardSize(corners)
      if (!insideFrame(corners, analysis.width, analysis.height))
        return { outline, hint: 'Move back so all four corners are visible.' }
      if (!isCentered(corners, analysis.width, analysis.height))
        return { outline, hint: 'Center the ID in the camera preview.' }
      if (
        size.width < Math.min(analysis.width * 0.48, analysis.height * 0.9) ||
        (size.width * width) / analysis.width < 280 ||
        (size.height * height) / analysis.height < 165
      )
        return { outline, hint: 'Move the ID closer to the camera.' }
      return {
        outline,
        ...warpCard(cv, source, corners, SAMPLE_WIDTH, SAMPLE_HEIGHT, (image) =>
          checkImageQuality(image.data)
        )
      }
    } finally {
      source.delete()
    }
  }

  function save(outline) {
    const corners = outline.map(({ x, y }) => ({ x: x * frame.width, y: y * frame.height }))
    const size = cardSize(corners)
    const scale = Math.max(1, 520 / size.width, 320 / size.height)
    const width = Math.ceil(size.width * scale)
    const height = Math.ceil(size.height * scale)
    const source = cv.imread(frame)
    try {
      warpCard(cv, source, corners, width, height, (image) => cv.imshow(capture, image))
    } finally {
      source.delete()
    }
    return new Promise((resolve) => capture.toBlob(resolve, 'image/jpeg', 0.94))
  }

  return { read, save }
}
