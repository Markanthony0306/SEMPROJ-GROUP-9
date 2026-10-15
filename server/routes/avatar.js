import crypto from 'node:crypto'
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
  supabase,
  authenticate,
  requireRole,
  rateLimit
}) {
  const router = express.Router()
  router.put(
    '/profile/avatar',
    authenticate,
    rateLimit({ windowMs: 60000, max: 10 }),
    express.raw({ type: 'image/jpeg', limit: '256kb' }),
    async (req, res) => {
      if (!isJpeg(req.body))
        return res
          .status(400)
          .json({ message: 'Upload a JPEG photo up to 512 × 512 pixels and 256 KB.' })
      const { data: account, error: accountError } = await supabase
        .from('users')
        .select('avatar_path')
        .eq('id', req.user.id)
        .maybeSingle()
      if (accountError || !account)
        return res.status(401).json({ message: 'Your account could not be found.' })

      const avatarId = `${req.user.id}/${crypto.randomUUID()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(avatarId, req.body, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        })
      if (uploadError) {
        console.error('Avatar upload failed:', uploadError.message)
        return res.status(503).json({ message: 'Unable to save your profile photo.' })
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_path: avatarId })
        .eq('id', req.user.id)
      if (updateError) {
        await supabase.storage.from('avatars').remove([avatarId])
        console.error('Avatar profile update failed:', updateError.message)
        return res.status(503).json({ message: 'Unable to save your profile photo.' })
      }

      if (account.avatar_path) {
        const { error } = await supabase.storage.from('avatars').remove([account.avatar_path])
        if (error) console.error('Previous avatar cleanup failed:', error.message)
      }
      res.set('Cache-Control', 'no-store').json({ avatarId })
    }
  )
  const servePhoto = async (req, res) => {
    const { data: account, error: accountError } = await supabase
      .from('users')
      .select('avatar_path')
      .eq('id', req.params.id || req.user.id)
      .maybeSingle()
    if (accountError || !account?.avatar_path)
      return res.status(404).json({ message: 'No profile photo uploaded.' })
    const { data: photo, error: photoError } = await supabase.storage
      .from('avatars')
      .download(account.avatar_path)
    if (photoError || !photo)
      return res.status(404).json({ message: 'Profile photo is unavailable.' })
    res.set({
      'Cache-Control': 'private, no-store',
      'Content-Type': 'image/jpeg',
      'X-Content-Type-Options': 'nosniff'
    })
    return res.send(Buffer.from(await photo.arrayBuffer()))
  }
  router.get('/profile/avatar', authenticate, servePhoto)
  router.get('/members/:id/avatar', authenticate, requireRole('admin', 'staff'), servePhoto)
  return router
}
