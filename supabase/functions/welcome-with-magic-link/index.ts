import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.106.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FROM_EMAIL = 'Comunidade Olha o Foguete! <comunidade@robsoliveiradesign.com.br>'
const REPLY_TO = 'comunidade@robsoliveiradesign.com.br'
const SITE_URL = 'https://comunidade-fogueteiros.vercel.app'
const RESEND_URL = 'https://api.resend.com/emails'

interface Payload {
  email: string
  nome?: string
  apelido?: string
  telefone?: string
  interests?: string[]
  redirectTo?: string
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const buildHtml = (nome: string, magicLinkUrl: string) => {
  const safeNome = escape(nome || 'Vibe Coder')

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bem-vindo à Comunidade Olha o Foguete!</title>
</head>
<body style="margin:0;padding:0;background:#0b0b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0b0b14;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#15151f;border:1px solid #2a2a3a;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#06b6d4 100%);padding:32px 32px 28px;text-align:center;">
              <div style="font-size:48px;line-height:1;margin-bottom:8px;">&#x1F680;</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">Comunidade Olha o Foguete!</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Vibe Coders em órbita</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#ffffff;font-size:22px;font-weight:700;">Parab&eacute;ns, <span style="color:#a78bfa;">${safeNome}</span>!</h2>
              <p style="margin:0 0 18px;color:#d1d5db;font-size:15px;line-height:1.65;">
                Seja bem-vindo &agrave; comunidade de <strong style="color:#ffffff;">Vibe Coders &mdash; Olha o Foguete!</strong> &#x1F680;
              </p>
              <p style="margin:0 0 18px;color:#d1d5db;font-size:15px;line-height:1.65;">
                Para confirmar seu cadastro e entrar na comunidade, clique no bot&atilde;o abaixo. O link &eacute; pessoal e expira em 1 hora.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px auto 8px;">
                <tr>
                  <td style="background: linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%); border-radius: 12px;">
                    <a href="${magicLinkUrl}" target="_blank"
                       style="display: inline-block; padding: 16px 36px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
                      &#x1F680; Acessar a Comunidade
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 8px;color:#d1d5db;font-size:15px;line-height:1.65;">
                Depois que voc&ecirc; entrar, aproveite para:
              </p>
              <ul style="margin:0 0 18px;padding:0 0 0 0;list-style:none;color:#d1d5db;font-size:15px;line-height:1.9;">
                <li>&#x1F4DA; Baixar os <strong style="color:#ffffff;">materiais gratuitos</strong> na aba <a href="${SITE_URL}/#/downloads" style="color:#06b6d4;text-decoration:none;">Downloads</a></li>
                <li>&#x1F4AC; <a href="${SITE_URL}/#/labs" style="color:#06b6d4;text-decoration:none;">Entrar nos canais de chat</a> e se apresentar</li>
                <li>&#x1F4DD; <a href="${SITE_URL}/#/perfil" style="color:#06b6d4;text-decoration:none;">Completar seu perfil</a> (foto, bio, tech stack)</li>
                <li>&#x1F3AF; <a href="${SITE_URL}/#/feed" style="color:#06b6d4;text-decoration:none;">Criar sua primeira thread</a> contando o que voc&ecirc; est&aacute; construindo</li>
              </ul>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;line-height:1.6;">
                Se o bot&atilde;o n&atilde;o funcionar, copie e cole este link no navegador:
              </p>
              <p style="margin:6px 0 0;word-break:break-all;color:#06b6d4;font-size:12px;">${magicLinkUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2a2a3a;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:12px;">
                Voc&ecirc; recebeu este e-mail porque se cadastrou na Comunidade Olha o Foguete!<br>
                &copy; ${new Date().getFullYear()} Comunidade Olha o Foguete! &middot; <a href="${SITE_URL}" style="color:#6b7280;text-decoration:underline;">comunidade-fogueteiros.vercel.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

const buildText = (nome: string, magicLinkUrl: string) => {
  const safeNome = nome || 'Vibe Coder'
  return [
    `Parabéns, ${safeNome}!`,
    '',
    'Seja bem-vindo à comunidade de Vibe Coders — Olha o Foguete! 🚀',
    '',
    'Para confirmar seu cadastro e entrar na comunidade, clique no link abaixo. Ele é pessoal e expira em 1 hora.',
    '',
    magicLinkUrl,
    '',
    'Depois que você entrar, aproveite para:',
    '• Baixar os materiais gratuitos na aba Downloads: ' + SITE_URL + '/#/downloads',
    '• Entrar nos canais de chat e se apresentar: ' + SITE_URL + '/#/labs',
    '• Completar seu perfil (foto, bio, tech stack): ' + SITE_URL + '/#/perfil',
    '• Criar sua primeira thread: ' + SITE_URL + '/#/feed',
    '',
    '— Comunidade Olha o Foguete!',
  ].join('\n')
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const sendViaResend = async (apiKey: string, body: unknown): Promise<{ ok: boolean; status: number; text: string; payload?: any }> => {
  const attempts = 4
  let lastErr = ''
  let lastStatus = 0
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const text = await res.text()
      if (res.ok) {
        let payload: any = null
        try { payload = JSON.parse(text) } catch {}
        return { ok: true, status: res.status, text, payload }
      }
      lastStatus = res.status
      lastErr = text
      console.warn(`[welcome-with-magic-link] Resend ${res.status} on attempt ${i + 1}/${attempts}: ${text.slice(0, 200)}`)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return { ok: false, status: res.status, text }
      }
    } catch (e) {
      lastErr = (e as Error).message
      console.warn(`[welcome-with-magic-link] fetch error on attempt ${i + 1}: ${lastErr}`)
    }
    if (i < attempts - 1) {
      await sleep(500 * Math.pow(3, i))
    }
  }
  return { ok: false, status: lastStatus, text: lastErr }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let payload: Payload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { email, nome, apelido, telefone, interests, redirectTo } = payload
  if (!email) {
    return new Response(JSON.stringify({ ok: false, error: 'email is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')

  if (!supabaseUrl || !serviceKey) {
    console.error('[welcome-with-magic-link] Missing SUPABASE secrets')
    return new Response(JSON.stringify({ ok: false, error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!resendKey) {
    console.error('[welcome-with-magic-link] RESEND_API_KEY is not set')
    return new Response(JSON.stringify({ ok: false, error: 'Email service not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1) Generate a magic-link (no email sent by Supabase — we send our own).
  //
  // IMPORTANTE — por que NÃO usamos mais o `action_link`:
  // O app roda com flowType:'pkce'. O `action_link` do generateLink é um
  // link "implicit" (access_token no fragmento), que o auth-js REJEITA no
  // modo PKCE (AuthPKCEGrantCodeExchangeError: "Not a valid PKCE flow url.")
  // — a sessão nunca era salva e o usuário ficava sem login.
  //
  // Solução: usamos o `hashed_token` retornado pelo generateLink e montamos
  // um link próprio com `?token_hash=...&type=magiclink`. O SPA consome isso
  // via supabase.auth.verifyOtp({ token_hash, type }), que funciona
  // independente do flowType. `next` diz ao SPA para onde ir após entrar.
  //
  // redirectTo from the client is one of:
  //   undefined/''            -> land on /labs (default authenticated home)
  //   '/downloads'            -> user lands on /#/downloads
  //   '/#/downloads' (legacy) -> strip the '#'
  const cleanRedirect = (redirectTo || '').replace(/^#/, '').replace(/^\//, '')
  const nextPath = cleanRedirect ? '/' + cleanRedirect : '/labs'

  let magicLinkUrl = ''
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: SITE_URL + '/' },
    })
    const hashedToken = data?.properties?.hashed_token
    if (error || !hashedToken) {
      console.error('[welcome-with-magic-link] generateLink error:', error?.message)
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to generate link: ' + (error?.message || 'unknown') }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const qs = new URLSearchParams({ token_hash: hashedToken, type: 'magiclink', next: nextPath })
    magicLinkUrl = SITE_URL + '/?' + qs.toString()
  } catch (e) {
    console.error('[welcome-with-magic-link] generateLink exception:', e)
    return new Response(
      JSON.stringify({ ok: false, error: 'generateLink crashed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // 2) Make sure the user has a fogueteiros.perfis row (so they have a
  // cargo, apelido, etc. when they log in).
  try {
    const { data: existing } = await admin
      .from('perfis')
      .select('id, apelido, telefone')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      const { data: ulist } = await admin.auth.admin.listUsers({ perPage: 1, email })
      const userId = ulist?.users?.[0]?.id
      if (userId) {
        let baseApelido = (apelido || email.split('@')[0] || nome?.split(' ')[0] || 'membro')
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 20) || 'membro'
        let chosen = baseApelido
        let suffix = 0
        while (suffix < 50) {
          const { data: dup } = await admin
            .from('perfis')
            .select('id')
            .eq('apelido', chosen)
            .neq('id', userId)
            .maybeSingle()
          if (!dup) break
          suffix += 1
          chosen = `${baseApelido}${suffix}`
        }
        await admin.from('perfis').insert({
          id: userId,
          nome: nome || chosen,
          email,
          apelido: chosen,
          telefone: telefone || '',
          cargo: 'membro',
          xp: 0,
          nivel: 1,
          cor_avatar: 'color-4',
          cracha: '',
          bio: '',
          avatar_url: '',
          tech_stack: interests || [],
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        })
      }
    } else if (apelido && !existing.apelido) {
      await admin.from('perfis').update({ apelido, telefone: telefone || existing.telefone || '', atualizado_em: new Date().toISOString() }).eq('id', existing.id)
    } else if (telefone && !existing.telefone) {
      await admin.from('perfis').update({ telefone, atualizado_em: new Date().toISOString() }).eq('id', existing.id)
    }
  } catch (e) {
    console.warn('[welcome-with-magic-link] perfil upsert failed (non-fatal):', e)
  }

  // 3) O destino pós-login agora viaja no próprio link (query `next`),
  // consumido pelo SPA após o verifyOtp. Não há mais o que salvar aqui.

  // 4) Send the beautiful email with the magic link embedded
  const displayName = nome || apelido || email.split('@')[0]
  const subject = '🚀 Bem-vindo à Comunidade Olha o Foguete!'

  const result = await sendViaResend(resendKey, {
    from: FROM_EMAIL,
    to: [email],
    reply_to: REPLY_TO,
    subject,
    html: buildHtml(displayName, magicLinkUrl),
    text: buildText(displayName, magicLinkUrl),
    tags: [{ name: 'type', value: 'welcome' }],
  })

  if (!result.ok) {
    console.error('[welcome-with-magic-link] Resend error:', result.status, result.text)
    return new Response(
      JSON.stringify({ ok: false, error: 'Failed to send email', provider_status: result.status }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  console.log('[welcome-with-magic-link] sent to', email, 'id:', result.payload?.id)
  return new Response(
    JSON.stringify({ ok: true, id: result.payload?.id, to: email }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
