"use client"

import { useState, useMemo } from "react"
import { ChevronRightIcon, ShieldCheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { useFrameworks } from "@/lib/queries/frameworks"
import { useComplianceAssessments } from "@/lib/queries/assessments"
import { useSupabaseQuery } from "@/lib/swr-client"
import { supabase } from "@/lib/supabase"
import type { Application, Control } from "@/types"

interface DomainPanelProps {
  applications: Application[]
  className?: string
}

export default function DomainPanel({ applications, className = "" }: DomainPanelProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  const { data: frameworks } = useFrameworks()
  const { data: assessments } = useComplianceAssessments()

  const { data: allControls } = useSupabaseQuery<Control>("all-controls", () => supabase.from("controls").select("*"))

  // Get master framework
  const masterFramework = frameworks?.find((f) => f.master === true)

  // Get domains from master framework
  const domainData = useMemo(() => {
    if (!masterFramework || !allControls || !assessments) return []

    const masterControls = allControls.filter((control) => control.framework_id === masterFramework.id)
    const domains = [...new Set(masterControls.map((control) => control.Domain))].filter(Boolean)

    return domains.map((domain) => {
      const domainControls = masterControls.filter((control) => control.Domain === domain)
      const domainControlIds = domainControls.map((control) => control.id)

      const compliantApps: Application[] = []
      const nonCompliantApps: Application[] = []

      applications.forEach((app) => {
        const appDomainAssessments = assessments.filter(
          (assessment) => assessment.application_id === app.id && domainControlIds.includes(assessment.control_id),
        )

        const totalDomainControls = domainControls.length
        const passedAssessments = appDomainAssessments.filter((a) => a.status === "pass").length

        // If no assessments exist, default to non-compliant
        const complianceRate = totalDomainControls > 0 ? passedAssessments / totalDomainControls : 0

        if (complianceRate >= 0.8) {
          compliantApps.push(app)
        } else {
          nonCompliantApps.push(app)
        }
      })

      return {
        name: domain,
        compliantApps,
        nonCompliantApps,
        totalControls: domainControls.length,
      }
    })
  }, [masterFramework, allControls, assessments, applications])

  const selectedDomainData = domainData.find((d) => d.name === selectedDomain)

  if (!masterFramework) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-6 h-6 text-gray-400" />
          </div>
          No master framework found
        </div>
      </div>
    )
  }

  return (
    <div className={`glass-card ${className}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
            <ShieldCheckIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance by Domain</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Based on {masterFramework.name} (Master Framework) - Select a domain to view application compliance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
        {/* Domain List */}
        <div className="border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Security Domains</h4>
            <div className="space-y-1">
              {domainData.map((domain) => (
                <button
                  key={domain.name}
                  onClick={() => setSelectedDomain(domain.name)}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    selectedDomain === domain.name
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div>
                    <span className="font-medium">{domain.name}</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{domain.totalControls} controls</div>
                  </div>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Non-Compliant Apps */}
        <div className="border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Non-Compliant Applications
            </h4>
            {selectedDomainData ? (
              <div className="space-y-2">
                {selectedDomainData.nonCompliantApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</span>
                      <span className="text-xs text-red-600 dark:text-red-400">{Math.round(app.overall_score)}%</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {app.criticality || "Unknown"} • {app["cloud-provider"] || "Unknown"}
                    </p>
                  </div>
                ))}
                {selectedDomainData.nonCompliantApps.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 mx-auto mb-2 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <ShieldCheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      All applications compliant!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">Select a domain to view applications</p>
            )}
          </div>
        </div>

        {/* Compliant Apps */}
        <div>
          <div className="p-4">
            <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Compliant Applications
            </h4>
            {selectedDomainData ? (
              <div className="space-y-2">
                {selectedDomainData.compliantApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {Math.round(app.overall_score)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {app.criticality || "Unknown"} • {app["cloud-provider"] || "Unknown"}
                    </p>
                  </div>
                ))}
                {selectedDomainData.compliantApps.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 mx-auto mb-2 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">No compliant applications</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">Select a domain to view applications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
