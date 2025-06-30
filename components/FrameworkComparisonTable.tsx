"use client"

import { useState, useMemo, useEffect } from "react"
import type { Framework, Control, FrameworkMapping } from "@/types"

interface FrameworkComparisonTableProps {
  masterFramework: Framework
  otherFrameworks: Framework[]
  allControls: Control[]
  allMappings: FrameworkMapping[]
}

const frameworkColors = [
  "text-blue-500",
  "text-emerald-500",
  "text-amber-500",
  "text-orange-500",
  "text-purple-500",
  "text-pink-500",
]

export default function FrameworkComparisonTable({
  masterFramework,
  otherFrameworks,
  allControls,
  allMappings,
}: FrameworkComparisonTableProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

  const { domains, filteredRows } = useMemo(() => {
    if (!masterFramework || !allControls || !allMappings) return { domains: [], filteredRows: [] }

    const masterControls = allControls.filter((c) => c.framework_id === masterFramework.id)
    const controlsById = new Map(allControls.map((c) => [c.id, c]))

    const allDomains = [...new Set(masterControls.map((c) => c.Domain))].filter(Boolean)

    const currentDomain = selectedDomain || allDomains[0]
    const controlsInDomain = masterControls.filter((c) => c.Domain === currentDomain)

    const rows = controlsInDomain.map((masterControl) => {
      const mappedControls: { [frameworkId: string]: Control[] } = {}
      const relevantMappings = allMappings.filter(
        (m) => m.source_control_id === masterControl.id || m.target_control_id === masterControl.id,
      )

      relevantMappings.forEach((mapping) => {
        const otherControlId =
          mapping.source_control_id === masterControl.id ? mapping.target_control_id : mapping.source_control_id
        const otherControl = controlsById.get(otherControlId)

        if (otherControl && otherControl.framework_id !== masterFramework.id) {
          if (!mappedControls[otherControl.framework_id]) {
            mappedControls[otherControl.framework_id] = []
          }
          mappedControls[otherControl.framework_id].push(otherControl)
        }
      })

      return { masterControl, mappedControls }
    })

    return { domains: allDomains, filteredRows: rows }
  }, [masterFramework, allControls, allMappings, selectedDomain])

  // Set initial domain
  useEffect(() => {
    if (!selectedDomain && domains.length > 0) {
      setSelectedDomain(domains[0])
    }
  }, [domains, selectedDomain])

  return (
    <div className="glass-card h-[80vh] flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Framework Control Comparison</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Comparing <span className="font-bold">{masterFramework.name}</span> (Master) against other frameworks.
        </p>
      </div>

      <div className="flex flex-grow min-h-0">
        {/* Domain Filters */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4 space-y-2 overflow-y-auto">
          <h3 className="px-2 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Control Domains</h3>
          {domains.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedDomain === domain
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
              }`}
            >
              {domain}
            </button>
          ))}
        </div>

        {/* Scrollable Table */}
        <div className="flex-grow overflow-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm">
                <th className="sticky left-0 z-20 w-80 p-4 text-left text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700">
                  {masterFramework.name} (Master)
                </th>
                {otherFrameworks.map((fw, index) => (
                  <th
                    key={fw.id}
                    className={`w-80 p-4 text-left text-sm font-semibold ${
                      frameworkColors[index % frameworkColors.length]
                    } border-b border-gray-200 dark:border-gray-700`}
                  >
                    {fw.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.masterControl.id}>
                  <td className="sticky left-0 z-10 w-80 p-2 align-top bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700">
                    <div className="p-2 rounded-lg">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.masterControl.ID}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{row.masterControl.Controls}</p>
                    </div>
                  </td>
                  {otherFrameworks.map((fw) => (
                    <td key={fw.id} className="w-80 p-2 align-top border-b border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        {(row.mappedControls[fw.id] || []).map((control) => (
                          <div
                            key={control.id}
                            className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                          >
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{control.ID}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{control.Controls}</p>
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
