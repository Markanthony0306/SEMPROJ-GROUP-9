import { parseMemberId } from '../../shared/memberIdParsing.js'

let readerPromise
const modelDirectory = import.meta.env.VITE_ID_OCR_MODEL_DIRECTORY?.replace(/\/+$/, '')

function modelOptions() {
  if (!modelDirectory) return {}
  return {
    textDetectionModelAsset: `${modelDirectory}/PP-OCRv5_mobile_det_onnx_infer.tar`,
    textRecognitionModelAsset: `${modelDirectory}/PP-OCRv5_mobile_rec_onnx_infer.tar`
  }
}

function loadReader() {
  readerPromise ??= import('@paddleocr/paddleocr-js')
    .then(({ PaddleOCR }) =>
      PaddleOCR.create({
        lang: 'en',
        ocrVersion: 'PP-OCRv5',
        ...modelOptions(),
        ortOptions: { backend: 'wasm', numThreads: 1 }
      })
    )
    .catch((error) => {
      readerPromise = undefined
      throw error
    })
  return readerPromise
}

export async function readMemberId(type, front, back) {
  const reader = await loadReader()
  const results = await reader.predict([front, back])
  const [frontFields, backFields] = results.map(
    ({ items }) =>
      parseMemberId(type, {
        lines: items.map(({ text, score }) => ({ text, confidence: Math.round(score * 100) }))
      }).fields
  )

  return Object.fromEntries(
    Object.entries(frontFields).map(([key, field]) => [
      key,
      field.value || backFields[key]?.value || ''
    ])
  )
}
