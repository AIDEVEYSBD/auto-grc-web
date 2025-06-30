import { supabase } from "../supabase"
import { useSupabaseQuery } from "../swr-client"
import type { ComplianceAssessment } from "@/types"

export function useComplianceAssessments() {
  return useSupabaseQuery<ComplianceAssessment>("assessments", () =>
    supabase.from("compliance_assessment").select("*").order("assessed_at", { ascending: false }),
  )
}

export function useAssessmentsByApplication(applicationId?: string) {
  return useSupabaseQuery<ComplianceAssessment>(`assessments-${applicationId}`, () =>
    supabase
      .from("compliance_assessment")
      .select("*")
      .eq("application_id", applicationId || ""),
  )
}
