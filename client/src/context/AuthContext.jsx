/**
 * Auth context - user, token, login, logout. JWT in localStorage (secure for SPA).
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/auth.api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'jarvis_token';
const USER_KEY = 'jarvis_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((token, userData) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (userData) localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData || null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {
        localStorage.removeItem(USER_KEY);
      }
    }
    authApi.getMe().then(({ user: u }) => persistAuth(token, u)).catch(() => logout()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauth = () => logout();
    window.addEventListener('jarvis_unauthorized', onUnauth);
    return () => window.removeEventListener('jarvis_unauthorized', onUnauth);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await authApi.login(email, password);
    persistAuth(token, u);
    return u;
  }, [persistAuth]);

  const register = useCallback(async (email, password, name) => {
    const { token, user: u } = await authApi.register(email, password, name);
    persistAuth(token, u);
    return u;
  }, [persistAuth]);

  const loginWithGoogle = useCallback(async (accessToken) => {
    const { token, user: u } = await authApi.googleAuth(accessToken);
    persistAuth(token, u);
    return u;
  }, [persistAuth]);

  const value = { user, loading, login, register, logout, loginWithGoogle, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
