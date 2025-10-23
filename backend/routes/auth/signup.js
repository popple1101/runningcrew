// routes/auth/signup.js
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { getSupabase } from '../../core/db.js';
import { hashPassword, validatePassword } from '../../core/password.js';
import { signJWT } from '../../core/jwt.js';

const app = new Hono();

/**
 * 일반 회원가입
 * POST /auth/signup
 * Body: { email, password, nickname }
 */
app.post('/', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.text('Bad Request: invalid JSON', 400);
  }

  const { email, password, nickname } = body;

  // 1) 입력 검증
  if (!email || !password || !nickname) {
    return c.text('이메일, 비밀번호, 닉네임을 모두 입력해주세요', 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.text('올바른 이메일 형식이 아닙니다', 400);
  }

  const pwdValidation = validatePassword(password);
  if (!pwdValidation.valid) {
    return c.text(pwdValidation.message, 400);
  }

  const trimmedNickname = nickname.trim();
  if (trimmedNickname.length < 2 || trimmedNickname.length > 30) {
    return c.text('닉네임은 2~30자 사이여야 합니다', 400);
  }

  const supa = getSupabase(c);

  // 2) 이메일 중복 체크 (local_auth 테이블)
  const { data: existing } = await supa
    .from('local_auth')
    .select('user_id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) {
    return c.text('이미 가입된 이메일입니다', 409);
  }

  // 3) 비밀번호 해싱
  console.log('[Signup] Hashing password...');
  const passwordHash = await hashPassword(password);

  // 4) users 테이블에 기본 정보 저장
  const userRow = {
    provider: 'local',
    provider_sub: `local_${email.toLowerCase()}`,
    email: email.toLowerCase(),
    nickname: trimmedNickname,
    last_login_at: new Date().toISOString(),
  };

  console.log('[Signup] Creating user...');
  const { data: user, error: userError } = await supa
    .from('users')
    .insert(userRow)
    .select('id, nickname, email')
    .single();

  if (userError) {
    console.error('[Signup] User creation error:', userError);
    return c.text('회원가입 실패: ' + userError.message, 500);
  }

  // 5) local_auth 테이블에 비밀번호 저장
  const authRow = {
    user_id: user.id,
    email: email.toLowerCase(),
    password_hash: passwordHash,
  };

  const { error: authError } = await supa
    .from('local_auth')
    .insert(authRow);

  if (authError) {
    // users 롤백 (cascade로 자동 삭제되지만 명시적으로)
    await supa.from('users').delete().eq('id', user.id);
    console.error('[Signup] Auth creation error:', authError);
    return c.text('회원가입 실패: ' + authError.message, 500);
  }

  console.log('[Signup] User created:', user.id);

  // 6) JWT 발급 및 쿠키 설정
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

  console.log('[Signup] Session cookie set');

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
