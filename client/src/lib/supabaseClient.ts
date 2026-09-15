import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

/**
 * Singleton Supabase browser client (anon key).
 * Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. See docs/SUPABASE_STUDY_TRACK.md",
    );
  }
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon);
}
