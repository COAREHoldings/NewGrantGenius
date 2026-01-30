import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase project credentials
const SUPABASE_URL = 'https://dvuhtfzsvcacyrlfettz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dWh0ZnpzdmNhY3lybGZldHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDk3OTYsImV4cCI6MjA4NTIyNTc5Nn0.vUtnPXeQrzU0kO0E7qK2qJtZ_RCqnXCEFSa60adHld0';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2dWh0ZnpzdmNhY3lybGZldHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY0OTc5NiwiZXhwIjoyMDg1MjI1Nzk2fQ.LwTr315VLD6hDogIQC7d7nzXMJIeZqodktpD5JHTLk0';

let serverClientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

// Client with anon key - for read operations
export function createServerClient(): SupabaseClient {
  if (!serverClientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
    serverClientInstance = createClient(url, key);
  }
  return serverClientInstance;
}

// Admin client with service role key - for write operations
export function createAdminClient(): SupabaseClient {
  if (!adminClientInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY;
    adminClientInstance = createClient(url, key);
  }
  return adminClientInstance;
}

export const supabase = { createServerClient, createAdminClient };
