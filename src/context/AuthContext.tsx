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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  cargo: string | null;
  cargoLoaded: boolean;
  isPro: boolean;
  appBStatus: AppBStatus | null;
  needsOnboarding: boolean;
  signInWithMagicLink: (email: string, origem?: string) => Promise<string | null>;
  signInWithGoogle: (origem?: string) => Promise<void>;
  completeOnboarding: (apelido: string, whatsapp: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  cargo: null,
  cargoLoaded: false,
  isPro: false,
  appBStatus: null,
  needsOnboarding: false,
  signInWithMagicLink: async () => null,
  signInWithGoogle: async () => {},
  completeOnboarding: async () => null,
  signOut: async () => {},
});

const checkAppBStudent = async (email: string): Promise<AppBStatus | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return null

    const res = await fetch(APP_B_CHECK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email }),
    })

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
      sessionStorage.removeItem(pendingOwnerKey);
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cargo, setCargo] = useState<string | null>(null);
  const [cargoLoaded, setCargoLoaded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [appBStatus, setAppBStatus] = useState<AppBStatus | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchPerfil = (userId: string) => {
    supabase
      .from('perfis')
      .select('cargo, pro, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setCargo(data?.cargo || null);
        setIsPro(data?.pro === true);
        setCargoLoaded(true);
        if (data?.avatar_url) {
          setUser(prev => {
            if (!prev || prev.avatarUrl === data.avatar_url) return prev;
            return { ...prev, avatarUrl: data.avatar_url };
          });
        }
      })
      .catch(() => {
        setCargo(null);
        setIsPro(false);
        setCargoLoaded(true);
      });
  };

  const userIdRef = React.useRef<string | null>(null);
  const userDataRef = React.useRef<{ email: string; name: string; avatarUrl: string; apelido?: string; needsOnboarding: boolean } | null>(null);

  const applyUser = async (sessionUser: any, checkStudent: boolean) => {
    if (userIdRef.current === sessionUser.id) {
      return;
    }
    userIdRef.current = sessionUser.id;

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
    fetchPerfil(sessionUser.id);

    if (checkStudent) {
      const status = await checkAppBStudent(sessionUser.email || '');
      if (status?.isStudent) {
        await syncAppBToProfile(sessionUser.id, status);
        setAppBStatus(status);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          await applyUser(session.user, true);
        }
      } catch (err) {
        console.error('[Auth] Erro na inicialização:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCargoLoaded(true);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

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

          await applyUser(session.user, true);
        } else if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          await applyUser(session.user, event === 'INITIAL_SESSION');
        } else if (event === 'USER_UPDATED') {
          await applyUser(session.user, false);
        }
      } else {
        if (userIdRef.current !== null) {
          userIdRef.current = null;
          userDataRef.current = null;
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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: SITE_URL + (SITE_URL.endsWith('/') ? '' : '/'),
      },
    });
    return error?.message || null;
  };

  const signInWithGoogle = async (origem: string = 'organico') => {
    sessionStorage.setItem('cf_origem_cadastro', origem);
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

  return (
    <AuthContext.Provider value={{
      user, loading, cargo, cargoLoaded, isPro, appBStatus, needsOnboarding,
      signInWithMagicLink, signInWithGoogle, completeOnboarding, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
