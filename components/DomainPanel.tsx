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
      <div className={`glass-card p-8 ${className}`}>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium">No master framework found</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`glass-card ${className}`}>
      <div className="p-8 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Compliance by Domain</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Based on {masterFramework.name} (Master Framework) - Select a domain to view application compliance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px]">
        {/* Domain List */}
        <div className="border-r border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Security Domains</h4>
            <div className="space-y-2">
              {domainData.map((domain) => (
                <button
                  key={domain.name}
                  onClick={() => setSelectedDomain(domain.name)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    selectedDomain === domain.name
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div>
                    <span className="font-semibold">{domain.name}</span>
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
          <div className="p-6">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-4 h-4" />
              Non-Compliant Applications
            </h4>
            {selectedDomainData ? (
              <div className="space-y-3">
                {selectedDomainData.nonCompliantApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{app.name}</span>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        {Math.round(app.overall_score)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {app.criticality || "Unknown"} • {app["cloud-provider"] || "Unknown"}
                    </p>
                  </div>
                ))}
                {selectedDomainData.nonCompliantApps.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 mx-auto mb-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <ShieldCheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
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
          <div className="p-6">
            <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Compliant Applications
            </h4>
            {selectedDomainData ? (
              <div className="space-y-3">
                {selectedDomainData.compliantApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{app.name}</span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {Math.round(app.overall_score)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {app.criticality || "Unknown"} • {app["cloud-provider"] || "Unknown"}
                    </p>
                  </div>
                ))}
                {selectedDomainData.compliantApps.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 mx-auto mb-3 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">No compliant applications</p>
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
