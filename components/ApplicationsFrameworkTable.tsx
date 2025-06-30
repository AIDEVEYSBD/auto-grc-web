"use client"

import { useMemo } from "react"
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid"
import { useApplications } from "@/lib/queries/applications"
import { useFrameworks } from "@/lib/queries/frameworks"
import { useComplianceAssessments } from "@/lib/queries/assessments"
import { useSupabaseQuery } from "@/lib/swr-client"
import { supabase } from "@/lib/supabase"
import LoadingSkeleton from "./LoadingSkeleton"
import type { Control } from "@/types"

export default function ApplicationsFrameworkTable() {
  const { data: applications, isLoading: appsLoading } = useApplications()
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()
  const { data: assessments, isLoading: assessmentsLoading } = useComplianceAssessments()

  const { data: allControls, isLoading: controlsLoading } = useSupabaseQuery<Control>("all-controls", () =>
    supabase.from("controls").select("*"),
  )

  const tableData = useMemo(() => {
    if (!applications || !frameworks || !assessments || !allControls) return []

    return applications.map((app) => {
      const frameworkScores = frameworks.map((framework) => {
        // Get controls for this framework
        const frameworkControls = allControls.filter((control) => control.framework_id === framework.id)

        // Get assessments for this app and framework
        const appFrameworkAssessments = assessments.filter(
          (assessment) =>
            assessment.application_id === app.id &&
            frameworkControls.some((control) => control.id === assessment.control_id),
        )

        const totalControls = frameworkControls.length
        const passedControls = appFrameworkAssessments.filter((a) => a.status === "pass").length
        const score = totalControls > 0 ? Math.round((passedControls / totalControls) * 100) : 0

        return {
          frameworkId: framework.id,
          frameworkName: framework.name,
          score,
          status: score >= 80 ? "compliant" : score >= 40 ? "warning" : "critical",
        }
      })

      return {
        ...app,
        frameworkScores,
      }
    })
  }, [applications, frameworks, assessments, allControls])

  const getStatusIcon = (status: string, score: number) => {
    switch (status) {
      case "compliant":
        return <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
      case "critical":
        return <XCircleIcon className="w-5 h-5 text-red-600" />
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />
    }
  }

  if (appsLoading || frameworksLoading || assessmentsLoading || controlsLoading) {
    return (
      <div className="glass-card p-6">
        <LoadingSkeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="glass-card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Applications Framework Compliance</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Compliance status of each application across all frameworks
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Application
              </th>
              {frameworks?.map((framework) => (
                <th
                  key={framework.id}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {framework.name}
                </th>
              ))}
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Overall
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">{app.name.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{app.owner_email}</div>
                    </div>
                  </div>
                </td>
                {app.frameworkScores.map((framework) => (
                  <td key={framework.frameworkId} className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(framework.status, framework.score)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{framework.score}%</span>
                    </div>
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getStatusIcon(
                      app.overall_score >= 80 ? "compliant" : app.overall_score >= 40 ? "warning" : "critical",
                      app.overall_score,
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(app.overall_score)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tableData.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
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
          No application data available
        </div>
      )}
    </div>
  )
}
