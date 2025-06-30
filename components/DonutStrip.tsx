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
      <div className={`glass-card p-6 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold">Framework Compliance</h3>
        </div>
        <LoadingSkeleton className="h-24" />
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
        total: totalControls || 1, // Avoid division by zero
      }
    }) || []

  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Framework Compliance</h3>
      </div>

      {frameworkData.length > 0 ? (
        <div className="flex gap-8 overflow-x-auto pb-2">
          {frameworkData.map((framework, index) => (
            <DonutChart key={index} data={framework} size={120} className="flex-shrink-0" />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          No framework data available
        </div>
      )}
    </div>
  )
}
