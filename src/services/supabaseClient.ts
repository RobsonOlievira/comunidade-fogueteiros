import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Storage key DIFERENTE por schema evita o warning do GoTrueClient:
// "Multiple GoTrueClient instances detected in the same browser context"
// (compartilhar storageKey entre clientes concorrentes causa lock contention
// e getSession pode dar timeout de 5s).
const STORAGE_KEY_FOGUETEIROS = 'sb-ghdpmlmescgdhvrdqfiz-auth-token'

// Lê a sessão diretamente do localStorage sem passar pelo cliente Supabase.
// O supabase.auth.getSession() tenta fazer refresh de token via rede (que pode
// ser bloqueado por AdBlock/proxy e dar timeout de 5s). Essa função é ~síncrona.
export function getSessionFromStorage(): { access_token: string; refresh_token: string; user: any } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOGUETEIROS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Supabase armazena { event: 'SIGNED_IN', session: {...}, ... }
    // ou só { access_token, refresh_token, user } direto
    const session = parsed?.session ?? parsed
    if (session?.access_token && session?.user) return session
    return null
  } catch {
    return null
  }
}
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
