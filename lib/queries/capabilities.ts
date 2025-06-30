import { supabase } from "../supabase"
import { useSupabaseQuery } from "../swr-client"
import type { Capability } from "@/types"

export function useCapabilities() {
  return useSupabaseQuery<Capability>("capabilities", () =>
    supabase.from("capabilities").select("*").order("name", { ascending: true }),
  )
}

export function useCapabilityKPIs() {
  const { data: capabilities } = useCapabilities()

  const total = capabilities?.length || 0
  const active = capabilities?.filter((c) => c.is_enabled).length || 0
  const beta = Math.floor(total * 0.2) // Mock beta count
  const available = total - active

  return {
    total,
    active,
    beta,
    available,
  }
}
