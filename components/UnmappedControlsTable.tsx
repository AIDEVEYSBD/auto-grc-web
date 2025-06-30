"use client"

import { useMemo, useState, useEffect } from "react"
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid"
import type { Framework, Control, FrameworkMapping } from "@/types"

interface UnmappedControlsTableProps {
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

export default function UnmappedControlsTable({
  masterFramework,
  otherFrameworks,
  allControls,
  allMappings,
}: UnmappedControlsTableProps) {
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "ID",
    direction: "ascending",
  })

  const { frameworksWithUnmapped, processedData } = useMemo(() => {
    if (!masterFramework || !allControls || !allMappings) return { frameworksWithUnmapped: [], processedData: [] }

    const masterControlIds = new Set(allControls.filter((c) => c.framework_id === masterFramework.id).map((c) => c.id))

    // Get all mapped control IDs from other frameworks
    const mappedControlIds = new Set<string>()
    allMappings.forEach((mapping) => {
      if (masterControlIds.has(mapping.source_control_id)) {
        mappedControlIds.add(mapping.target_control_id)
      }
      if (masterControlIds.has(mapping.target_control_id)) {
        mappedControlIds.add(mapping.source_control_id)
      }
    })

    const data = otherFrameworks.map((framework) => {
      const frameworkControls = allControls.filter((c) => c.framework_id === framework.id)

      // Find controls that are NOT mapped to the master framework
      const unmappedControls = frameworkControls.filter((control) => !mappedControlIds.has(control.id))

      // Group by domain and sort
      const controlsByDomain = unmappedControls.reduce(
        (acc, control) => {
          const domain = control.Domain || "Other"
          if (!acc[domain]) acc[domain] = []
          acc[domain].push(control)
          return acc
        },
        {} as Record<string, Control[]>,
      )

      // Sort controls within each domain
      Object.keys(controlsByDomain).forEach((domain) => {
        controlsByDomain[domain].sort((a, b) => {
          const aVal = a[sortConfig.key as keyof Control]
          const bVal = b[sortConfig.key as keyof Control]
          if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1
          if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1
          return 0
        })
      })

      return {
        framework,
        unmappedControls,
        controlsByDomain,
        totalUnmapped: unmappedControls.length,
      }
    })

    // Filter out frameworks with no unmapped controls
    const frameworksWithData = data.filter((item) => item.totalUnmapped > 0)

    return {
      frameworksWithUnmapped: frameworksWithData.map((item) => item.framework),
      processedData: frameworksWithData,
    }
  }, [masterFramework, otherFrameworks, allControls, allMappings, sortConfig])

  // Auto-select the first framework when the component loads
  useEffect(() => {
    if (frameworksWithUnmapped.length > 0 && !frameworksWithUnmapped.find((f) => f.id === selectedFramework)) {
      setSelectedFramework(frameworksWithUnmapped[0].id)
    }
  }, [frameworksWithUnmapped, selectedFramework])

  const handleSort = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "ascending" ? "descending" : "ascending",
    }))
  }

  const selectedFrameworkData = processedData.find((d) => d.framework.id === selectedFramework)

  if (frameworksWithUnmapped.length === 0) {
    return (
      <div className="glass-card p-8">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-medium">All Controls Mapped</p>
          <p className="text-sm mt-1">All controls from other frameworks are mapped to the master framework.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card h-[80vh] flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Unmapped Controls</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Controls from other frameworks that are not mapped to{" "}
          <span className="font-bold">{masterFramework.name}</span> (Master).
        </p>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Framework Filters */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Frameworks</h3>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {frameworksWithUnmapped.map((framework, index) => {
              const frameworkData = processedData.find((d) => d.framework.id === framework.id)
              return (
                <button
                  key={framework.id}
                  onClick={() => setSelectedFramework(framework.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                    selectedFramework === framework.id
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <div className={`font-medium ${frameworkColors[index % frameworkColors.length]}`}>
                    {framework.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {frameworkData?.totalUnmapped} unmapped controls
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="flex-grow overflow-auto">
          {selectedFrameworkData ? (
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm">
                  <th className="sticky left-0 z-30 w-20 p-4 text-left text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700">
                    Domain
                  </th>
                  <th className="w-32 p-4 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    <button onClick={handleSort} className="flex items-center gap-2 hover:text-blue-600">
                      Control ID
                      {sortConfig.direction === "ascending" ? (
                        <ArrowUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    Control Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(selectedFrameworkData.controlsByDomain).map(([domain, controls]) =>
                  controls.map((control, index) => (
                    <tr key={control.id}>
                      <td className="sticky left-0 z-10 w-20 p-4 align-top bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700">
                        {index === 0 && (
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{domain}</div>
                        )}
                      </td>
                      <td className="w-32 p-4 align-top border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{control.ID}</div>
                        {control["Sub-Domain"] && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{control["Sub-Domain"]}</div>
                        )}
                      </td>
                      <td className="p-4 align-top border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-700 dark:text-gray-300">{control.Controls}</div>
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Select a framework to view unmapped controls</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
