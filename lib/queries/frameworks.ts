import { supabase } from "../supabase"
import { useSupabaseQuery } from "../swr-client"
import type { Framework, Control } from "@/types"

export function useFrameworks() {
  return useSupabaseQuery<Framework>("frameworks", () =>
    supabase.from("frameworks").select("*").order("created_at", { ascending: false }),
  )
}

export function useFrameworkControls(frameworkId?: string) {
  return useSupabaseQuery<Control>(`controls-${frameworkId}`, () =>
    frameworkId
      ? supabase.from("controls").select("*").eq("framework_id", frameworkId).order("Domain", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  )
}

export function useFrameworkKPIs() {
  const { data: frameworks } = useFrameworks()
  const { data: controls } = useSupabaseQuery<Control>("all-controls", () => supabase.from("controls").select("*"))

  return {
    activeFrameworks: frameworks?.length || 0,
    totalControls: controls?.length || 0,
    frameworks: frameworks || [],
    controls: controls || [],
  }
}
