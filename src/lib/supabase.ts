import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default to your Supabase project
const SUPABASE_URL = 'https://dqufbzzhiktzesmjupnh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_EzEJVDjkSNi1hzuSPeBfIw_Emli3HFL';

let supabaseInstance: SupabaseClient | null = null;

export function createServerClient(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

export const supabase = { createServerClient };