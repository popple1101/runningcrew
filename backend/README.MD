# install
npm install
npm install hono @supabase/supabase-js jose web-push
npm install -D wrangler 



# 로그인 (최초 1회만)
npx wrangler login
# 본인 확인
npx wrangler whoami
# V 생성 (캐시/임시저장소)
npx wrangler kv namespace create "KV_APP"

# 로컬 실행 테스트
npx wrangler dev

# 실제 배포
npx wrangler deploy