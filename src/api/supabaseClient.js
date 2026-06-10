import { createClient } from '@supabase/supabase-js';

// Use Vite env variables (same pattern as your app params system)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Single source of truth client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
