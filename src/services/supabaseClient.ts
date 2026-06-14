import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const STORAGE_KEY = 'sb-ghdpmlmescgdhvrdqfiz-auth-token'

declare global {
  var __cf_supabase__: SupabaseClient | undefined
  var __cf_supabase_public__: SupabaseClient | undefined
}

function makeSupabase(schema: 'fogueteiros' | 'public'): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema },
    auth: {
      storageKey: STORAGE_KEY,
      persistSession: schema === 'fogueteiros',
      autoRefreshToken: schema === 'fogueteiros',
      detectSessionInUrl: schema === 'fogueteiros',
    },
  })
}

export const supabase: SupabaseClient = (() => {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__cf_supabase__) {
    return (globalThis as any).__cf_supabase__
  }
  const client = makeSupabase('fogueteiros')
  if (typeof globalThis !== 'undefined') {
    ;(globalThis as any).__cf_supabase__ = client
  }
  return client
})()

export const supabasePublic: SupabaseClient = (() => {
  if (typeof globalThis !== 'undefined' && (globalThis as any).__cf_supabase_public__) {
    return (globalThis as any).__cf_supabase_public__
  }
  const client = makeSupabase('public')
  if (typeof globalThis !== 'undefined') {
    ;(globalThis as any).__cf_supabase_public__ = client
  }
  return client
})()
