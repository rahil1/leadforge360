import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setIsLoadingAuth(true);

    try {
      // 1. Session
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      // 2. Auth user
      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData?.user;

      if (!authUser) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      // 3. Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // 4. Merge user
      const mergedUser = {
        id: authUser.id,
        email: authUser.email,
        ...profile
      };

      setUser(mergedUser);
      setIsAuthenticated(true);

    } catch (err) {
      console.error('Auth error:', err);
      setUser(null);
      setIsAuthenticated(false);
    }

    setIsLoadingAuth(false);
  };

  const getHomePath = (user) => {
    const role = user?.role;

    if (!role) return '/onboarding';
    if (role === 'admin') return '/admin';
    if (role === 'provider') return '/provider';
    if (role === 'customer') return '/home';

    return '/onboarding';
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      getHomePath,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
