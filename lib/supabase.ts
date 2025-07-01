import { createClient as createBrowserClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Singleton browser-side Supabase client.
 * Uses NEXT_PUBLIC_* env vars that are already available in Next.js.
 */
let _supabase: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (_supabase) return _supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  _supabase = createBrowserClient(url, anon)
  return _supabase
}

/**
 * Convenience export so you can:
 *   import { supabase } from "@/lib/supabase"
 */
export const supabase = createClient()
