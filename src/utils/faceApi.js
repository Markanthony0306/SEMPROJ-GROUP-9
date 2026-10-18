function loadingError(message, code, cause) {
  const error = new Error(message, { cause })
  error.code = code
  return error
}

// Share successful loads, but allow a new attempt after a failed request.
export function createFaceApiLoader({ importLibrary, modelsUrl }) {
  let libraryPromise
  let modelsPromise

  return async function loadFaceApi() {
    libraryPromise ||= Promise.resolve()
      .then(importLibrary)
      .catch((cause) => {
        libraryPromise = undefined
        throw loadingError(
          'Face verification could not load. Reload this page, then try again.',
          'FACE_LIBRARY_LOAD_FAILED',
          cause
        )
      })
    const faceapi = await libraryPromise

    modelsPromise ||= Promise.allSettled(
      ['tinyFaceDetector', 'faceLandmark68TinyNet', 'faceRecognitionNet'].map((name) =>
        Promise.resolve().then(() => faceapi.nets[name].loadFromUri(modelsUrl))
      )
    ).then((results) => {
      const failure = results.find((result) => result.status === 'rejected')
      if (failure) {
        modelsPromise = undefined
        throw loadingError(
          'Face detection files could not load. Check your connection and try again.',
          'FACE_MODELS_LOAD_FAILED',
          failure.reason
        )
      }
    })
    await modelsPromise
    return faceapi
  }
}
