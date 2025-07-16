"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import LoadingSkeleton from "./LoadingSkeleton"

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
  searchable?: boolean
  className?: string
}

export default function DataTable({
  data,
  columns,
  loading = false,
  searchable = true,
  className = "",
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((col) => col.key))
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})

  // Get unique values for each filterable column
  const getUniqueValues = (columnKey: string) => {
    if (columnKey === "overall_score") {
      // For CIS Score, create meaningful ranges
      const ranges = ["0-49% (Critical)", "50-79% (Warning)", "80-100% (Compliant)", "Not Scored"]
      return ranges
    }

    const values = data.map((row) => {
      const value = row[columnKey]
      if (value === null || value === undefined || value === "") {
        return "Not Set"
      }
      return String(value)
    })
    return [...new Set(values)].sort()
  }

  // Apply filters to data
  const filteredData = useMemo(() => {
    let filtered = data.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    )

    // Apply column filters
    Object.entries(columnFilters).forEach(([columnKey, selectedValues]) => {
      if (selectedValues.length > 0) {
        filtered = filtered.filter((row) => {
          const value = row[columnKey]

          if (columnKey === "overall_score") {
            // Handle CIS Score range filtering
            const score = value || 0
            return selectedValues.some((range) => {
              if (range === "0-49% (Critical)") return score >= 0 && score < 50
              if (range === "50-79% (Warning)") return score >= 50 && score < 80
              if (range === "80-100% (Compliant)") return score >= 80 && score <= 100
              if (range === "Not Scored") return score === 0
              return false
            })
          }

          const stringValue = value === null || value === undefined || value === "" ? "Not Set" : String(value)
          return selectedValues.includes(stringValue)
        })
      }
    })

    return filtered
  }, [data, searchTerm, columnFilters])

  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        const modifier = sortDirection === "asc" ? 1 : -1

        if (typeof aVal === "number" && typeof bVal === "number") {
          return (aVal - bVal) * modifier
        }

        return String(aVal).localeCompare(String(bVal)) * modifier
      })
    : filteredData

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  const handleFilterChange = (columnKey: string, value: string, checked: boolean) => {
    setColumnFilters((prev) => {
      const currentFilters = prev[columnKey] || []
      if (checked) {
        return {
          ...prev,
          [columnKey]: [...currentFilters, value],
        }
      } else {
        return {
          ...prev,
          [columnKey]: currentFilters.filter((v) => v !== value),
        }
      }
    })
  }

  const clearAllFilters = () => {
    setColumnFilters({})
    setSearchTerm("")
  }

  const hasActiveFilters = Object.values(columnFilters).some((filters) => filters.length > 0) || searchTerm.length > 0

  if (loading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`glass-card ${className}`}>
      {searchable && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            )}
            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {columns
                .filter((col) => visibleColumns.includes(col.key))
                .map((column) => {
                  const hasFilter = column.filterable !== false
                  const activeFilters = columnFilters[column.key] || []
                  const uniqueValues = hasFilter ? getUniqueValues(column.key) : []

                  return (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      <div className="flex items-center gap-1">
                        {hasFilter ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${
                                  activeFilters.length > 0 ? "text-blue-500" : ""
                                }`}
                              >
                                <span>{column.label}</span>
                                {column.sortable && sortColumn === column.key && (
                                  <span className="text-blue-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0" align="start">
                              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium text-sm">Filter {column.label}</h4>
                                {activeFilters.length > 0 && (
                                  <p className="text-xs text-gray-500 mt-1">{activeFilters.length} selected</p>
                                )}
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {uniqueValues.map((value) => (
                                  <div
                                    key={value}
                                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  >
                                    <Checkbox
                                      id={`${column.key}-${value}`}
                                      checked={activeFilters.includes(value)}
                                      onCheckedChange={(checked) =>
                                        handleFilterChange(column.key, value, checked as boolean)
                                      }
                                    />
                                    <label
                                      htmlFor={`${column.key}-${value}`}
                                      className="text-sm cursor-pointer flex-1 truncate"
                                      title={value}
                                    >
                                      {value}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              {activeFilters.length > 0 && (
                                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setColumnFilters((prev) => ({ ...prev, [column.key]: [] }))}
                                    className="w-full"
                                  >
                                    Clear Filter
                                  </Button>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>{column.label}</span>
                            {column.sortable && (
                              <button
                                onClick={() => handleSort(column.key)}
                                className="hover:text-blue-500 transition-colors"
                              >
                                {sortColumn === column.key && (
                                  <span className="text-blue-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  )
                })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {columns
                  .filter((col) => visibleColumns.includes(col.key))
                  .map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          {hasActiveFilters ? "No data matches the current filters" : "No data found"}
        </div>
      )}

      {hasActiveFilters && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Showing {sortedData.length} of {data.length} records
            </span>
            <div className="flex items-center gap-2">
              {Object.entries(columnFilters).map(([columnKey, filters]) => {
                if (filters.length === 0) return null
                const column = columns.find((col) => col.key === columnKey)
                return (
                  <span
                    key={columnKey}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    {column?.label}: {filters.length}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
