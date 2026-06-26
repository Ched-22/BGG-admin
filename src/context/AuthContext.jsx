import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearSession,
  getStoredUser,
  hasStoredSession,
  normalizeSessionOnBoot,
  patchStoredUser,
  registerUnauthorizedHandler,
  setSession,
} from '../lib/auth';

const AuthContext = createContext(null);

function readInitialAuth() {
  try {
    normalizeSessionOnBoot();
    return {
      isAuthenticated: hasStoredSession(),
      user: getStoredUser(),
    };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

export function AuthProvider({ children }) {
  const [boot] = useState(readInitialAuth);
  const [isAuthenticated, setIsAuthenticated] = useState(boot.isAuthenticated);
  const [user, setUser] = useState(boot.user);
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

  const login = useCallback((accessToken, userData, options) => {
    setSession(accessToken, userData, options);
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

  const updateUser = useCallback((partial) => {
    const next = patchStoredUser(partial);
    if (next) setUser(next);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
      updateUser,
      sessionExpired,
      clearSessionExpired,
    }),
    [isAuthenticated, user, login, logout, updateUser, sessionExpired, clearSessionExpired],
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
