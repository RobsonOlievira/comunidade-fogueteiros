import type { SupabaseClient } from '@supabase/supabase-js'

type EmailOtpType = 'magiclink' | 'email' | 'signup' | 'recovery' | 'invite' | 'email_change'

export async function consumeAuthTokenHashEarly(client: SupabaseClient): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const url = new URL(window.location.href)
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  if (!tokenHash || !type) return false

  const next = url.searchParams.get('next')

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
    if (import.meta.env?.DEV) {
      console.debug('[authConfirmEarly] token_hash encontrado, chamando verifyOtp...')
    }
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) {
      console.error('[authConfirmEarly] verifyOtp falhou:', error.message)
      return false
    }
    if (data?.session && next) {
      try { sessionStorage.setItem('cf_auth_redirect', next) } catch {}
    }
    if (import.meta.env?.DEV) {
      console.debug('[authConfirmEarly] resultado:', !!data?.session)
    }
    return !!data?.session
  } catch (e) {
    console.error('[authConfirmEarly] verifyOtp crashou:', e)
    return false
  }
}
