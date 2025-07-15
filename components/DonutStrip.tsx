"use client"

import { useMemo } from "react"
import DonutChart from "./DonutChart"
import { useFrameworks } from "@/lib/queries/frameworks"
import { useComplianceAssessments } from "@/lib/queries/assessments"
import { useSupabaseQuery } from "@/lib/swr-client"
import { supabase } from "@/lib/supabase"
import LoadingSkeleton from "./LoadingSkeleton"
import type { Control } from "@/types"
import { useApplications } from "@/lib/queries/applications"

interface DonutStripProps {
  className?: string
}

export default function DonutStrip({ className = "" }: DonutStripProps) {
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()
  const { data: assessments, isLoading: assessmentsLoading } = useComplianceAssessments()
  const { data: allControls, isLoading: controlsLoading } = useSupabaseQuery<Control>("all-controls", () =>
    supabase.from("controls").select("*"),
  )
  const { data: applications, isLoading: applicationsLoading } = useApplications()

  const frameworkData = useMemo(() => {
    if (!frameworks || !assessments || !applications) return []

    return frameworks.map((framework) => {
      // Get all assessments for this framework across all applications
      const frameworkAssessments = assessments.filter((assessment) => assessment.mapped_from === framework.id)

      // Group assessments by application
      const applicationScores = new Map<string, number[]>()

      frameworkAssessments.forEach((assessment) => {
        if (!applicationScores.has(assessment.application_id)) {
          applicationScores.set(assessment.application_id, [])
        }
        applicationScores.get(assessment.application_id)!.push(assessment.score)
      })

      // Calculate average score for each application
      const applicationAverages: number[] = []
      applicationScores.forEach((scores, applicationId) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        applicationAverages.push(avgScore) // Convert to percentage
      })

      // Calculate overall average across all applications for this framework
      const overallAverage =
        applicationAverages.length > 0
          ? applicationAverages.reduce((sum, avg) => sum + avg, 0) / applicationAverages.length
          : 0

      // Get total controls for this framework for display purposes
      const frameworkControls = allControls?.filter((control) => control.framework_id === framework.id) || []
      const totalControls = frameworkControls.length
      const compliantControls = Math.round((overallAverage / 100) * totalControls)

      return {
        name: framework.name,
        value: compliantControls,
        total: totalControls,
        percentage: Math.round(overallAverage),
      }
    })
  }, [frameworks, assessments, applications, allControls])

  if (frameworksLoading || assessmentsLoading || controlsLoading || applicationsLoading) {
    return (
      <div className={`glass-card p-8 ${className}`}>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Framework Compliance</h3>
        <LoadingSkeleton className="h-32" />
      </div>
    )
  }

  return (
    <div className={`glass-card p-8 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Framework Compliance</h3>

      {frameworkData.length > 0 ? (
        <div className="flex gap-12 overflow-x-auto pb-4">
          {frameworkData.map((framework, index) => (
            <DonutChart
              key={framework.name}
              data={{
                name: framework.name,
                value: framework.value,
                total: framework.total,
              }}
              size={140}
              className="flex-shrink-0"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">No framework data available</p>
        </div>
      )}
    </div>
  )
}
