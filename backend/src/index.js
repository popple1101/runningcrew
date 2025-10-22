// backend/src/index.js
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import kakaoRoute from '../routes/auth/kakao.js'
import naverRoute from '../routes/auth/naver.js'
import logoutRoute from '../routes/auth/logout.js'

import sessionRoute from '../routes/auth/session.js' // /me 반환 (세션 확인)
import profileRoute from '../routes/api/profile.js'   // 온보딩 저장

const app = new Hono()

// CORS (GH Pages 도메인 허용 + 쿠키 포함)
// credentials:true에서는 * 불가 → 요청 origin 에코 방식 + allowlist 검사
app.use('/*', (c, next) => {
  const allowList = (c.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const originFn = (origin) => {
    // same-origin/curl 등 origin 없음 → 헤더 미설정
    if (!origin) return ''
    // 로컬 개발 허용
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return origin
    }
    // 별도 설정 없으면(운영 실수 방지) 우선 에코 허용
    if (allowList.length === 0) return origin
    // allowlist에 있을 때만 허용
    return allowList.includes(origin) ? origin : ''
  }

  return cors({
    origin: originFn,
    credentials: true,
    allowMethods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowHeaders: ['Content-Type','Authorization'],
    maxAge: 86400, // preflight 캐시(선택)
  })(c, next)
})

// 헬스체크
app.get('/', (c) => c.json({ ok: true, name: 'RunCrew API' }))

// OAuth
app.route('/auth/kakao', kakaoRoute)
app.route('/auth/naver', naverRoute)
app.route('/auth/logout', logoutRoute)

// 세션/프로필 API
// ✅ 배포 호환: /api/me 로도 노출
app.route('/api/me', sessionRoute)
// (dev 프록시 호환 원하면 아래도 유지)
app.route('/me', sessionRoute)

app.route('/api/profile', profileRoute)

export default app
