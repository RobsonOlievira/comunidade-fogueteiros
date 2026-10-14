import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { consumeAuthTokenHashEarly } from '@/src/services/authConfirmEarly'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// =====================================================================
// WORKAROUND: clock skew do servidor Supabase
// =====================================================================
// Projeto ghdpmlmescgdhvrdqfiz: medido em 2026-07-03 que o header `Date`
// do servidor auth retorna ~13s no futuro do relÃ³gio UTC real. Isso faz
// o auth-js emitir console.warn "Session as retrieved from URL was issued
// in the future? Check the device clock for skew" quando o iat do JWT Ã©
// comparado com Date.now() do cliente.
//
// O check Ã© puramente `console.warn` (nÃ£o throw) no auth-js atual, entÃ£o
// a sessÃ£o Ã‰ salva normalmente â€” esse warning Ã© cosmÃ©tico. Mas polui o
// console e confunde quem estÃ¡ debugando. Silenciamos esse caso e
// loggamos uma vez em DEV com a diferenÃ§a real pra referÃªncia.
//
// Remover quando o Supabase sincronizar o NTP do projeto (ticket aberto).
// =====================================================================
;(function suppressClockSkewWarning() {
  if (typeof console === 'undefined') return
  const origWarn = console.warn.bind(console)
  let loggedOnce = false
  console.warn = (...args: unknown[]) => {
    const msg = args[0]
    if (typeof msg === 'string' && msg.includes('Session as retrieved from URL was issued in the future')) {
      if (!loggedOnce && import.meta.env?.DEV) {
        loggedOnce = true
        const issuedAt = args[1]
        const timeNow = args[3]
        const skewSec =
          typeof issuedAt === 'number' && typeof timeNow === 'number'
            ? Math.round((issuedAt as number) - (timeNow as number))
            : '?'
        console.info(
          `[supabaseClient] Supabase server clock skew: ~${skewSec}s no futuro. ` +
          `Warning silenciado (cosmÃ©tico). Ticket aberto para Supabase resync.`
        )
      }
      return
    }
    origWarn(...(args as []))
  }
})()

// Storage key DIFERENTE por schema evita o warning do GoTrueClient:
// "Multiple GoTrueClient instances detected in the same browser context"
// (compartilhar storageKey entre clientes concorrentes causa lock contention
// e getSession pode dar timeout de 5s).
const STORAGE_KEY_FOGUETEIROS = 'sb-ghdpmlmescgdhvrdqfiz-auth-token'

// LÃª a sessÃ£o diretamente do localStorage sem passar pelo cliente Supabase.
// O supabase.auth.getSession() tenta fazer refresh de token via rede (que pode
// ser bloqueado por AdBlock/proxy e dar timeout de 5s). Essa funÃ§Ã£o Ã© ~sÃ­ncrona.
export function getSessionFromStorage(): { access_token: string; refresh_token: string; user: any } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FOGUETEIROS)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Supabase armazena { event: 'SIGNED_IN', session: {...}, ... }
    // ou sÃ³ { access_token, refresh_token, user } direto
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
      // PKCE: o auth-js gera code_challenge em signInWithOtp/signInWithOAuth
      // e guarda o verifier no storage. Funciona em qualquer GoTrue 2.x,
      // independente do flow_type/site_url configurados no dashboard.
      flowType: 'pkce',
      // Cliente "public" sÃ³ Ã© usado pra queries de leitura no schema public
      // (perfis, courses) â€” nÃ£o precisa de sessÃ£o prÃ³pria. Mantemos o
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
  void consumeAuthTokenHashEarly(client).catch((e) => console.error('[authConfirmEarly] init error', e))
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




