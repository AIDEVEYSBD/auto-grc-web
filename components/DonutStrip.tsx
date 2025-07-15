"use client"

import { useMemo } from "react"
import DonutChart from "./DonutChart"
import { useFrameworks } from "@/lib/queries/frameworks"
import { useComplianceAssessments } from "@/lib/queries/assessments"
import { useSupabaseQuery } from "@/lib/swr-client"
import { supabase } from "@/lib/supabase"
import type { Control } from "@/types"

/**
 * Shows a row of donut charts – one for each framework – indicating
 * how many controls are at least partially met (score ≥ 0.4) out of
 * the total number of controls in that framework.
 */
export default function DonutStrip({ className = "" }: { className?: string }) {
  /* ───────────────────── data fetch ───────────────────── */
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()
  const { data: assessments, isLoading: assessmentsLoading } = useComplianceAssessments()

  const { data: allControls, isLoading: controlsLoading } = useSupabaseQuery<Control>("all-controls", () =>
    supabase.from("controls").select("*"),
  )

  /* ────────────────── derived framework data ───────────── */
  const frameworkData = useMemo(() => {
    if (!frameworks || !assessments || !allControls) return []

    return frameworks.map((fw) => {
      // list of controls belonging to this framework
      const controls = allControls.filter((c) => c.framework_id === fw.id)
      const totalControls = controls.length

      // assessments that originate from this framework
      const fwAssessments = assessments.filter((a) => a.mapped_from === fw.id)

      // passing ≥ 0.8, partial ≥ 0.4 < 0.8
      const passed = fwAssessments.filter((a) => a.score >= 0.8).length
      const partial = fwAssessments.filter((a) => a.score >= 0.4 && a.score < 0.8).length

      const compliantControls = passed + partial
      return {
        name: fw.name,
        value: compliantControls, // controls at least partially met
        total: totalControls,
      }
    })
  }, [frameworks, assessments, allControls])

  /* ───────────────────── loading state ─────────────────── */
  if (frameworksLoading || assessmentsLoading || controlsLoading) {
    return (
      <div className={`glass-card p-8 ${className}`}>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Framework Compliance</h3>
        <div className="h-32 animate-pulse rounded-md bg-muted/40" />
      </div>
    )
  }

  /* ─────────────────────── render ──────────────────────── */
  return (
    <div className={`glass-card p-8 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Framework Compliance</h3>

      {frameworkData.length > 0 ? (
        <div className="flex gap-12 overflow-x-auto pb-4">
          {frameworkData.map((fw) => (
            <DonutChart key={fw.name} data={fw} size={140} className="flex-shrink-0" />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 dark:text-gray-400">No framework data available</p>
      )}
    </div>
  )
}
