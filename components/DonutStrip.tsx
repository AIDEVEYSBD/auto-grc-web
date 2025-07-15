"use client"

import { useMemo } from "react"
import DonutChart from "./DonutChart"
import { useFrameworks } from "@/lib/queries/frameworks"
import { useComplianceAssessments } from "@/lib/queries/assessments"
import { useSupabaseQuery } from "@/lib/swr-client"
import { supabase } from "@/lib/supabase"
import LoadingSkeleton from "./LoadingSkeleton"
import type { Control } from "@/types"

interface DonutStripProps {
  className?: string
}

export default function DonutStrip({ className = "" }: DonutStripProps) {
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()
  const { data: assessments, isLoading: assessmentsLoading } = useComplianceAssessments()
  const { data: allControls, isLoading: controlsLoading } = useSupabaseQuery<Control>("all-controls", () =>
    supabase.from("controls").select("*"),
  )

  const frameworkData = useMemo(() => {
    if (!frameworks || !assessments || !allControls) return []

    return frameworks.map((framework) => {
      // Get controls for this framework
      const frameworkControls = allControls.filter((control) => control.framework_id === framework.id)
      const totalControls = frameworkControls.length

      // Get unique assessments for controls in this framework (avoid duplicates)
      const frameworkControlIds = frameworkControls.map((control) => control.id)

      // Create a map to store the best assessment for each control
      const controlAssessmentMap = new Map()

      assessments.forEach((assessment) => {
        if (frameworkControlIds.includes(assessment.control_id)) {
          const existingAssessment = controlAssessmentMap.get(assessment.control_id)
          // Keep the assessment with the highest score for each control
          if (!existingAssessment || assessment.score > existingAssessment.score) {
            controlAssessmentMap.set(assessment.control_id, assessment)
          }
        }
      })

      const uniqueAssessments = Array.from(controlAssessmentMap.values())

      // Count passed and partial assessments
      const passedAssessments = uniqueAssessments.filter((assessment) => assessment.score >= 0.8).length
      const partialAssessments = uniqueAssessments.filter(
        (assessment) => assessment.score >= 0.4 && assessment.score < 0.8,
      ).length

      const compliantControls = passedAssessments + partialAssessments
      const compliancePercentage = totalControls > 0 ? Math.round((compliantControls / totalControls) * 100) : 0

      return {
        name: framework.name,
        value: compliantControls,
        total: totalControls,
        percentage: compliancePercentage,
      }
    })
  }, [frameworks, assessments, allControls])

  if (frameworksLoading || assessmentsLoading || controlsLoading) {
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
