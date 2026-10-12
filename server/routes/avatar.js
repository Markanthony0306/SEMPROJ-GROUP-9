import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'

// The browser crops and re-encodes uploads as JPEG; never accept executable SVG.
function isJpeg(buffer) {
  if (
    !Buffer.isBuffer(buffer) ||
    buffer.length < 16 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8 ||
    buffer.at(-2) !== 0xff ||
    buffer.at(-1) !== 0xd9
  )
    return false
  // Locate a start-of-frame marker and bound the decoded dimensions.
  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset++] !== 0xff) return false
    while (offset < buffer.length && buffer[offset] === 0xff) offset++
    if (offset + 9 >= buffer.length) return false
    const marker = buffer[offset++]
    if (marker === 0xda || marker === 0xd9) return false
    const length = buffer.readUInt16BE(offset)
    if (length < 2 || offset + length > buffer.length) return false
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8) return false
      const height = buffer.readUInt16BE(offset + 3)
      const width = buffer.readUInt16BE(offset + 5)
      return width > 0 && height > 0 && width <= 512 && height <= 512
    }
    offset += length
  }
  return false
}

export function avatarRoutes({
  loadDatabase,
  saveDatabase,
  authenticate,
  requireRole,
  rateLimit,
  directory
}) {
  const router = express.Router()
  const uploadDirectory = process.env.AVATAR_DIR || path.join(directory, 'uploads', 'avatars')
  router.put(
    '/profile/avatar',
    authenticate,
    rateLimit({ windowMs: 60000, max: 10 }),
    express.raw({ type: 'image/jpeg', limit: '256kb' }),
    (req, res) => {
      if (!isJpeg(req.body))
        return res
          .status(400)
          .json({ message: 'Upload a JPEG photo up to 512 × 512 pixels and 256 KB.' })
      const database = loadDatabase()
      const account = database.accounts.find((item) => item.id === req.user.id)
      if (!account) return res.status(401).json({ message: 'Your account could not be found.' })
      fs.mkdirSync(uploadDirectory, { recursive: true })
      const oldAvatarId = account.avatarId
      const avatarId = crypto.randomUUID()
      fs.writeFileSync(path.join(uploadDirectory, `${avatarId}.jpg`), req.body, { flag: 'wx' })
      account.avatarId = avatarId
      saveDatabase(database)
      // Replacing a photo also removes the previous generated upload.
      if (oldAvatarId && /^[a-f0-9-]{36}$/.test(oldAvatarId)) {
        const oldFile = path.join(uploadDirectory, `${oldAvatarId}.jpg`)
        try {
          fs.unlinkSync(oldFile)
        } catch (error) {
          if (error.code !== 'ENOENT') console.error('Previous avatar cleanup failed.')
        }
      }
      res.set('Cache-Control', 'no-store').json({ avatarId })
    }
  )
  const servePhoto = (req, res) => {
    const account = loadDatabase().accounts.find(
      (item) => item.id === (req.params.id || req.user.id)
    )
    if (!account?.avatarId || !/^[a-f0-9-]{36}$/.test(account.avatarId))
      return res.status(404).json({ message: 'No profile photo uploaded.' })
    const file = path.join(uploadDirectory, `${account.avatarId}.jpg`)
    if (!fs.existsSync(file))
      return res.status(404).json({ message: 'Profile photo is unavailable.' })
    res.set({
      'Cache-Control': 'private, no-store',
      'Content-Type': 'image/jpeg',
      'X-Content-Type-Options': 'nosniff'
    })
    return res.sendFile(path.resolve(file))
  }
  router.get('/profile/avatar', authenticate, servePhoto)
  router.get('/members/:id/avatar', authenticate, requireRole('admin', 'staff'), servePhoto)
  return router
}
