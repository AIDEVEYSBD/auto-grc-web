import { supabase } from "../supabase"
import { useSupabaseQuery } from "../swr-client"
import type { Application } from "@/types"

export function useApplications() {
  return useSupabaseQuery<Application>("applications", () =>
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
  )
}

export function useApplicationKPIs() {
  const { data: applications } = useApplications()

  const total = applications?.length || 0
  const compliant = applications?.filter((app) => app.overall_score >= 80).length || 0
  const warning = applications?.filter((app) => app.overall_score >= 50 && app.overall_score < 80).length || 0
  const critical = applications?.filter((app) => app.overall_score < 50).length || 0
  const avgScore = total > 0 ? applications?.reduce((sum, app) => sum + app.overall_score, 0) / total : 0

  return {
    total,
    compliant,
    warning,
    critical,
    avgScore: Math.round(avgScore || 0),
  }
}
