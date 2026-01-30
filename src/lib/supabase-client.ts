import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dqufbzzhiktzesmjupnh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_EzEJVDjkSNi1hzuSPeBfIw_Emli3HFL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
