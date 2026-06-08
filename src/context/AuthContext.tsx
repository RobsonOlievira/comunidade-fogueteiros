import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/src/services/supabaseClient';

const APP_B_CHECK_URL = 'https://ghdpmlmescgdhvrdqfiz.supabase.co/functions/v1/check-student-status'

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
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  username: string;
  phone?: string;
  interests: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  cargo: string | null;
  cargoLoaded: boolean;
  appBStatus: AppBStatus | null;
  signUp: (data: SignUpData) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  cargo: null,
  cargoLoaded: false,
  appBStatus: null,
  signUp: async () => null,
  signIn: async () => null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

const ensurePerfil = async (sessionUser: any): Promise<void> => {
  try {
    const { id, email, user_metadata } = sessionUser;
    const fullName: string =
      user_metadata?.full_name || user_metadata?.name || email?.split('@')[0] || 'Membro';

    const { data: existing, error: selectError } = await supabase
      .from('perfis')
      .select('id, apelido, tech_stack, avatar_url, app_b_id')
      .eq('id', id)
      .maybeSingle();

    if (selectError || !existing) {
      const baseApelido = (email?.split('@')[0] || fullName.split(' ')[0] || 'membro')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
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

      const { error: insertError } = await supabase.from('perfis').insert({
        id,
        nome: fullName,
        email: email || '',
        apelido,
        telefone: '',
        cargo: 'membro',
        xp: 0,
        nivel: 1,
        cor_avatar: 'color-4',
        cracha: '',
        bio: '',
        avatar_url: user_metadata?.avatar_url || user_metadata?.picture || '',
        tech_stack: [],
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      });

      if (insertError && !insertError.message?.includes('duplicate')) {
        console.error('[Auth] Erro ao criar perfil:', insertError.message);
      }
    } else if (user_metadata?.avatar_url && existing.avatar_url !== user_metadata.avatar_url) {
      await supabase
        .from('perfis')
        .update({ avatar_url: user_metadata.avatar_url, atualizado_em: new Date().toISOString() })
        .eq('id', id);
    }

    if (email && !existing?.app_b_id) {
      const status = await checkAppBStudent(email)
      if (status?.isStudent) {
        await syncAppBToProfile(id, status)
      }
    }
  } catch (err) {
    console.error('[Auth] ensurePerfil falhou (não crítico):', err);
  }
};

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

    if (!res.ok) {
      console.error('[Auth] App B check failed:', res.status)
      return null
    }

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
  }).eq('id', userId)
}

const buildUser = (sessionUser: any): User => ({
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
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cargo, setCargo] = useState<string | null>(null);
  const [cargoLoaded, setCargoLoaded] = useState(false);
  const [appBStatus, setAppBStatus] = useState<AppBStatus | null>(null);

  const fetchCargo = (userId: string) => {
    supabase
      .from('perfis')
      .select('cargo')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setCargo(data?.cargo || null);
        setCargoLoaded(true);
      })
      .catch(() => {
        setCargo(null);
        setCargoLoaded(true);
      });
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          await ensurePerfil(session.user);
          if (cancelled) return;
          setUser(buildUser(session.user));
          fetchCargo(session.user.id);

          const status = await checkAppBStudent(session.user.email || '')
          if (!cancelled && status?.isStudent) {
            await syncAppBToProfile(session.user.id, status)
            setAppBStatus(status)
          }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;

      if (session?.user) {
        ensurePerfil(session.user).then(() => {
          if (!cancelled) {
            setUser(buildUser(session.user!));
            fetchCargo(session.user!.id);
          }
        });
        if (_event === 'SIGNED_IN') {
          supabase
            .from('perfis')
            .update({ ultimo_acesso_em: new Date().toISOString() })
            .eq('id', session.user.id)
            .then(() => {});

          checkAppBStudent(session.user.email || '').then(status => {
            if (!cancelled && status?.isStudent) {
              syncAppBToProfile(session.user.id, status)
              setAppBStatus(status)
            }
          })
        }
      } else {
        setUser(null);
        setCargo(null);
        setCargoLoaded(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, name, username, phone, interests }: SignUpData): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return error.message;

    const userId = data.user?.id;
    if (userId) {
      const { error: insertError } = await supabase.from('perfis').insert({
        id: userId,
        nome: name,
        email,
        apelido: username,
        telefone: phone || '',
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
      });
      if (insertError) return insertError.message;

      const status = await checkAppBStudent(email)
      if (status?.isStudent) {
        await syncAppBToProfile(userId, status)
        setAppBStatus(status)
      }
    }

    return null;
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user?.id) {
      supabase
        .from('perfis')
        .update({ ultimo_acesso_em: new Date().toISOString() })
        .eq('id', data.user.id)
        .then(() => {});

      const status = await checkAppBStudent(email)
      if (status?.isStudent) {
        await syncAppBToProfile(data.user.id, status)
        setAppBStatus(status)
      } else {
        setAppBStatus(null)
      }
    }
    return error?.message || null;
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setCargo(null);
    setCargoLoaded(false);
    setAppBStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, cargo, cargoLoaded, appBStatus, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
