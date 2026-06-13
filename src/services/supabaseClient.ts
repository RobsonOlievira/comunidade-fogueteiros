import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const STORAGE_KEY = 'sb-ghdpmlmescgdhvrdqfiz-auth-token'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'fogueteiros' },
  auth: {
    storageKey: STORAGE_KEY,
  },
})

export const supabasePublic: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
  auth: {
    storageKey: STORAGE_KEY,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})
