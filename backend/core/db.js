import { createClient } from '@supabase/supabase-js'

export function getSupabase(c) {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  })
}
