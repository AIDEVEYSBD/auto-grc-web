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

  // Get all controls to map framework relationships
  const { data: allControls, isLoading: controlsLoading } = useSupabaseQuery<Control>("all-controls", () =>
    supabase.from("controls").select("*"),
  )

  if (frameworksLoading || assessmentsLoading || controlsLoading) {
    return (
      <div className={`glass-card p-8 ${className}`}>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Framework Compliance</h3>
        <LoadingSkeleton className="h-32" />
      </div>
    )
  }

  // Calculate real compliance data for each framework
  const frameworkData =
    frameworks?.map((framework) => {
      // Get controls for this framework
      const frameworkControls = allControls?.filter((control) => control.framework_id === framework.id) || []

      // Get assessments for controls in this framework
      const frameworkControlIds = frameworkControls.map((control) => control.id)
      const frameworkAssessments =
        assessments?.filter((assessment) => frameworkControlIds.includes(assessment.control_id)) || []

      // Count passed assessments
      const passedAssessments = frameworkAssessments.filter((assessment) => assessment.status === "pass").length

      const totalControls = frameworkControls.length

      return {
        name: framework.name,
        value: passedAssessments,
        total: totalControls,
      }
    }) || []

  return (
    <div className={`glass-card p-8 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Framework Compliance</h3>

      {frameworkData.length > 0 ? (
        <div className="flex gap-12 overflow-x-auto pb-4">
          {frameworkData.map((framework, index) => (
            <DonutChart key={index} data={framework} size={140} className="flex-shrink-0" />
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
