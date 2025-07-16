"use client"

import { useMemo, useState, useEffect } from "react"
import { ArrowUpIcon, ArrowDownIcon, PencilIcon, EyeIcon } from "@heroicons/react/24/solid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import EditMappingModal from "./EditMappingModal"
import type { Framework, Control, FrameworkMapping } from "@/types"

interface FrameworkComparisonTableProps {
  masterFramework: Framework
  otherFrameworks: Framework[]
  allControls: Control[]
  allMappings: FrameworkMapping[]
  onMappingsChange?: () => void
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
  onMappingsChange,
}: FrameworkComparisonTableProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "title",
    direction: "ascending",
  })
  const [editingCell, setEditingCell] = useState<{
    masterControl: Control
    targetFramework: Framework
  } | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const { domains, processedData } = useMemo(() => {
    if (!masterFramework || !allControls || !allMappings) return { domains: [], processedData: [] }

    const masterControls = allControls.filter((c) => c.framework_id === masterFramework.id)
    const controlsById = new Map(allControls.map((c) => [c.id, c]))
    const uniqueDomains = [...new Set(masterControls.map((c) => c.Domain))].filter(Boolean).sort()

    const data = uniqueDomains.map((domain) => {
      const controlsInDomain = masterControls.filter((c) => c.Domain === domain)

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
            if (!mappedControls[otherControl.framework_id]) mappedControls[otherControl.framework_id] = []
            mappedControls[otherControl.framework_id].push(otherControl)
          }
        })
        return { masterControl, mappedControls }
      })

      // Apply sorting
      rows.sort((a, b) => {
        const aVal = a.masterControl[sortConfig.key as keyof Control]
        const bVal = b.masterControl[sortConfig.key as keyof Control]
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1
        return 0
      })

      return { domainName: domain, rows }
    })
    return { domains: uniqueDomains, processedData: data }
  }, [masterFramework, allControls, allMappings, sortConfig])

  // Effect to auto-select the first domain when the component loads or master framework changes
  useEffect(() => {
    if (domains.length > 0 && !domains.includes(selectedDomain || "")) {
      setSelectedDomain(domains[0])
    }
  }, [domains, selectedDomain])

  const handleSort = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "ascending" ? "descending" : "ascending",
    }))
  }

  const handleCellEdit = (masterControl: Control, targetFramework: Framework) => {
    if (isEditMode) {
      setEditingCell({ masterControl, targetFramework })
    }
  }

  const handleEditClose = () => {
    setEditingCell(null)
  }

  const handleEditSave = () => {
    setEditingCell(null)
    onMappingsChange?.()
  }

  const selectedDomainData = processedData.find((d) => d.domainName === selectedDomain)

  return (
    <>
      <div className="glass-card h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Comparing {masterFramework.name} (Master) against other frameworks.
            </h2>
            <div className="flex items-center space-x-2">
              <EyeIcon className="h-4 w-4 text-gray-500" />
              <Label htmlFor="edit-mode" className="text-sm">
                Edit Mode
              </Label>
              <Switch id="edit-mode" checked={isEditMode} onCheckedChange={setIsEditMode} />
              <PencilIcon className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="flex-grow flex overflow-hidden">
          {/* Domain Filters */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Control Domains</h3>
            </div>
            <div className="overflow-y-auto p-2 space-y-1">
              {domains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                    selectedDomain === domain
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="flex-grow overflow-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm">
                  <th className="sticky left-0 z-30 w-80 p-4 text-left text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700">
                    <button onClick={handleSort} className="flex items-center gap-2 hover:text-blue-600">
                      {masterFramework.name} (Master)
                      {sortConfig.direction === "ascending" ? (
                        <ArrowUpIcon className="h-3 w-3" />
                      ) : (
                        <ArrowDownIcon className="h-3 w-3" />
                      )}
                    </button>
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
                {selectedDomainData?.rows.map((row) => (
                  <tr key={row.masterControl.id}>
                    <td className="sticky left-0 z-10 w-80 p-2 align-top bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700">
                      <div className="p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {row.masterControl.ID}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          {row.masterControl.title}
                        </p>
                        {row.masterControl.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                            {row.masterControl.description}
                          </p>
                        )}
                      </div>
                    </td>
                    {otherFrameworks.map((fw) => (
                      <td key={fw.id} className="w-80 p-2 align-top border-b border-gray-200 dark:border-gray-700">
                        <div
                          className={`min-h-[60px] p-2 rounded-lg transition-colors relative ${
                            isEditMode
                              ? "border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer group"
                              : ""
                          }`}
                          onClick={() => handleCellEdit(row.masterControl, fw)}
                        >
                          {/* Edit button overlay - only show in edit mode */}
                          {isEditMode && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <PencilIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          <div className="space-y-2">
                            {(row.mappedControls[fw.id] || []).map((control) => (
                              <div
                                key={control.id}
                                className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs font-mono">
                                    {control.ID}
                                  </Badge>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                  {control.title}
                                </p>
                                {control.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {control.description}
                                  </p>
                                )}
                              </div>
                            ))}
                            {(row.mappedControls[fw.id] || []).length === 0 && (
                              <div className="flex items-center justify-center h-10 text-gray-400 dark:text-gray-600">
                                <span className="text-xs">{isEditMode ? "Click to add mapping" : ""}</span>
                              </div>
                            )}
                          </div>

                          {/* Mapping count badge */}
                          {isEditMode && (row.mappedControls[fw.id] || []).length > 0 && (
                            <Badge
                              variant="secondary"
                              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                            >
                              {(row.mappedControls[fw.id] || []).length}
                            </Badge>
                          )}
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

      {/* Edit Mapping Modal */}
      {editingCell && (
        <EditMappingModal
          isOpen={true}
          onClose={handleEditClose}
          masterControl={editingCell.masterControl}
          targetFramework={editingCell.targetFramework}
          existingMappings={
            selectedDomainData?.rows.find((row) => row.masterControl.id === editingCell.masterControl.id)
              ?.mappedControls[editingCell.targetFramework.id] || []
          }
          allTargetControls={allControls.filter((c) => c.framework_id === editingCell.targetFramework.id)}
          onSave={handleEditSave}
        />
      )}
    </>
  )
}
