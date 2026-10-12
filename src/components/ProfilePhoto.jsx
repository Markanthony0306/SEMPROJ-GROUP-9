import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../utils/api'
import ProfileAvatar from './ProfileAvatar'

async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
    throw new Error('Choose a JPG, PNG, or WebP image smaller than 5 MB.')
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    context.fillStyle = '#f5f8fd'
    context.fillRect(0, 0, 256, 256)
    const size = Math.min(bitmap.width, bitmap.height)
    context.drawImage(
      bitmap,
      (bitmap.width - size) / 2,
      (bitmap.height - size) / 2,
      size,
      size,
      0,
      0,
      256,
      256
    )
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare the photo.'))),
        'image/jpeg',
        0.85
      )
    )
  } finally {
    bitmap.close()
  }
}

export default function ProfilePhoto({ user, onSaved }) {
  const { token } = useAuth()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const upload = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file || pending) return
    setPending(true)
    setMessage('')
    setError('')
    try {
      const body = await preparePhoto(file)
      const result = await apiRequest('/profile/avatar', {
        token,
        method: 'PUT',
        body,
        headers: { 'Content-Type': 'image/jpeg' }
      })
      onSaved({ ...user, avatarId: result.avatarId })
      setMessage('Profile photo saved.')
    } catch (cause) {
      setError(cause.message || 'Could not upload the photo.')
    } finally {
      setPending(false)
      input.value = ''
    }
  }
  return (
    <div className="profile-photo">
      <ProfileAvatar user={user} large />
      <div>
        <label className="photo-picker">
          {pending ? 'Uploading...' : 'Change profile photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            onChange={upload}
          />
        </label>
        <p>JPG, PNG, or WebP · up to 5 MB</p>
        {message && <p role="status">{message}</p>}
        {error && (
          <p className="photo-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
