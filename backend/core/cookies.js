// core/cookies.js
export function setSessionCookie(c, jwt, maxAgeSec = 60 * 60 * 24 * 30) {
  const host = new URL(c.req.url).hostname
  const isLocal = (host === 'localhost' || host === '127.0.0.1')

  // 배포: Secure + SameSite=None + Partitioned
  const attrs = [
    'Path=/',
    'HttpOnly',
    isLocal ? '' : 'Secure',
    isLocal ? 'SameSite=Lax' : 'SameSite=None',
    isLocal ? '' : 'Partitioned',
    `Max-Age=${maxAgeSec}`
  ].filter(Boolean).join('; ')

  // 직접 헤더로 쿠키 셋(Partitioned 지원을 위해 수동 세팅)
  c.header('Set-Cookie', `rc_session=${encodeURIComponent(jwt)}; ${attrs}`)
}
