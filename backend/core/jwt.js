import * as jose from 'jose'

export async function signJWT(payload, env, expSec = 60 * 60 * 24 * 30) {
  const secret = new TextEncoder().encode(env.AUTH_SECRET)
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expSec}s`)
    .sign(secret)
}

export async function signState(obj, env, expSec = 600) {
  const secret = new TextEncoder().encode(env.AUTH_SECRET)
  return await new jose.SignJWT(obj)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${expSec}s`)
    .sign(secret)
}

export async function verifyState(token, env) {
  const secret = new TextEncoder().encode(env.AUTH_SECRET)
  const { payload } = await jose.jwtVerify(token, secret)
  return payload
}

export async function verifyJWT(token, env) {
  const secret = new TextEncoder().encode(env.AUTH_SECRET)
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  })
  return payload
}
