import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiResponse } from '../utils/api'

export default function ProfileAvatar({ user, large = false, memberId }) {
  const { token } = useAuth()
  const [image, setImage] = useState('')
  const [inView, setInView] = useState(!memberId)
  const avatar = useRef(null)
  useEffect(() => {
    if (inView || !user?.avatarId) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true)
    }, { rootMargin: '160px' })
    observer.observe(avatar.current)
    return () => observer.disconnect()
  }, [inView, user?.avatarId])

  useEffect(() => {
    setImage('')
    if (!inView || !token || !user?.avatarId) return
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
      .catch((error) => {
        // Missing photos use initials. Log unexpected failures for diagnosis.
        if (!controller.signal.aborted && error.status !== 404)
          console.warn('Could not load a FitPulse profile photo:', error.message)
      })
    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [inView, token, user?.avatarId, memberId])
  const initials = (user?.name || 'FitPulse User')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
  return (
    <span ref={avatar} className={`av${large ? ' profile-avatar' : ''}`}>
      {image ? <img src={image} alt="" width={256} height={256} decoding="async" onError={() => setImage('')} /> : initials}
    </span>
  )
}
