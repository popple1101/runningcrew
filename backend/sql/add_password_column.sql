-- 일반 회원가입을 위한 password_hash 컬럼 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- password_hash 인덱스 생성 (검색 최적화)
CREATE INDEX IF NOT EXISTS users_password_hash_idx 
ON public.users (password_hash) 
WHERE password_hash IS NOT NULL;

-- 이메일 필수로 변경 (일반 로그인용)
-- OAuth는 email이 없을 수 있으므로 provider='email'일 때만 필수
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_email_required_for_email_provider;

ALTER TABLE public.users
ADD CONSTRAINT users_email_required_for_email_provider
CHECK (
  (provider = 'email' AND email IS NOT NULL AND password_hash IS NOT NULL)
  OR 
  (provider IN ('kakao', 'naver'))
);

-- 완료 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('email', 'password_hash');

