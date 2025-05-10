import { supabase, getSupabaseClient } from '@/lib/supabaseClient';

export const createClient = () => {
  return supabase;
}; 