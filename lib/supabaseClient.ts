import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Returns the browser Supabase client, or null if env is not configured.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!url || !anonKey) {
    return null;
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}
