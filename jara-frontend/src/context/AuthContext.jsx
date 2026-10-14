import { createContext, useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  setAccessToken,
  clearAccessToken,
} from '../services/tokenStore';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

/**
 * Provides { user, isAuthenticated, isLoading, login, logout } to the app.
 *
 * On mount, quietly attempts a refresh — if the httpOnly cookie from a
 * previous session is still valid, the user is silently logged back in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Boot: try to restore session via the refresh cookie.
  // /auth/refresh now returns 200 with user:null when no cookie is present,
  // so this call is silent for a fresh visitor.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        if (cancelled) return;
        if (data.accessToken && data.user) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch {
        // 401 = cookie was invalid/expired (already cleared by backend).
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * Directly hydrate auth state from a server response (e.g. after
   * /auth/register which already returns tokens). Skips the network call
   * that login() would make.
   */
  const hydrate = useCallback(({ user, accessToken }) => {
    setAccessToken(accessToken);
    setUser(user);
  }, []);

  /**
   * Re-fetch the current user (e.g. after setting the transfer PIN so the
   * hasTransferPin flag flips to true in state).
   */
  const refreshMe = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    hydrate,
    refreshMe,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
