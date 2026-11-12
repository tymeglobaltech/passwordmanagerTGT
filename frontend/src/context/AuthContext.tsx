import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@passwordpal/shared';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isExternal: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  changeExpiredPassword: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // Each of these is wrapped in useCallback with an empty dependency array -
  // they only close over `api` (a stable module-level import) and state
  // setters (guaranteed stable by React), so they genuinely never need to
  // change identity. This matters beyond the usual render-count concern:
  // LoginPage's effect that loads the Google Identity Services script and
  // calls google.accounts.id.initialize() depends (transitively, via a
  // useCallback) on loginWithGoogle. Without this, a plain function
  // redefined on every render here caused that effect to tear down and
  // re-run on every AuthProvider re-render (including the one right after
  // mount, when the session-restore effect below flips `loading` to
  // false) - re-initializing Google's widget a second time on every single
  // page load, which is what left the sign-in button in a broken,
  // unstyled state.
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password });

    setToken(response.token);
    setUser(response.user);

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const response = await api.googleLogin(idToken);

    setToken(response.token);
    setUser(response.user);

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }, []);

  const changeExpiredPassword = useCallback(async (email: string, currentPassword: string, newPassword: string) => {
    const response = await api.changeExpiredPassword(email, currentPassword, newPassword);

    setToken(response.token);
    setUser(response.user);

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }, []);

  const logout = useCallback(() => {
    api.logout().catch(() => {
      // Ignore errors on logout
    });

    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isExternal: user?.role === 'external',
    login,
    loginWithGoogle,
    changeExpiredPassword,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
