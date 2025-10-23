// routes/auth/login.js
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { getSupabase } from '../../core/db.js';
import { verifyPassword } from '../../core/password.js';
import { signJWT } from '../../core/jwt.js';

const app = new Hono();

/**
 * 일반 로그인
 * POST /auth/login
 * Body: { email, password }
 */
app.post('/', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.text('Bad Request: invalid JSON', 400);
  }

  const { email, password } = body;

  // 1) 입력 검증
  if (!email || !password) {
    return c.text('이메일과 비밀번호를 입력해주세요', 400);
  }

  // 2) DB에서 사용자 조회
  const supa = getSupabase(c);
  
  console.log('[Login] Looking up user:', email.toLowerCase());
  const { data: user, error } = await supa
    .from('users')
    .select('id, email, nickname, password_hash, provider')
    .eq('email', email.toLowerCase())
    .eq('provider', 'email') // 일반 회원가입 사용자만
    .maybeSingle();

  if (error) {
    console.error('[Login] DB error:', error);
    return c.text('로그인 실패', 500);
  }

  if (!user) {
    console.log('[Login] User not found');
    return c.text('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  if (!user.password_hash) {
    console.log('[Login] No password hash (OAuth user?)');
    return c.text('소셜 로그인으로 가입된 계정입니다', 400);
  }

  // 3) 비밀번호 검증
  console.log('[Login] Verifying password...');
  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    console.log('[Login] Invalid password');
    return c.text('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  // 4) last_login_at 업데이트
  await supa
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

  // 5) JWT 발급 및 쿠키 설정
  const jwt = await signJWT(
    { sub: String(user.id), nickname: user.nickname },
    c.env,
    60 * 60 * 24 * 30 // 30일
  );

  const host = new URL(c.req.url).hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';

  setCookie(c, 'rc_session', jwt, {
    path: '/',
    httpOnly: true,
    sameSite: isLocal ? 'Lax' : 'None',
    secure: isLocal ? false : true,
    maxAge: 60 * 60 * 24 * 30,
  });

  console.log('[Login] Login successful, user ID:', user.id);

  // 6) 성공 응답
  return c.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    },
  });
});

export default app;

