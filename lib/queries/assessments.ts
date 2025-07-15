import { supabase } from "../supabase"
import { useSupabaseQuery } from "../swr-client"
import type { ComplianceAssessment } from "@/types"

export function useComplianceAssessments() {
  return useSupabaseQuery<ComplianceAssessment>("compliance-assessments", () =>
    supabase.from("compliance_assessment").select("*").order("assessed_at", { ascending: false }),
  )
}

export function useAssessmentsByApplication(applicationId?: string) {
  return useSupabaseQuery<ComplianceAssessment>(`compliance-assessments-${applicationId}`, () =>
    supabase
      .from("compliance_assessment")
      .select("*")
      .eq("application_id", applicationId || ""),
  )
}

export function useAssessmentsByFramework(frameworkId?: string) {
  return useSupabaseQuery<ComplianceAssessment>(`compliance-assessments-framework-${frameworkId}`, () =>
    supabase
      .from("compliance_assessment")
      .select("*")
      .eq("mapped_from", frameworkId || ""),
  )
}
