// backend/core/password.js
// Cloudflare Workers 호환 비밀번호 해싱 (Web Crypto API 사용)

/**
 * 비밀번호를 해싱합니다 (PBKDF2 + SHA-256)
 * @param {string} password - 평문 비밀번호
 * @returns {Promise<string>} - "salt:hash" 형태의 문자열
 */
export async function hashPassword(password) {
  // 랜덤 salt 생성 (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // 비밀번호를 PBKDF2로 해싱
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // 보안을 위해 10만번 반복
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );
  
  // Base64로 인코딩
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  
  return `${saltB64}:${hashB64}`;
}

/**
 * 비밀번호를 검증합니다
 * @param {string} password - 입력된 평문 비밀번호
 * @param {string} storedHash - DB에 저장된 "salt:hash"
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  try {
    const [saltB64, expectedHashB64] = storedHash.split(':');
    if (!saltB64 || !expectedHashB64) return false;
    
    // Base64 디코딩
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    
    // 입력된 비밀번호로 해시 생성
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    
    // 타이밍 공격 방지를 위한 constant-time 비교
    return hashB64 === expectedHashB64;
  } catch {
    return false;
  }
}

/**
 * 비밀번호 강도 검증
 * @param {string} password
 * @returns {{valid: boolean, message: string}}
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다' };
  }
  if (password.length > 100) {
    return { valid: false, message: '비밀번호가 너무 깁니다' };
  }
  // 최소 1개의 영문자와 1개의 숫자 포함
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: '비밀번호는 영문자와 숫자를 모두 포함해야 합니다' };
  }
  return { valid: true, message: 'OK' };
}

