"use client"

import { useMemo, useState, useEffect } from "react"
import { PencilSquareIcon, XMarkIcon, PlusIcon } from "@heroicons/react/24/outline"
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid"
import type { Framework, Control, FrameworkMapping } from "@/types"
import { saveFrameworkMappings } from "@/lib/queries/mapping"


interface FrameworkComparisonTableProps {
  masterFramework: Framework
  otherFrameworks: Framework[]
  allControls: Control[]
  allMappings: FrameworkMapping[]
  mutateMappings: () => Promise<any> 
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
  const [editMode, setEditMode] = useState(false)
  const [editingCell, setEditingCell] = useState<{ controlId: string; frameworkId: string } | null>(null)
  const [editedMappings, setEditedMappings] = useState<FrameworkMapping[]>(allMappings)
  const [originalMappings, setOriginalMappings] = useState<FrameworkMapping[]>(allMappings)
  const [saving, setSaving] = useState(false)
  const [addMappingDropdown, setAddMappingDropdown] = useState<{ controlId: string; frameworkId: string } | null>(null)
  const [selectedAddControlIds, setSelectedAddControlIds] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "ID",
    direction: "ascending",
  })

  const { domains, processedData } = useMemo(() => {
    if (!masterFramework || !allControls || !editedMappings) return { domains: [], processedData: [] }

    const masterControls = allControls.filter((c) => c.framework_id === masterFramework.id)
    const controlsById = new Map(allControls.map((c) => [c.id, c]))
    const uniqueDomains = [...new Set(masterControls.map((c) => c.Domain))].filter(Boolean).sort()

    const data = uniqueDomains.map((domain) => {
      const controlsInDomain = masterControls.filter((c) => c.Domain === domain)

      const rows = controlsInDomain.map((masterControl) => {
        const mappedControls: { [frameworkId: string]: Control[] } = {}
        const relevantMappings = editedMappings.filter(
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
  }, [masterFramework, allControls, editedMappings, sortConfig])

  // Effect to auto-select the first domain when the component loads or master framework changes
  useEffect(() => {
    if (domains.length > 0 && !domains.includes(selectedDomain || "")) {
      setSelectedDomain(domains[0])
    }
  }, [domains, selectedDomain])

  // Keep originalMappings in sync with allMappings when not editing
  useEffect(() => {
    if (!editMode) {
      setEditedMappings(allMappings)
      setOriginalMappings(allMappings)
    }
  }, [allMappings, editMode])

  const handleSort = () => {
    setSortConfig((prev) => ({
      ...prev,
      direction: prev.direction === "ascending" ? "descending" : "ascending",
    }))
  }

  const selectedDomainData = processedData.find((d) => d.domainName === selectedDomain)

  return (
    <div className="glass-card h-[80vh] flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Framework Control Comparison</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comparing <span className="font-bold">{masterFramework.name}</span> (Master) against other frameworks.
          </p>
        </div>
        {!editMode ? (
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            onClick={() => {
              setEditMode(true)
              setEditingCell(null)
              setOriginalMappings(editedMappings)
            }}
          >
            <PencilSquareIcon className="h-5 w-5" />
            Edit Mappings
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors bg-blue-600 text-white disabled:opacity-60"
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                try {
                  await saveFrameworkMappings(editedMappings, originalMappings)
                  await mutateMappings()
                } catch (err) {
                  // Optionally show error
                } finally {
                  setSaving(false)
                  setEditMode(false)
                  setEditingCell(null)
                }
              }}
            >
              {saving && <span className="animate-spin mr-2"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg></span>}Save
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              disabled={saving}
              onClick={() => {
                setEditMode(false)
                setEditingCell(null)
                setEditedMappings(originalMappings)
              }}
            >
              Cancel
            </button>
          </div>
        )}
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
                className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${selectedDomain === domain
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
                    className={`w-80 p-4 text-left text-sm font-semibold ${frameworkColors[index % frameworkColors.length]
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
                    <div className="p-2 rounded-lg">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{row.masterControl.ID}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{row.masterControl.Controls}</p>
                    </div>
                  </td>
                  {otherFrameworks.map((fw) => {
                    const isEditing = editMode && editingCell && editingCell.controlId === row.masterControl.id && editingCell.frameworkId === fw.id
                    return (
                      <td
                        key={fw.id}
                        className={`w-80 p-2 align-top border-b border-gray-200 dark:border-gray-700 ${editMode ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (editMode) setEditingCell({ controlId: row.masterControl.id, frameworkId: fw.id })
                        }}
                      >
                        <div className="space-y-2">
                          {isEditing ? (
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700">
                              <div className="flex flex-col gap-2">
                                {(row.mappedControls[fw.id] || []).map((control) => (
                                  <div key={control.id} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      value={control.Controls}
                                      onChange={(e) => {
                                        setEditedMappings((prev) =>
                                          prev.map((m) =>
                                            (m.source_control_id === row.masterControl.id && m.target_control_id === control.id) ||
                                              (m.target_control_id === row.masterControl.id && m.source_control_id === control.id)
                                              ? {
                                                ...m,
                                                Controls: e.target.value,
                                              }
                                              : m
                                          )
                                        )
                                      }}
                                    />
                                    <button
                                      className="text-red-500 hover:text-red-700"
                                      onClick={(ev) => {
                                        ev.stopPropagation()
                                        setEditedMappings((prev) =>
                                          prev.filter(
                                            (m) =>
                                              !((m.source_control_id === row.masterControl.id && m.target_control_id === control.id) ||
                                                (m.target_control_id === row.masterControl.id && m.source_control_id === control.id))
                                          )
                                        )
                                      }}
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                <div className="mt-2">
                                  {addMappingDropdown && addMappingDropdown.controlId === row.masterControl.id && addMappingDropdown.frameworkId === fw.id ? (
                                    <div className="flex flex-col gap-2 mt-2 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow">
                                      <label className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">Search & select controls to map:</label>
                                      <input
                                        type="text"
                                        className="mb-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                                        placeholder="Search controls..."
                                        value={window.addMappingSearch || ""}
                                        onChange={e => {
                                          window.addMappingSearch = e.target.value
                                          setAddMappingDropdown({ ...addMappingDropdown }) // force re-render
                                        }}
                                      />
                                      <div className="max-h-40 overflow-y-auto border rounded">
                                        {allControls
                                          .filter((c) => c.framework_id === fw.id && !(row.mappedControls[fw.id] || []).some(mc => mc.id === c.id))
                                          .filter((c) => {
                                            const search = (window.addMappingSearch || "").toLowerCase()
                                            return !search || (c.ID?.toLowerCase().includes(search) || (c.Controls || "").toLowerCase().includes(search) || (c.name || "").toLowerCase().includes(search))
                                          })
                                          .map((c) => (
                                            <label key={c.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={selectedAddControlIds.includes(c.id)}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setSelectedAddControlIds(ids => [...ids, c.id])
                                                  } else {
                                                    setSelectedAddControlIds(ids => ids.filter(id => id !== c.id))
                                                  }
                                                }}
                                              />
                                              <span className="text-xs">{c.ID} - {c.Controls || c.name}</span>
                                            </label>
                                          ))}
                                      </div>
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
                                          onClick={(ev) => {
                                            ev.stopPropagation()
                                            if (!selectedAddControlIds.length) return
                                            setEditedMappings((prev) => [
                                              ...prev,
                                              ...selectedAddControlIds.map(controlId => ({
                                                source_control_id: row.masterControl.id,
                                                target_control_id: controlId,
                                                Controls: allControls.find(c => c.id === controlId)?.Controls || "",
                                              }))
                                            ])
                                            setAddMappingDropdown(null)
                                            setSelectedAddControlIds([])
                                            window.addMappingSearch = ""
                                          }}
                                        >Add Selected</button>
                                        <button
                                          className="px-3 py-1 rounded bg-gray-300 text-xs font-semibold"
                                          onClick={(ev) => {
                                            ev.stopPropagation()
                                            setAddMappingDropdown(null)
                                            setSelectedAddControlIds([])
                                            window.addMappingSearch = ""
                                          }}
                                        >Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                                      onClick={(ev) => {
                                        ev.stopPropagation()
                                        setAddMappingDropdown({ controlId: row.masterControl.id, frameworkId: fw.id })
                                        setSelectedAddControlIds([])
                                      }}
                                    >
                                      <PlusIcon className="h-3 w-3" /> Add Mapping
                                    </button>
                                  )}
                                </div>
                                <button
                                  className="mt-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs"
                                  onClick={(ev) => {
                                    ev.stopPropagation()
                                    setEditingCell(null)
                                  }}
                                >Done</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {(row.mappedControls[fw.id] || []).map((control) => (
                                <div
                                  key={control.id}
                                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                >
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{control.ID}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{control.Controls}</p>
                                </div>
                              ))}
                              {(row.mappedControls[fw.id] || []).length === 0 && <div className="p-2 h-10" />}
                            </>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
