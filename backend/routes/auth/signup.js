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

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return c.text('올바른 이메일 형식이 아닙니다', 400);
  }

  // 비밀번호 강도 검증
  const pwdValidation = validatePassword(password);
  if (!pwdValidation.valid) {
    return c.text(pwdValidation.message, 400);
  }

  // 닉네임 검증
  const trimmedNickname = nickname.trim();
  if (trimmedNickname.length < 2 || trimmedNickname.length > 30) {
    return c.text('닉네임은 2~30자 사이여야 합니다', 400);
  }

  // 2) 비밀번호 해싱
  console.log('[Signup] Hashing password...');
  const passwordHash = await hashPassword(password);

  // 3) DB에 이메일 중복 확인 + 저장
  const supa = getSupabase(c);
  
  // 이메일 중복 체크
  const { data: existing } = await supa
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) {
    return c.text('이미 가입된 이메일입니다', 409);
  }

  // 회원가입
  const row = {
    provider: 'email',
    provider_sub: `email_${email.toLowerCase()}`, // 고유 식별자
    email: email.toLowerCase(),
    nickname: trimmedNickname,
    password_hash: passwordHash,
    last_login_at: new Date().toISOString(),
  };

  console.log('[Signup] Inserting user...');
  const { data: user, error } = await supa
    .from('users')
    .insert(row)
    .select('id, nickname, email')
    .single();

  if (error) {
    console.error('[Signup] DB error:', error.message, error);
    return c.text('회원가입 실패: ' + error.message, 500);
  }

  console.log('[Signup] User created:', user.id);

  // 4) JWT 발급 및 쿠키 설정
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

  console.log('[Signup] Session cookie set');

  // 5) 성공 응답
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

