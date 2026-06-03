import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/src/services/supabaseClient';

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
      .select('id, apelido, tech_stack, avatar_url')
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
  } catch (err) {
    console.error('[Auth] ensurePerfil falhou (não crítico):', err);
  }
};

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
  };

  return (
    <AuthContext.Provider value={{ user, loading, cargo, cargoLoaded, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
