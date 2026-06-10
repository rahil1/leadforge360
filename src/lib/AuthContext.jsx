import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [session, setSession] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [authError, setAuthError] = useState(null);

  // =========================
  // FETCH PROFILE (SOURCE OF TRUTH)
  // =========================
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }

    return data;
  };

  // =========================
  // INIT AUTH
  // =========================
  const initAuth = async () => {
    try {
      setIsLoadingAuth(true);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setAuthError(error);
        setIsLoadingAuth(false);
        return;
      }

      const currentSession = data?.session || null;
      setSession(currentSession);

      if (currentSession?.user) {
        setUser(currentSession.user);
        setIsAuthenticated(true);

        const prof = await fetchProfile(currentSession.user.id);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (err) {
      console.error(err);
      setAuthError(err);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  // =========================
  // LISTEN AUTH CHANGES
  // =========================
  useEffect(() => {
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);

          const prof = await fetchProfile(session.user.id);
          setProfile(prof);
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }

        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAuthenticated(false);
  };

  // =========================
  // ROUTING LOGIC (CRITICAL)
  // =========================
  const getHomePath = () => {
    const role = profile?.role;

    if (!role || role === null || role === '') {
      return '/onboarding';
    }

    if (role === 'admin') {
      return '/admin/users';
    }

    return '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,

        isAuthenticated,
        isLoadingAuth,
        authChecked,
        authError,

        logout,
        getHomePath,

        // optional helper for future use
        refreshProfile: async () => {
          if (user?.id) {
            const prof = await fetchProfile(user.id);
            setProfile(prof);
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
