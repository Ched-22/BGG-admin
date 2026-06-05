import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearSession,
  getStoredUser,
  hasStoredSession,
  registerUnauthorizedHandler,
  setSession,
} from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredSession);
  const [user, setUser] = useState(getStoredUser);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    registerUnauthorizedHandler((reason) => {
      setUser(null);
      setIsAuthenticated(false);
      if (reason === 'expired') {
        setSessionExpired(true);
      }
    });
    return () => registerUnauthorizedHandler(null);
  }, []);

  const login = useCallback((accessToken, userData) => {
    setSession(accessToken, userData);
    setUser(userData);
    setIsAuthenticated(true);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setIsAuthenticated(false);
    setSessionExpired(false);
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
      sessionExpired,
      clearSessionExpired,
    }),
    [isAuthenticated, user, login, logout, sessionExpired, clearSessionExpired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
