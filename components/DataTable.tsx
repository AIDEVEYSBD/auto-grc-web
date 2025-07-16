"use client"

import type React from "react"
import { useState, useMemo, useRef, useEffect } from "react"
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline"

interface Column {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  loading?: boolean
  onFilteredDataChange?: (filteredData: any[]) => void
}

export default function DataTable({ data, columns, loading = false, onFilteredDataChange }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilter && dropdownRefs.current[openFilter]) {
        const dropdown = dropdownRefs.current[openFilter]
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpenFilter(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openFilter])

  // Get unique values for a column
  const getUniqueValues = (key: string) => {
    if (key === "overall_score") {
      // Special handling for score ranges
      return ["0-49% (Critical)", "50-79% (Warning)", "80-100% (Compliant)", "Not Scored"]
    }

    const values = data.map((item) => {
      const value = item[key]
      if (value === null || value === undefined || value === "") {
        return "Not Set"
      }
      return String(value)
    })
    return [...new Set(values)].sort()
  }

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    let filtered = [...data]

    Object.entries(filters).forEach(([key, selectedValues]) => {
      if (selectedValues.length > 0) {
        filtered = filtered.filter((item) => {
          if (key === "overall_score") {
            const score = item[key] || 0
            return selectedValues.some((range) => {
              switch (range) {
                case "0-49% (Critical)":
                  return score >= 0 && score < 50
                case "50-79% (Warning)":
                  return score >= 50 && score < 80
                case "80-100% (Compliant)":
                  return score >= 80
                case "Not Scored":
                  return score === 0
                default:
                  return false
              }
            })
          }

          const value = item[key]
          const displayValue = value === null || value === undefined || value === "" ? "Not Set" : String(value)
          return selectedValues.includes(displayValue)
        })
      }
    })

    return filtered
  }, [data, filters])

  // Notify parent component of filtered data changes
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData)
    }
  }, [filteredData, onFilteredDataChange])

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key)
    if (!column?.sortable) return

    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === "asc" ? { key, direction: "desc" } : null
      }
      return { key, direction: "asc" }
    })
  }

  const handleFilterToggle = (key: string) => {
    const column = columns.find((col) => col.key === key)
    if (!column?.filterable) return

    setOpenFilter(openFilter === key ? null : key)
  }

  const handleFilterChange = (key: string, value: string, checked: boolean) => {
    setFilters((prev) => {
      const current = prev[key] || []
      if (checked) {
        return { ...prev, [key]: [...current, value] }
      } else {
        return { ...prev, [key]: current.filter((v) => v !== value) }
      }
    })
  }

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  const activeFilterCount = Object.values(filters).reduce((count, values) => count + values.length, 0)

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded mb-2"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto min-h-[24rem]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map((column) => {
                const isFiltered = filters[column.key]?.length > 0
                const isSorted = sortConfig?.key === column.key
                const isFilterable = column.filterable
                const isSortable = column.sortable
                const isInteractive = isFilterable || isSortable

                return (
                  <th key={column.key} className="text-left py-3 px-4 relative">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (isFilterable) {
                            handleFilterToggle(column.key)
                          } else if (isSortable) {
                            handleSort(column.key)
                          }
                        }}
                        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                          isFiltered
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300"
                        } ${isInteractive ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span>{column.label}</span>

                        {/* Show dropdown arrow for filterable columns */}
                        {isFilterable && (
                          <ChevronDownIcon
                            className={`h-3 w-3 transition-colors ${
                              isFiltered ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                            }`}
                          />
                        )}

                        {/* Show sort arrow for sortable (but not filterable) columns */}
                        {isSortable && !isFilterable && isSorted && (
                          <>
                            {sortConfig.direction === "asc" ? (
                              <ChevronUpIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                            )}
                          </>
                        )}

                        {/* Show filter count badge */}
                        {isFiltered && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                            {filters[column.key].length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Filter Dropdown */}
                    {isFilterable && openFilter === column.key && (
                      <div
                        ref={(el) => (dropdownRefs.current[column.key] = el)}
                        className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                        style={{ zIndex: 2147483647 }} // Max 32-bit integer (browser-safe max z-index)
                      >
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              Filter by {column.label}
                            </span>
                            {filters[column.key]?.length > 0 && (
                              <button
                                onClick={() => clearFilter(column.key)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {getUniqueValues(column.key).map((value) => (
                              <label
                                key={value}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  checked={filters[column.key]?.includes(value) || false}
                                  onChange={(e) => handleFilterChange(column.key, value, e.target.checked)}
                                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                                  {value}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {columns.map((column) => (
                  <td key={column.key} className="py-4 px-4">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Filter Summary */}
      {activeFilterCount > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Showing {sortedData.length} of {data.length} applications
              {activeFilterCount > 0 && (
                <span className="ml-2">
                  ({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active)
                </span>
              )}
            </div>
            <button onClick={clearAllFilters} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {sortedData.length === 0 && data.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No applications match the current filters.
        </div>
      )}
    </div>
  )
}
