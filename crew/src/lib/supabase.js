import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// 디버그(임시): 값이 제대로 읽히는지 확인
if (!url || !anon) {
  console.error('ENV not loaded', { url, hasAnon: !!anon })
}

export const supabase = createClient(url, anon)
