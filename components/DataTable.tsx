"use client"

import type React from "react"

import { useState } from "react"
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline"
import LoadingSkeleton from "./LoadingSkeleton"

interface Column {
  key: string
  label: string
  sortable?: boolean
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

  const filteredData = data.filter((row) =>
    Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
  )

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
          <div className="flex gap-4">
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
                .map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      column.sortable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : ""
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-blue-500">{sortDirection === "asc" ? "↑" : "↓"}</span>
                      )}
                    </div>
                  </th>
                ))}
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

      {sortedData.length === 0 && <div className="p-8 text-center text-gray-500 dark:text-gray-400">No data found</div>}
    </div>
  )
}
