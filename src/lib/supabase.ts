import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn('Supabase URL or KEY not set in env')
}
export const supabase = createClient(url, key)
export const supabaseConfigured = Boolean(url && key)
