// core/cookies.js
import { setCookie } from 'hono/cookie'

export function setSessionCookie(c, jwt, maxAgeSec = 60 * 60 * 24 * 30) {
  const host = new URL(c.req.url).hostname
  const isLocal = (host === 'localhost' || host === '127.0.0.1')

  setCookie(c, 'rc_session', jwt, {
    path: '/',
    httpOnly: true,
    sameSite: isLocal ? 'Lax' : 'None', // 배포: None
    secure: !isLocal,                   // 배포: true
    maxAge: maxAgeSec,
  })
}
