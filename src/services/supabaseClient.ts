import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Storage key DIFERENTE por schema evita o warning do GoTrueClient:
// "Multiple GoTrueClient instances detected in the same browser context"
// (compartilhar storageKey entre clientes concorrentes causa lock contention
// e getSession pode dar timeout de 5s).
const STORAGE_KEY_FOGUETEIROS = 'sb-ghdpmlmescgdhvrdqfiz-auth-token'
const STORAGE_KEY_PUBLIC = 'sb-ghdpmlmescgdhvrdqfiz-auth-token-public'

declare global {
  var __cf_supabase__: SupabaseClient | undefined
  var __cf_supabase_public__: SupabaseClient | undefined
}

function makeSupabase(schema: 'fogueteiros' | 'public'): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema },
    auth: {
      // Cliente "public" só é usado pra queries de leitura no schema public
      // (perfis, courses) — não precisa de sessão própria. Mantemos o
      // storageKey DIFERENTE pra eliminar conflito com o cliente principal.
      storageKey: schema === 'fogueteiros' ? STORAGE_KEY_FOGUETEIROS : STORAGE_KEY_PUBLIC,
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
