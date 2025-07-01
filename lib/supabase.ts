import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Central place to configure the Supabase client.
 * We expose:
 *   • supabase      – a default singleton (works on server & browser)
 *   • createClient  – factory/helper if you need an additional instance
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required",
  )
}

/* ---------- default singleton ---------- */
export const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/* ---------- optional helper ---------- */
let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  // On the server we just return the singleton
  if (typeof window === "undefined") return supabase

  // In the browser ensure we create the client only once
  if (!browserClient) {
    browserClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return browserClient
}

/* ---------- optional connectivity check ---------- */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("applications").select("id").limit(1)
    if (error) throw error
    return true
  } catch (err) {
    console.error("Supabase connection error:", err)
    return false
  }
}
