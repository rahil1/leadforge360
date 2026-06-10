import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext();

/**
 * SUPABASE CLIENT (DATA LAYER ONLY)
 * Auth is still Base44 at this stage
 */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [authError, setAuthError] = useState(null);

  // ---------------------------------------
  // INIT AUTH (BASE44 STILL SOURCE OF TRUTH)
  // ---------------------------------------
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      setIsLoadingAuth(true);

      const currentUser = await base44.auth.me();

      if (!currentUser) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }

      setUser(currentUser);
      setIsAuthenticated(true);

      await loadProfile(currentUser.id);

      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  // ---------------------------------------
  // LOAD SUPABASE PROFILE (ONLY DATA LAYER)
  // ---------------------------------------
  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      setProfile(null);
      return;
    }

    setProfile(data);
  };

  // ---------------------------------------
  // MANUAL REFRESH (USED BY ROUTES)
  // ---------------------------------------
  const checkUserAuth = async () => {
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      return;
    }

    setUser(currentUser);
    setIsAuthenticated(true);

    await loadProfile(currentUser.id);

    setAuthChecked(true);
  };

  // ---------------------------------------
  // LOGOUT (UNCHANGED BEHAVIOR)
  // ---------------------------------------
  const logout = (shouldRedirect = true) => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  // ---------------------------------------
  // ROUTING LOGIC (NOW USES SUPABASE PROFILE)
  // ---------------------------------------
  const getHomePath = (p = profile) => {
    const role = p?.role;

    if (!role || role === '' || role === null) return '/onboarding';
    if (role === 'admin') return '/admin';
    if (role === 'provider') return '/provider';

    return '/home';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,

        isAuthenticated,
        isLoadingAuth,
        authChecked,
        authError,

        logout,
        checkUserAuth,
        getHomePath
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
