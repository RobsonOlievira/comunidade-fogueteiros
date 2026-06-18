import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/src/services/supabaseClient';
import { Analytics } from '@/src/services/analytics';

const APP_B_CHECK_URL = 'https://ghdpmlmescgdhvrdqfiz.supabase.co/functions/v1/check-student-status'
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''

interface AppBStatus {
  isStudent: boolean
  appBUserId?: string
  name?: string
  subscriptionStatus?: string
  acessoLiberado?: boolean
  meusCursos?: string[]
  dataExpiracao?: string
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  apelido?: string;
  needsOnboarding: boolean;
}

// Fases do loading. 'session' = restaurando token, 'profile' = carregando
// perfil do user, 'ready' = tudo carregado, 'error' = timeout/falha.
type LoadingPhase = 'session' | 'profile' | 'ready' | 'error';

interface AuthContextType {
  user: User | null;
  // Mantemos `loading: true` enquanto não temos certeza se há user logado
  // ou não. Isso é o que o App.tsx usa pra decidir se mostra splash ou
  // rotas. Diferente do que era antes: agora `loading` vira false assim
  // que a SESSION resolve (com ou sem user), e o profile carrega em
  // background sem bloquear o app shell.
  loading: boolean;
  // Fase granular pra mostrar feedback textual no splash.
  phase: LoadingPhase;
  phaseMessage: string;
  cargo: string | null;
  cargoLoaded: boolean;
  isPro: boolean;
  appBStatus: AppBStatus | null;
  needsOnboarding: boolean;
  signInWithMagicLink: (email: string, origem?: string) => Promise<string | null>;
  signInWithGoogle: (origem?: string) => Promise<void>;
  completeOnboarding: (apelido: string, whatsapp: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  // Permite ao usuário forçar "ir pra tela de login" se o app travou.
  resetAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  phase: 'session',
  phaseMessage: 'Iniciando...',
  cargo: null,
  cargoLoaded: false,
  isPro: false,
  appBStatus: null,
  needsOnboarding: false,
  signInWithMagicLink: async () => null,
  signInWithGoogle: async () => {},
  completeOnboarding: async () => null,
  signOut: async () => {},
  resetAuth: async () => {},
});

const checkAppBStudent = async (email: string, accessToken: string): Promise<AppBStatus | null> => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(APP_B_CHECK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ email }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) return null
    return await res.json() as AppBStatus
  } catch (err) {
    console.error('[Auth] App B check error:', err)
    return null
  }
}

const syncAppBToProfile = async (userId: string, status: AppBStatus) => {
  if (!status.isStudent) return
  await supabase.from('perfis').update({
    app_b_id: status.appBUserId,
    vinculado_app_b: true,
    origem: 'app_b',
    pro: true,
  }).eq('id', userId)
}

const ensurePerfil = async (sessionUser: any, origem: string = 'organico'): Promise<{ needsOnboarding: boolean; apelido?: string }> => {
  try {
    const { id, email, user_metadata } = sessionUser;
    const metaName: string =
      user_metadata?.full_name || user_metadata?.name || email?.split('@')[0] || 'Membro';
    const avatarUrl: string = user_metadata?.avatar_url || user_metadata?.picture || '';
    const metaApelido: string | undefined = user_metadata?.preferred_username || user_metadata?.user_name;

    const pendingRaw = localStorage.getItem('cf_pending_cadastro');
    const pending = pendingRaw ? (() => { try { return JSON.parse(pendingRaw); } catch { return null; } })() : null;
    const isPendingForThisUser = sessionStorage.getItem('cf_pending_cadastro_marker') === '1' && pending?.email === email;

    const { data: existing, error: selectError } = await supabase
      .from('perfis')
      .select('id, apelido, telefone, tech_stack, avatar_url, app_b_id, origem_cadastro')
      .eq('id', id)
      .maybeSingle();

    if (selectError) {
      console.error('[Auth] erro select perfil:', selectError.message);
      return { needsOnboarding: true };
    }

    if (!existing) {
      let baseApelido = (pending?.username || metaApelido || email?.split('@')[0] || metaName.split(' ')[0] || 'membro')
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20) || 'membro';

      let apelido = baseApelido;
      let suffix = 0;
      while (suffix < 100) {
        const { data: dup } = await supabase
          .from('perfis')
          .select('id')
          .eq('apelido', apelido)
          .neq('id', id)
          .maybeSingle();
        if (!dup) break;
        suffix += 1;
        apelido = `${baseApelido}${suffix}`;
      }

      const fullName = pending?.name || metaName;
      const telefone = pending?.phone || '';
      const techStack = pending?.interests || [];

      const { error: insertError } = await supabase.from('perfis').insert({
        id,
        nome: fullName,
        email: email || '',
        apelido,
        telefone,
        cargo: 'membro',
        xp: 0,
        nivel: 1,
        cor_avatar: 'color-4',
        cracha: '',
        bio: '',
        avatar_url: avatarUrl,
        tech_stack: techStack,
        origem_cadastro: origem,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      });

      if (insertError && !insertError.message?.includes('duplicate')) {
        console.error('[Auth] Erro ao criar perfil:', insertError.message);
      }

      if (pending && isPendingForThisUser) {
        localStorage.removeItem('cf_pending_cadastro');
        sessionStorage.removeItem('cf_pending_cadastro_marker');
      }

      return { needsOnboarding: !telefone, apelido };
    }

    if (pending && isPendingForThisUser) {
      const updates: any = { atualizado_em: new Date().toISOString() };
      if (!existing.apelido && pending.username) updates.apelido = pending.username;
      if (!existing.telefone && pending.phone) updates.telefone = pending.phone;
      if ((!existing.tech_stack || existing.tech_stack.length === 0) && pending.interests?.length) {
        updates.tech_stack = pending.interests;
      }
      if (Object.keys(updates).length > 1) {
        await supabase.from('perfis').update(updates).eq('id', id);
      }
      localStorage.removeItem('cf_pending_cadastro');
      sessionStorage.removeItem('cf_pending_cadastro_marker');
    }

    // If the perfil already exists but is missing the Google avatar
    // (because the user logged in with email/magic-link first and the
    // avatar was never persisted), backfill it from user_metadata.
    if (existing && !existing.avatar_url && avatarUrl) {
      await supabase
        .from('perfis')
        .update({ avatar_url: avatarUrl, atualizado_em: new Date().toISOString() })
        .eq('id', id);
      existing.avatar_url = avatarUrl;
    }

    const needsOnboarding = !existing.apelido?.trim() || !existing.telefone?.trim();
    return { needsOnboarding, apelido: existing.apelido };
  } catch (err) {
    console.error('[Auth] ensurePerfil falhou:', err);
    return { needsOnboarding: true };
  }
};

const buildUser = (sessionUser: any, apelido?: string, needsOnboarding = false): User => ({
  id: sessionUser.id,
  email: sessionUser.email || '',
  name:
    sessionUser.user_metadata?.full_name ||
    sessionUser.user_metadata?.name ||
    sessionUser.email?.split('@')[0] ||
    'Membro',
  avatar:
    sessionUser.user_metadata?.avatar_url ||
    sessionUser.user_metadata?.picture ||
    '',
  avatarUrl:
    sessionUser.user_metadata?.avatar_url ||
    sessionUser.user_metadata?.picture ||
    '',
  apelido,
  needsOnboarding,
});

const PHASE_MESSAGES: Record<LoadingPhase, string> = {
  session: 'Verificando sessão...',
  profile: 'Carregando perfil...',
  ready: 'Pronto',
  error: 'Não foi possível carregar o app',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<LoadingPhase>('session');
  const [phaseMessage, setPhaseMessage] = useState<string>(PHASE_MESSAGES.session);
  const [cargo, setCargo] = useState<string | null>(null);
  const [cargoLoaded, setCargoLoaded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [appBStatus, setAppBStatus] = useState<AppBStatus | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Helper pra mudar fase + log com timestamp (debug-friendly).
  const setPhaseAndLog = (next: LoadingPhase, extra?: string) => {
    const t = Date.now();
    setPhase(next);
    setPhaseMessage(PHASE_MESSAGES[next]);
    if (import.meta.env.DEV) {
      console.log(`[Auth] phase=${next} t=${t}${extra ? ' ' + extra : ''}`);
    }
  };

  const fetchPerfil = (userId: string) => {
    if (import.meta.env.DEV) console.log(`[Auth] fetchPerfil start userId=${userId.slice(0,8)}`);
    supabase
      .from('perfis')
      .select('cargo, pro, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (import.meta.env.DEV) console.log(`[Auth] fetchPerfil done cargo=${data?.cargo} avatar=${!!data?.avatar_url}`);
        setCargo(data?.cargo || null);
        setIsPro(data?.pro === true);
        setCargoLoaded(true);
        if (data?.avatar_url) {
          setUser(prev => {
            if (!prev || prev.avatarUrl === data.avatar_url) return prev;
            if (import.meta.env.DEV) console.log(`[Auth] fetchPerfil updating avatarUrl`);
            return { ...prev, avatarUrl: data.avatar_url };
          });
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.log(`[Auth] fetchPerfil ERROR`, err);
        setCargo(null);
        setIsPro(false);
        setCargoLoaded(true);
      });
  };

  const userIdRef = React.useRef<string | null>(null);
  const userDataRef = React.useRef<{ email: string; name: string; avatarUrl: string; apelido?: string; needsOnboarding: boolean } | null>(null);
  const perfilFetchedRef = React.useRef<string | null>(null);
  const applyCountRef = React.useRef(0);

  // Wrapper com timeout duro. Importante: nunca trava pra sempre.
  const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms)
      ),
    ]);
  };

  const applyUser = async (sessionUser: any, checkStudent: boolean, accessToken?: string) => {
    applyCountRef.current += 1;
    const cid = applyCountRef.current;
    if (import.meta.env.DEV) console.log(`[Auth] applyUser #${cid} id=${sessionUser.id?.slice(0,8)}`);

    if (userIdRef.current === sessionUser.id) {
      if (import.meta.env.DEV) console.log(`[Auth] applyUser #${cid} SKIP (same user.id)`);
      return;
    }
    userIdRef.current = sessionUser.id;

    // Vamos para fase 'profile' — temos o user, agora carregamos o perfil
    setPhaseAndLog('profile', `applyUser #${cid} ensurePerfil start`);

    const { needsOnboarding: need, apelido } = await ensurePerfil(sessionUser);
    const metaName =
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      sessionUser.email?.split('@')[0] ||
      'Membro';
    const metaAvatar =
      sessionUser.user_metadata?.avatar_url ||
      sessionUser.user_metadata?.picture ||
      '';

    const lastData = userDataRef.current;
    if (
      lastData &&
      lastData.email === (sessionUser.email || '') &&
      lastData.name === metaName &&
      lastData.avatarUrl === metaAvatar &&
      lastData.apelido === apelido &&
      lastData.needsOnboarding === need
    ) {
      return;
    }
    userDataRef.current = {
      email: sessionUser.email || '',
      name: metaName,
      avatarUrl: metaAvatar,
      apelido,
      needsOnboarding: need,
    };

    setUser(buildUser(sessionUser, apelido, need));
    setNeedsOnboarding(need);

    if (perfilFetchedRef.current !== sessionUser.id) {
      perfilFetchedRef.current = sessionUser.id;
      if (import.meta.env.DEV) console.log(`[Auth] applyUser #${cid} calling fetchPerfil`);
      fetchPerfil(sessionUser.id);
    } else {
      if (import.meta.env.DEV) console.log(`[Auth] applyUser #${cid} SKIP fetchPerfil (already fetched)`);
    }

    // Fire-and-forget: check student status in background so it never
    // blocks the auth initialization. The user sees the app immediately.
    if (checkStudent && accessToken) {
      checkAppBStudent(sessionUser.email || '', accessToken).then((status) => {
        if (status?.isStudent) {
          syncAppBToProfile(sessionUser.id, status);
          setAppBStatus(status);
        }
      });
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const start = Date.now();
      setPhaseAndLog('session', 'init start');

      try {
        // Timeout agressivo pro getSession: 5s é mais que suficiente
        // pra chamada local de localStorage. Se demorar mais, é
        // loop/conflito de instâncias e melhor seguir sem sessão.
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'getSession'
        );
        if (cancelled) return;
        if (import.meta.env.DEV) {
          console.log(`[Auth] getSession resolved in ${Date.now() - start}ms hasUser=${!!session?.user}`);
        }

        if (session?.user) {
          // IMPORTANTE: liberamos o app shell IMEDIATAMENTE porque temos
          // user válido na session. O perfil completo carrega em
          // background. Isso elimina o "loading de 25s".
          const minimalUser = buildUser(session.user, undefined, true);
          if (cancelled) return;
          setUser(minimalUser);
          setLoading(false); // ← app shell já pode renderizar
          if (import.meta.env.DEV) {
            console.log(`[Auth] session phase done in ${Date.now() - start}ms, releasing shell, fetching profile in background`);
          }

          // Agora carrega o perfil completo em background, sem bloquear.
          applyUser(session.user, true, session.access_token)
            .catch((e) => {
              console.warn('[Auth] applyUser background failed:', e?.message);
            })
            .finally(() => {
              if (!cancelled) setPhaseAndLog('ready');
            });
        } else {
          // Sem sessão, vai pra tela de login
          if (import.meta.env.DEV) {
            console.log(`[Auth] no session, going to login in ${Date.now() - start}ms`);
          }
          setLoading(false);
          setPhaseAndLog('ready');
        }
      } catch (err: any) {
        console.warn('[Auth] init falhou:', err?.message);
        if (cancelled) return;
        // Se getSession deu timeout (5s), assumimos logged out e liberamos
        // o app shell. O SIGNED_IN event (se vier) vai popular depois.
        setLoading(false);
        setPhaseAndLog('ready', 'init error → assuming logged out');
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (import.meta.env.DEV) console.log(`[Auth] onAuthStateChange event=${event} hasUser=${!!session?.user}`);

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          const isNewUser = !!session.user.created_at &&
            (Date.now() - new Date(session.user.created_at).getTime() < 60_000);
          const provider = (session.user.app_metadata?.provider as string) || 'email';
          const method: 'google' | 'magic_link' = provider === 'google' ? 'google' : 'magic_link';
          const origem = sessionStorage.getItem('cf_origem_cadastro') || undefined;
          if (isNewUser) Analytics.signUp(method, origem);
          else Analytics.login(method, origem);
          sessionStorage.removeItem('cf_origem_cadastro');

          supabase
            .from('perfis')
            .update({ ultimo_acesso_em: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(() => {});

          // Mesmo princípio: libera shell IMEDIATAMENTE se ainda não
          // temos user, e carrega perfil em background.
          if (!userIdRef.current) {
            setUser(buildUser(session.user, undefined, true));
            setLoading(false);
          }

          try {
            await withTimeout(
              applyUser(session.user, true, session.access_token),
              8000,
              'applyUser(SIGNED_IN)'
            );
          } catch (e: any) {
            console.warn('[Auth] SIGNED_IN applyUser failed/timed out:', e?.message);
          } finally {
            if (!cancelled) setPhaseAndLog('ready');
          }
        } else if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          // INITIAL_SESSION duplica o getSession; não precisa rodar de novo.
          // TOKEN_REFRESHED não precisa re-apply.
          if (event === 'INITIAL_SESSION' && !userIdRef.current) {
            try {
              await withTimeout(
                applyUser(session.user, event === 'INITIAL_SESSION', session.access_token),
                8000,
                'applyUser(INITIAL_SESSION)'
              );
            } catch (e: any) {
              console.warn('[Auth] applyUser failed/timed out:', e?.message);
            } finally {
              if (!cancelled) setPhaseAndLog('ready');
            }
          }
        } else if (event === 'USER_UPDATED') {
          try {
            await withTimeout(
              applyUser(session.user, false, session.access_token),
              8000,
              'applyUser(USER_UPDATED)'
            );
          } catch {}
        }
      } else {
        if (userIdRef.current !== null) {
          userIdRef.current = null;
          userDataRef.current = null;
          perfilFetchedRef.current = null;
          setUser(null);
          setCargo(null);
          setCargoLoaded(true);
          setNeedsOnboarding(false);
          setAppBStatus(null);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink = async (email: string, origem: string = 'organico'): Promise<string | null> => {
    sessionStorage.setItem('cf_origem_cadastro', origem);
    sessionStorage.setItem('cf_pending_cadastro_marker', '1');
    // If the user was redirected here from a protected page, send the magic
    // link back to that page after they click it in their email.
    const redirectHash = (() => {
      try {
        const target = sessionStorage.getItem('cf_auth_redirect');
        return target ? target.replace(/^#/, '') : '';
      } catch { return ''; }
    })();

    // Pull pending profile data from localStorage (set by Register.tsx)
    // so the edge function can pre-fill nome/apelido/telefone on the
    // fogueteiros.perfis row before the user clicks the link.
    const pending = (() => {
      try {
        const raw = localStorage.getItem('cf_pending_cadastro');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.email === email ? parsed : null;
      } catch { return null; }
    })();

    // Call our edge function which:
    //   1. generates a magic link (no email sent by Supabase)
    //   2. makes sure the user has a fogueteiros.perfis row
    //   3. sends ONE beautiful email with the link embedded
    const { data, error } = await supabase.functions.invoke('welcome-with-magic-link', {
      body: {
        email,
        nome: pending?.name,
        apelido: pending?.username,
        telefone: pending?.phone,
        interests: pending?.interests,
        redirectTo: redirectHash,
      },
    });

    if (error) {
      // Fallback: if the edge function is down, use Supabase's built-in
      // magic-link so the user still gets a sign-in email.
      console.warn('[Auth] welcome-with-magic-link failed, falling back to signInWithOtp:', error.message);
      const { error: fallbackErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: SITE_URL + (SITE_URL.endsWith('/') ? '' : '/') + (redirectHash ? '#' + redirectHash : ''),
        },
      });
      return fallbackErr?.message || error.message || null;
    }

    if (data && (data as any).ok === false) {
      return (data as any).error || 'Failed to send welcome email';
    }
    return null;
  };

  const signInWithGoogle = async (origem: string = 'organico') => {
    sessionStorage.setItem('cf_origem_cadastro', origem);
    // The Google OAuth provider strips the URL fragment, so passing '#/labs'
    // in redirectTo would silently drop the path. Instead, we always send
    // users back to the SPA root and let Login.tsx / Register.tsx's existing
    // `cf_auth_redirect` useEffect (which reads sessionStorage on mount)
    // navigate to the originally requested page after the session is set.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: SITE_URL + (SITE_URL.endsWith('/') ? '' : '/') },
    });
  };

  const completeOnboarding = async (apelido: string, whatsapp: string): Promise<string | null> => {
    if (!user) return 'Não autenticado';

    const cleanApelido = apelido.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanApelido.length < 3) return 'Nome de usuário deve ter pelo menos 3 caracteres';

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) return 'WhatsApp inválido';

    const { data: dup } = await supabase
      .from('perfis')
      .select('id')
      .eq('apelido', cleanApelido)
      .neq('id', user.id)
      .maybeSingle();
    if (dup) return 'Este nome de usuário já está em uso';

    const { error } = await supabase
      .from('perfis')
      .update({
        apelido: cleanApelido,
        telefone: cleanPhone,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) return error.message;

    const wasGoogle = user?.avatarUrl?.includes('googleusercontent.com') || user?.avatarUrl?.includes('google');
    Analytics.onboardingComplete(wasGoogle ? 'google' : 'magic_link');

    setUser({ ...user, apelido: cleanApelido, needsOnboarding: false });
    setNeedsOnboarding(false);
    return null;
  };

  const signOut = async () => {
    if (needsOnboarding) {
      console.warn('[Auth] signOut bloqueado: complete o cadastro primeiro');
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    Analytics.logout();
    setUser(null);
    setCargo(null);
    setCargoLoaded(false);
    setAppBStatus(null);
    setNeedsOnboarding(false);
  };

  // Botão "tentar de novo" do splash de erro
  const resetAuth = async () => {
    setPhaseAndLog('session', 'resetAuth');
    try { await supabase.auth.signOut(); } catch {}
    setUser(null);
    setCargo(null);
    setCargoLoaded(false);
    setLoading(true);
    // Re-init
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, phase, phaseMessage, cargo, cargoLoaded, isPro, appBStatus, needsOnboarding,
      signInWithMagicLink, signInWithGoogle, completeOnboarding, signOut, resetAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
