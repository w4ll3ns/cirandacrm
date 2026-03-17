import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'atendente' | 'gestor';

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  perfil: AppRole;
  avatar?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  usuario: UsuarioAuth | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  usuario: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    setUsuario({
      id: userId,
      nome: profile?.name || email?.split('@')[0] || 'Usuário',
      email: profile?.email || email || '',
      perfil: (roleData?.role as AppRole) || 'atendente',
      avatar: profile?.avatar_url || undefined,
    });
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id, session.user.email), 0);
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, usuario, loading, signIn, signOut, logout: signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
