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

  if (!email || !password) {
    return c.text('이메일과 비밀번호를 입력해주세요', 400);
  }

  const supa = getSupabase(c);

  // 1) local_auth에서 이메일로 조회
  console.log('[Login] Looking up user:', email.toLowerCase());
  const { data: auth, error: authError } = await supa
    .from('local_auth')
    .select('user_id, email, password_hash')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (authError) {
    console.error('[Login] DB error:', authError);
    return c.text('로그인 실패', 500);
  }

  if (!auth) {
    console.log('[Login] User not found');
    return c.text('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  // 2) 비밀번호 검증
  console.log('[Login] Verifying password...');
  const isValid = await verifyPassword(password, auth.password_hash);

  if (!isValid) {
    console.log('[Login] Invalid password');
    return c.text('이메일 또는 비밀번호가 올바르지 않습니다', 401);
  }

  // 3) users 테이블에서 사용자 정보 조회
  const { data: user, error: userError } = await supa
    .from('users')
    .select('id, nickname, email')
    .eq('id', auth.user_id)
    .single();

  if (userError || !user) {
    console.error('[Login] User lookup error:', userError);
    return c.text('로그인 실패', 500);
  }

  // 4) last_login_at 업데이트
  await supa
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

  // 5) JWT 발급 및 쿠키 설정
  const jwt = await signJWT(
    { sub: user.id, nickname: user.nickname },
    c.env,
    60 * 60 * 24 * 30
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
