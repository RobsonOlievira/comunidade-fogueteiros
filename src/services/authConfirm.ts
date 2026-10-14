import { supabase } from '@/src/services/supabaseClient'

type EmailOtpType = 'magiclink' | 'email' | 'signup' | 'recovery' | 'invite' | 'email_change'

/**
 * Consome um `token_hash` presente na URL — por exemplo o link do e-mail de
 * boas-vindas gerado pela edge function `welcome-with-magic-link`.
 *
 * POR QUE ISSO EXISTE
 * -------------------
 * O app usa `flowType: 'pkce'` (ver supabaseClient.ts). O `admin.generateLink`
 * da edge function gera um link "implicit" (com `access_token` no fragmento),
 * que o auth-js REJEITA quando o flow é PKCE:
 *   AuthPKCEGrantCodeExchangeError: "Not a valid PKCE flow url."
 * Resultado: nenhuma sessão é salva e o usuário fica "logado" nunca.
 *
 * `verifyOtp({ token_hash, type })` fecha a autenticação de forma
 * independente do `flowType`, então é o caminho compatível com o app.
 *
 * IMPORTANTE: chame esta função ANTES de ler a sessão do storage no boot
 * (AuthContext), pois o `verifyOtp` só persiste a sessão ao final.
 */
export async function consumeAuthTokenHashFromUrl(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const url = new URL(window.location.href)
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  if (!tokenHash || !type) return false

  const next = url.searchParams.get('next')

  // Limpa a URL imediatamente: o token é single-use e o `detectSessionInUrl`
  // do auth-js não deve tentar reprocessar a mesma query.
  url.searchParams.delete('token_hash')
  url.searchParams.delete('type')
  url.searchParams.delete('next')
  const search = url.searchParams.toString()
  window.history.replaceState(
    {},
    document.title,
    url.pathname + (search ? '?' + search : '') + url.hash,
  )

  try {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      console.error('[authConfirm] verifyOtp falhou:', error.message)
      return false
    }
    if (data?.session) {
      if (next) {
        try { sessionStorage.setItem('cf_auth_redirect', next) } catch {}
      }
      return true
    }
    return false
  } catch (e) {
    console.error('[authConfirm] verifyOtp crashou:', e)
    return false
  }
}
