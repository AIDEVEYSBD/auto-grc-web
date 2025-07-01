"use client"

import type React from "react"

import { useState } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid"
import LoadingSkeleton from "@/components/LoadingSkeleton"
import DataTable from "@/components/DataTable"
import ProgressBar from "@/components/ProgressBar"

interface ComplianceData {
  sys_id: string
  compliance_percentages: Record<string, string>
}

interface CmdbRecord {
  [key: string]: any
}

interface CmdbData {
  sys_id: string
  records: CmdbRecord[]
}

export default function ControlsAutomationPage() {
  const [appName, setAppName] = useState("")
  const [searchedAppName, setSearchedAppName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [cmdbData, setCmdbData] = useState<CmdbData | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appName) return

    setLoading(true)
    setError(null)
    setComplianceData(null)
    setCmdbData(null)
    setSearchedAppName(appName)

    try {
      const [complianceRes, cmdbRes] = await Promise.all([
        fetch(`/api/controls-automation/compliance-percentages?appName=${appName}`),
        fetch(`/api/controls-automation/cmdb-records?appName=${appName}`),
      ])

      if (!complianceRes.ok || !cmdbRes.ok) {
        const complianceError = !complianceRes.ok ? await complianceRes.json() : null
        const cmdbError = !cmdbRes.ok ? await cmdbRes.json() : null
        throw new Error(complianceError?.detail || cmdbError?.detail || "Failed to fetch data")
      }

      const complianceData = await complianceRes.json()
      const cmdbData = await cmdbRes.json()

      setComplianceData(complianceData)
      setCmdbData(cmdbData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cmdbColumns = cmdbData?.records?.[0]
    ? Object.keys(cmdbData.records[0]).map((key) => ({
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        sortable: true,
      }))
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controls Automation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Automatically assess controls of the Master Framework for applications.
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter Application Name (e.g., WebApp1, MobileApp, DataPlatform)"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {loading && (
        <div className="space-y-6">
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-64" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {complianceData && cmdbData && (
        <div className="space-y-8">
          <div className="glass-card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold">Compliance Overview for {searchedAppName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">sys_id: {complianceData.sys_id}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {Object.entries(complianceData.compliance_percentages).map(([control, value]) => {
                const percentage = Number.parseFloat(String(value).replace("%", ""))
                return (
                  <div
                    key={control}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">{control}</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 my-2">{value}</p>
                    <ProgressBar progress={percentage} />
                  </div>
                )
              })}
            </div>
          </div>

          <DataTable columns={cmdbColumns} data={cmdbData.records} searchable className="glass-card" />
        </div>
      )}
    </div>
  )
}
