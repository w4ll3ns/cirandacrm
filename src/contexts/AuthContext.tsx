import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { UsuarioInterno } from '@/types';
import { usuarios } from '@/data/mock';

interface AuthContextType {
  usuario: UsuarioInterno | null;
  login: (id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<UsuarioInterno | null>(null);

  const login = (id: string) => {
    const u = usuarios.find(u => u.id === id);
    if (u) setUsuario(u);
  };

  const logout = () => setUsuario(null);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
