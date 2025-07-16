"use client"

import { useMemo, useState } from "react"
import { useApplications } from "@/lib/queries/applications"
import { useFrameworks } from "@/lib/queries/frameworks"
import { useComplianceAssessments } from "@/lib/queries/assessments"
import { useSupabaseQuery } from "@/lib/swr-client"
import { supabase } from "@/lib/supabase"
import LoadingSkeleton from "./LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, Filter } from "lucide-react"
import type { Control } from "@/types"

interface FilterState {
  applications: string[]
  frameworks: { [key: string]: string[] }
  overall: string[]
}

export default function ApplicationsFrameworkTable() {
  const { data: applications, isLoading: appsLoading } = useApplications()
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()
  const { data: assessments, isLoading: assessmentsLoading } = useComplianceAssessments()

  const { data: allControls, isLoading: controlsLoading } = useSupabaseQuery<Control>("all-controls", () =>
    supabase.from("controls").select("*"),
  )

  const [filters, setFilters] = useState<FilterState>({
    applications: [],
    frameworks: {},
    overall: [],
  })

  const tableData = useMemo(() => {
    if (!applications || !frameworks || !assessments || !allControls) return []

    return applications.map((app) => {
      const frameworkScores = frameworks.map((framework) => {
        // Get controls for this framework
        const frameworkControls = allControls.filter((control) => control.framework_id === framework.id)

        // Get assessments for this app and framework (using mapped_from to identify framework)
        const appFrameworkAssessments = assessments.filter(
          (assessment) => assessment.application_id === app.id && assessment.mapped_from === framework.id,
        )

        const totalControls = frameworkControls.length

        // Count controls based on score thresholds
        const passingControls = appFrameworkAssessments.filter((a) => a.score >= 0.8).length
        const partialControls = appFrameworkAssessments.filter((a) => a.score >= 0.4 && a.score < 0.8).length
        const totalPassedControls = passingControls + partialControls

        const score = totalControls > 0 ? Math.round((totalPassedControls / totalControls) * 100) : 0

        return {
          frameworkId: framework.id,
          frameworkName: framework.name,
          score,
          passedControls: totalPassedControls,
          totalControls,
          passingControls,
          partialControls,
          status: score >= 80 ? "compliant" : score >= 40 ? "warning" : "critical",
        }
      })

      // Calculate overall score as average of all framework scores
      const overallScore =
        frameworkScores.length > 0
          ? Math.round(frameworkScores.reduce((sum, fw) => sum + fw.score, 0) / frameworkScores.length)
          : 0

      return {
        ...app,
        frameworkScores,
        overall_score: overallScore,
      }
    })
  }, [applications, frameworks, assessments, allControls])

  const filteredData = useMemo(() => {
    if (!tableData.length) return []

    return tableData.filter((app) => {
      // Filter by application names
      if (filters.applications.length > 0 && !filters.applications.includes(app.name)) {
        return false
      }

      // Filter by framework scores
      for (const [frameworkId, statuses] of Object.entries(filters.frameworks)) {
        if (statuses.length > 0) {
          const frameworkScore = app.frameworkScores.find((fs) => fs.frameworkId === frameworkId)
          if (!frameworkScore || !statuses.includes(frameworkScore.status)) {
            return false
          }
        }
      }

      // Filter by overall score
      if (filters.overall.length > 0) {
        const overallStatus = app.overall_score >= 80 ? "compliant" : app.overall_score >= 40 ? "warning" : "critical"
        if (!filters.overall.includes(overallStatus)) {
          return false
        }
      }

      return true
    })
  }, [tableData, filters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-emerald-500"
      case "warning":
        return "bg-amber-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "compliant":
        return "Compliant (≥80%)"
      case "warning":
        return "Warning (40-79%)"
      case "critical":
        return "Critical (<40%)"
      default:
        return status
    }
  }

  const updateApplicationFilter = (appName: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      applications: checked ? [...prev.applications, appName] : prev.applications.filter((name) => name !== appName),
    }))
  }

  const updateFrameworkFilter = (frameworkId: string, status: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      frameworks: {
        ...prev.frameworks,
        [frameworkId]: checked
          ? [...(prev.frameworks[frameworkId] || []), status]
          : (prev.frameworks[frameworkId] || []).filter((s) => s !== status),
      },
    }))
  }

  const updateOverallFilter = (status: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      overall: checked ? [...prev.overall, status] : prev.overall.filter((s) => s !== status),
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      applications: [],
      frameworks: {},
      overall: [],
    })
  }

  const hasActiveFilters =
    filters.applications.length > 0 ||
    Object.values(filters.frameworks).some((arr) => arr.length > 0) ||
    filters.overall.length > 0

  if (appsLoading || frameworksLoading || assessmentsLoading || controlsLoading) {
    return (
      <div className="glass-card p-8">
        <LoadingSkeleton className="h-64" />
      </div>
    )
  }

  const uniqueApplications = [...new Set(tableData.map((app) => app.name))].sort()
  const statusOptions = ["compliant", "warning", "critical"]

  return (
    <div className="glass-card">
      <div className="p-8 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Applications Framework Compliance</h2>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Compliance status of each application across all frameworks (based on assessment scores)
        </p>
        {hasActiveFilters && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            Showing {filteredData.length} of {tableData.length} applications
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
                    >
                      <span className="flex items-center gap-1">
                        Application
                        <ChevronDown className="h-3 w-3" />
                        {filters.applications.length > 0 && <Filter className="h-3 w-3 text-blue-500" />}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Filter by Application</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {uniqueApplications.map((appName) => (
                          <div key={appName} className="flex items-center space-x-2">
                            <Checkbox
                              id={`app-${appName}`}
                              checked={filters.applications.includes(appName)}
                              onCheckedChange={(checked) => updateApplicationFilter(appName, checked as boolean)}
                            />
                            <label htmlFor={`app-${appName}`} className="text-sm cursor-pointer">
                              {appName}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              {frameworks?.map((framework) => (
                <th
                  key={framework.id}
                  className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
                      >
                        <span className="flex items-center gap-1">
                          {framework.name}
                          <ChevronDown className="h-3 w-3" />
                          {(filters.frameworks[framework.id] || []).length > 0 && (
                            <Filter className="h-3 w-3 text-blue-500" />
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="center">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Filter by {framework.name} Status</h4>
                        <div className="space-y-2">
                          {statusOptions.map((status) => (
                            <div key={status} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${framework.id}-${status}`}
                                checked={(filters.frameworks[framework.id] || []).includes(status)}
                                onCheckedChange={(checked) =>
                                  updateFrameworkFilter(framework.id, status, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${framework.id}-${status}`}
                                className="text-sm cursor-pointer flex items-center gap-2"
                              >
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                                {getStatusLabel(status)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </th>
              ))}
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-auto p-0 font-semibold text-xs uppercase tracking-wider hover:bg-transparent"
                    >
                      <span className="flex items-center gap-1">
                        Overall
                        <ChevronDown className="h-3 w-3" />
                        {filters.overall.length > 0 && <Filter className="h-3 w-3 text-blue-500" />}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Filter by Overall Status</h4>
                      <div className="space-y-2">
                        {statusOptions.map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`overall-${status}`}
                              checked={filters.overall.includes(status)}
                              onCheckedChange={(checked) => updateOverallFilter(status, checked as boolean)}
                            />
                            <label
                              htmlFor={`overall-${status}`}
                              className="text-sm cursor-pointer flex items-center gap-2"
                            >
                              <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                              {getStatusLabel(status)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
            {filteredData.map((app) => (
              <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">{app.name.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{app.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{app.owner_email}</div>
                    </div>
                  </div>
                </td>
                {app.frameworkScores.map((framework) => (
                  <td key={framework.frameworkId} className="px-6 py-6 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(framework.status)}`} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{framework.score}%</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {framework.passedControls}/{framework.totalControls} controls
                      </div>
                      {framework.partialControls > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          ({framework.partialControls} partial)
                        </div>
                      )}
                    </div>
                  </td>
                ))}
                <td className="px-6 py-6 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        app.overall_score >= 80 ? "compliant" : app.overall_score >= 40 ? "warning" : "critical",
                      )}`}
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{app.overall_score}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && tableData.length > 0 && (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium">No applications match the current filters</p>
          <Button variant="outline" className="mt-4 bg-transparent" onClick={clearAllFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {tableData.length === 0 && (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
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
          <p className="text-lg font-medium">No application data available</p>
        </div>
      )}
    </div>
  )
}
