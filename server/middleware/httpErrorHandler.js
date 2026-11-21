export function httpErrorHandler(error, req, res, next) {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.too.large')
    return res.status(413).json({ message: 'This upload is too large.' })
  if (error.type === 'entity.parse.failed')
    return res.status(400).json({ message: 'Invalid request body.' })
  console.error('FitPulse request failed:', error.message)
  return res.status(500).json({ message: 'Something went wrong. Please try again.' })
}
