import { createClient } from '@supabase/supabase-js';

// These MUST exist in your .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const base44 = createClient(supabaseUrl, supabaseAnonKey);

// -------------------------------
// AUTH COMPATIBILITY LAYER
// (so your existing Base44 calls don’t break)
// -------------------------------

base44.auth.me = async () => {
  const { data, error } = await base44.auth.getUser();

  if (error) throw error;

  return data?.user || null;
};

// keep same API style as Base44
base44.auth.logout = async () => {
  const { error } = await base44.auth.signOut();
  if (error) throw error;
};

base44.auth.redirectToLogin = (returnUrl) => {
  window.location.href = `/login?redirect=${encodeURIComponent(returnUrl)}`;
};

// -------------------------------
// OPTIONAL HELPERS (safe mapping layer)
// -------------------------------

export const supabase = base44;
