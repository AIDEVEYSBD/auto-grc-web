"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { createTableWithData } from "@/app/actions/create-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table } from "lucide-react"
import { CheckIcon } from "@heroicons/react/24/outline"

interface QualysSSLResultsModalProps {
  isOpen: boolean
  onClose: () => void
  results: any[]
  isProcessing?: boolean
}

interface ColumnConfig {
  key: string
  label: string
  type: string
  selected: boolean
  sampleValue: any
}

export default function QualysSSLResultsModal({
  isOpen,
  onClose,
  results,
  isProcessing = false,
}: QualysSSLResultsModalProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>([])
  const [tableName, setTableName] = useState("qualys_ssl_results")
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (results && results.length > 0) {
      // Analyze the structure of the results to create column configurations
      const sampleResult = results[0]
      const detectedColumns: ColumnConfig[] = []

      const analyzeObject = (obj: any, prefix = "") => {
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key
          const value = obj[key]

          if (value !== null && value !== undefined) {
            if (typeof value === "object" && !Array.isArray(value)) {
              // Nested object - flatten it
              analyzeObject(value, fullKey)
            } else if (!Array.isArray(value)) {
              // Simple value
              detectedColumns.push({
                key: fullKey,
                label: fullKey.replace(/[._]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                type: typeof value,
                selected: true, // Default to selected
                sampleValue: value,
              })
            }
          }
        })
      }

      analyzeObject(sampleResult)
      setColumns(detectedColumns)
      setError(null)
      setSuccess(null)
    }
  }, [results])

  const toggleColumn = (key: string) => {
    setColumns((prev) => prev.map((col) => (col.key === key ? { ...col, selected: !col.selected } : col)))
  }

  const selectAll = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, selected: true })))
  }

  const deselectAll = () => {
    setColumns((prev) => prev.map((col) => ({ ...col, selected: false })))
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  const handleCreateTable = async () => {
    const selectedColumns = columns.filter((col) => col.selected)

    if (selectedColumns.length === 0) {
      setError("Please select at least one column to include in the table.")
      return
    }

    if (!tableName.trim()) {
      setError("Please enter a table name.")
      return
    }

    setIsCreatingTable(true)
    setError(null)
    setSuccess(null)

    try {
      // Transform the results to include only selected columns
      const transformedData = results.map((result) => {
        const transformedRow: any = {}
        selectedColumns.forEach((col) => {
          const value = getNestedValue(result, col.key)
          // Clean up the column name for database storage
          const cleanKey = col.key.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
          transformedRow[cleanKey] = value
        })
        return transformedRow
      })

      console.log("Creating table with data:", {
        tableName,
        columnCount: selectedColumns.length,
        rowCount: transformedData.length,
        sampleRow: transformedData[0],
      })

      const result = await createTableWithData(tableName, transformedData)

      if (result.success) {
        setSuccess(
          `Successfully created table "${result.tableName}" with ${result.recordCount} rows${
            result.fallback ? " (stored in automation_results)" : ""
          }`,
        )
      } else {
        setError(result.error || "Failed to create table")
      }
    } catch (error) {
      console.error("Error creating table:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsCreatingTable(false)
    }
  }

  const handleClose = () => {
    setError(null)
    setSuccess(null)
    onClose()
  }

  if (!results || results.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Table className="h-6 w-6 text-blue-600" />
            <DialogTitle>Qualys SSL Labs Results</DialogTitle>
          </div>
        </DialogHeader>

        {/* Results Summary */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Found {results.length} result{results.length !== 1 ? "s" : ""} with {columns.length} available columns.
            Select the columns you want to keep and create a table in your database.
          </p>
        </div>

        {/* Table Name Input */}
        <div className="mb-6">
          <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Table Name
          </label>
          <Input
            id="tableName"
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Enter table name..."
            className="max-w-md"
            disabled={isCreatingTable}
          />
        </div>

        {/* Column Selection Controls */}
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Columns ({columns.filter((c) => c.selected).length} of {columns.length} selected)
          </h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} disabled={isCreatingTable}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll} disabled={isCreatingTable}>
              Deselect All
            </Button>
          </div>
        </div>

        {/* Column Selection Table */}
        <ScrollArea className="border border-gray-200 dark:border-gray-700 rounded-lg mb-6 max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Include
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Column Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sample Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {columns.map((column) => (
                <tr key={column.key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={column.selected}
                      onCheckedChange={() => toggleColumn(column.key)}
                      disabled={isCreatingTable}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{column.label}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {column.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {typeof column.sampleValue === "object"
                      ? JSON.stringify(column.sampleValue)
                      : String(column.sampleValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <DialogFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isCreatingTable}>
            {success ? "Close" : "Cancel"}
          </Button>
          {!success && (
            <Button
              onClick={handleCreateTable}
              disabled={isCreatingTable || columns.filter((c) => c.selected).length === 0}
            >
              {isCreatingTable ? "Creating Table..." : "Create Table"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
