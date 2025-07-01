"use client"

import type React from "react"
import { useState } from "react"
import { MagnifyingGlassIcon, PlayIcon, EyeIcon } from "@heroicons/react/24/outline"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid"
import LoadingSkeleton from "@/components/LoadingSkeleton"
import DataTable from "@/components/DataTable"
import ProgressBar from "@/components/ProgressBar"
import { toast } from "sonner"
import ControlDetailModal from "@/components/ControlDetailModal"

interface ComplianceData {
  sys_id: string
  compliance_percentages: Record<string, number>
}

interface CmdbRecord {
  [key: string]: any
}

interface CmdbData {
  sys_id: string
  records: CmdbRecord[]
}

interface AverageComplianceData {
  average_compliance: Record<string, number>
}

interface ControlDetailRecord {
  [key: string]: any
}

export default function ControlsAutomationPage() {
  // State for single application search
  const [appName, setAppName] = useState("")
  const [searchedAppName, setSearchedAppName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [cmdbData, setCmdbData] = useState<CmdbData | null>(null)

  // State for average compliance
  const [avgAppNames, setAvgAppNames] = useState("")
  const [avgLoading, setAvgLoading] = useState(false)
  const [avgError, setAvgError] = useState<string | null>(null)
  const [avgData, setAvgData] = useState<AverageComplianceData | null>(null)

  // State for control detail modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalData, setModalData] = useState<ControlDetailRecord[]>([])
  const [modalLoading, setModalLoading] = useState(false)

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

  const handleAverageSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avgAppNames) return

    setAvgLoading(true)
    setAvgError(null)
    setAvgData(null)

    try {
      const res = await fetch(`/api/controls-automation/average-compliance?app_names=${avgAppNames}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.detail || "Failed to fetch average compliance")
      }
      const data = await res.json()
      setAvgData(data)
    } catch (err: any) {
      setAvgError(err.message)
    } finally {
      setAvgLoading(false)
    }
  }

  const handleRunCalculation = async (controlId: string) => {
    const promise = fetch("/api/controls-automation/run-control-calculation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_name: searchedAppName, control_id: controlId }),
    })

    toast.promise(promise, {
      loading: `Running calculation for ${controlId}...`,
      success: (res) => {
        if (!res.ok) throw new Error("Calculation failed.")
        return `${controlId} calculation successful!`
      },
      error: `Failed to run calculation for ${controlId}.`,
    })
  }

  const handleViewDetails = async (controlId: string) => {
    if (!complianceData) return
    setModalTitle(`Details for ${controlId}`)
    setIsModalOpen(true)
    setModalLoading(true)

    try {
      const res = await fetch(
        `/api/controls-automation/get-records?table=${controlId}&sys_id=${complianceData.sys_id}&columns=all`,
      )
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.detail || "Failed to fetch details")
      }
      const data = await res.json()
      setModalData(data.records)
    } catch (err: any) {
      toast.error(err.message)
      setIsModalOpen(false)
    } finally {
      setModalLoading(false)
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
      <ControlDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
      />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controls Automation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Automatically assess controls, view compliance, and run calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single App Search */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Application Compliance</h2>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter Application Name (e.g., WebApp1)"
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

        {/* Average Compliance Search */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Average Compliance</h2>
          <form onSubmit={handleAverageSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Comma-separated names (e.g., WebApp1,MobileApp)"
                value={avgAppNames}
                onChange={(e) => setAvgAppNames(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={avgLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
            >
              {avgLoading ? "Calculating..." : "Calculate"}
            </button>
          </form>
        </div>
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

      {/* Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Single App Results */}
        <div className="space-y-8">
          {complianceData && cmdbData && (
            <>
              <div className="glass-card">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">Compliance Overview for {searchedAppName}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">sys_id: {complianceData.sys_id}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  {Object.entries(complianceData.compliance_percentages).map(([control, value]) => (
                    <div
                      key={control}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 space-y-3"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white">{control}</h3>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}%</p>
                      <ProgressBar progress={value} />
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleRunCalculation(control)}
                          className="flex-1 text-xs inline-flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900"
                        >
                          <PlayIcon className="h-3 w-3" />
                          Run Calc
                        </button>
                        <button
                          onClick={() => handleViewDetails(control)}
                          className="flex-1 text-xs inline-flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                        >
                          <EyeIcon className="h-3 w-3" />
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DataTable columns={cmdbColumns} data={cmdbData.records} searchable className="glass-card" />
            </>
          )}
        </div>

        {/* Average Compliance Results */}
        <div className="space-y-8">
          {avgLoading && <LoadingSkeleton className="h-48" />}
          {avgError && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{avgError}</AlertDescription>
            </Alert>
          )}
          {avgData && (
            <div className="glass-card">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Average Compliance</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Across {avgAppNames}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {Object.entries(avgData.average_compliance).map(([control, value]) => (
                  <div
                    key={control}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 space-y-3"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">{control}</h3>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value.toFixed(1)}%</p>
                    <ProgressBar progress={value} barColor="bg-purple-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
