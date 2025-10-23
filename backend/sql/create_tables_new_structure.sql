-- ====================================
-- RunCrew 테이블 구조 (완전 재설계)
-- users + local_auth + profiles 분리
-- ====================================

-- 기존 테이블 삭제
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.local_auth CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS gender_t CASCADE;

-- 1-1) users: OAuth + 공통 사용자 테이블
CREATE TABLE public.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL CHECK (provider IN ('kakao','naver','local')),
  provider_sub    TEXT NOT NULL,
  email           TEXT,
  nickname        TEXT,
  photo_url       TEXT,
  last_login_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- provider + provider_sub 조합으로 유니크 (OAuth 중복 방지)
CREATE UNIQUE INDEX users_uq_provider_sub
  ON public.users(provider, provider_sub);

-- 이메일 인덱스 (검색용)
CREATE INDEX users_email_idx ON public.users(lower(email)) WHERE email IS NOT NULL;

-- 1-2) local_auth: 이메일/패스워드(해시) 로그인
CREATE TABLE public.local_auth (
  user_id        UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 이메일 대소문자 구분 없이 유니크
CREATE UNIQUE INDEX local_auth_email_unique
  ON public.local_auth(lower(email));

-- 1-3) profiles: 온보딩/추가 정보
CREATE TYPE gender_t AS ENUM ('male','female','other','unknown');

CREATE TABLE public.profiles (
  user_id          UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  nickname         TEXT NOT NULL,
  age              INT CHECK (age BETWEEN 1 AND 120),
  gender           gender_t NOT NULL DEFAULT 'unknown',
  bio              TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  region_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  crew_choice      TEXT,  -- 'have', 'create', 'browse'
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 위치 인덱스
CREATE INDEX profiles_geo_idx ON public.profiles USING btree(lat, lng);

-- 지역 인증 인덱스
CREATE INDEX profiles_region_verified_idx ON public.profiles(region_verified);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END$$;

CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS 비활성화 (service role key 사용)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_auth DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 스키마 캐시 갱신
NOTIFY pgrst, 'reload schema';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 테이블 생성 완료!';
  RAISE NOTICE '  - users: OAuth + 공통 정보';
  RAISE NOTICE '  - local_auth: 이메일/비밀번호';
  RAISE NOTICE '  - profiles: 온보딩 정보';
END $$;

