import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiResponse } from '../utils/api'

export default function ProfileAvatar({ user, large = false, memberId }) {
  const { token } = useAuth()
  const [image, setImage] = useState('')
  useEffect(() => {
    setImage('')
    if (!user?.avatarId) return
    const controller = new AbortController()
    let url = ''
    apiResponse(memberId ? `/members/${encodeURIComponent(memberId)}/avatar` : '/profile/avatar', {
      token,
      signal: controller.signal
    })
      .then((response) => response.blob())
      .then((blob) => {
        if (controller.signal.aborted) return
        url = URL.createObjectURL(blob)
        setImage(url)
      })
      .catch(() => {})
    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [token, user?.avatarId, memberId])
  const initials = (user?.name || 'FitPulse User')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
  return (
    <span className={`av${large ? ' profile-avatar' : ''}`}>
      {image ? <img src={image} alt="" onError={() => setImage('')} /> : initials}
    </span>
  )
}
