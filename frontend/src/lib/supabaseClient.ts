import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseAuthFrontend } from "./authProviderFrontend";

let _client: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (_client !== undefined) return _client;
  if (!isSupabaseAuthFrontend()) {
    _client = null;
    return _client;
  }
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    console.error(
      "[auth] VITE_USE_SUPABASE_AUTH is set but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing",
    );
    _client = null;
    return _client;
  }
  _client = createClient(url, key);
  return _client;
}
