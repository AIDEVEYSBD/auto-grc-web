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

export async function setMasterFramework(frameworkId: string) {
  /* Supabase requires at least one filter on an update.  
     Instead of a “fake” UUID, simply clear the current master(s) by
     targeting rows where `master = true`, then promote the chosen ID. */

  // 1. Unset any existing master frameworks
  const { error: resetError } = await supabase.from("frameworks").update({ master: false }).eq("master", true)

  if (resetError) {
    console.error("Error resetting master frameworks:", resetError)
    throw resetError
  }

  // 2. Set the requested framework as the new master
  const { data, error } = await supabase.from("frameworks").update({ master: true }).eq("id", frameworkId).select()

  if (error) {
    console.error("Error setting new master framework:", error)
    throw error
  }

  return data
}
