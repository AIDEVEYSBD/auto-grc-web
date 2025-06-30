import { supabase } from "../supabase"
import { useSupabaseQuery } from "../swr-client"
import type { FrameworkMapping } from "@/types"

export function useFrameworkMappings() {
  return useSupabaseQuery<FrameworkMapping>("mappings", () =>
    supabase.from("framework_mappings").select("*").order("created_at", { ascending: false }),
  )
}
