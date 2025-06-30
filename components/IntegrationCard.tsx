"use client"

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid"
import { useState, useEffect, useCallback } from "react"
import type { Integration } from "@/types"
import QualysDataSelectionModal from "./QualysDataSelectionModal"

interface IntegrationCardProps {
  integration: Integration
  className?: string
  onUpdateIntegration: (integration: Integration) => void
}

export default function IntegrationCard({ integration, className = "", onUpdateIntegration }: IntegrationCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [pollingMessage, setPollingMessage] = useState(integration.data?.statusMessage || "Scan initiated...")
  const [isDataSelectionOpen, setIsDataSelectionOpen] = useState(false)
  const [finalScanData, setFinalScanData] = useState(null)

  const pollScanStatus = useCallback(async () => {
    const { host, email } = integration.data
    if (!host || !email) return

    try {
      const params = new URLSearchParams({ host, email })
      const response = await fetch(`/api/qualys?${params}`)
      const result = await response.json()

      if (result.status === "READY") {
        setFinalScanData(result)
        setIsDataSelectionOpen(true)
      } else if (result.status === "ERROR") {
        onUpdateIntegration({
          ...integration,
          status: "disconnected",
          data: { ...integration.data, error: result.statusMessage },
        })
      } else {
        setPollingMessage(result.statusMessage || `Status: ${result.status}`)
      }
    } catch (error) {
      console.error("Polling failed:", error)
      onUpdateIntegration({
        ...integration,
        status: "disconnected",
        data: { ...integration.data, error: "Polling failed. Check console for details." },
      })
    }
  }, [integration, onUpdateIntegration])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (integration.status === "pending" && integration.category === "SSL/TLS Analysis") {
      let pollCount = 0
      intervalId = setInterval(() => {
        pollScanStatus()
        pollCount++
        // Optional: could stop polling after a certain time
        if (pollCount > 30) {
          // ~5 minutes
          if (intervalId) clearInterval(intervalId)
          onUpdateIntegration({
            ...integration,
            status: "warning",
            data: { ...integration.data, error: "Scan timed out." },
          })
        }
      }, 10000) // Poll every 10 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [integration.status, integration.category, pollScanStatus, integration, onUpdateIntegration])

  const filterDataByFields = (data: any, selectedFields: string[]) => {
    const filtered: any = {}
    selectedFields.forEach((fieldPath) => {
      const parts = fieldPath.split(".")
      let sourceValue = data
      let targetObj = filtered
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (sourceValue && typeof sourceValue === "object" && part in sourceValue) {
          if (i === parts.length - 1) {
            targetObj[part] = sourceValue[part]
          } else {
            if (!targetObj[part]) {
              targetObj[part] = {}
            }
            targetObj = targetObj[part]
            sourceValue = sourceValue[part]
          }
        } else {
          break
        }
      }
    })
    return filtered
  }

  const handleDataSelectionSave = (selectedFields: string[]) => {
    if (!finalScanData) return

    const filteredData = filterDataByFields(finalScanData, selectedFields)

    const updatedIntegration: Integration = {
      ...integration,
      status: "connected",
      last_sync: new Date().toISOString(),
      datapoints: selectedFields.length,
      data: filteredData,
      selectedFields: selectedFields,
    }

    onUpdateIntegration(updatedIntegration)
    setIsDataSelectionOpen(false)
  }

  const getStatusIcon = () => {
    switch (integration.status) {
      case "connected":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case "disconnected":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case "pending":
        return <ArrowPathIcon className="h-5 w-5 text-cyan-500 animate-spin" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = () => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (integration.status) {
      case "connected":
        return `${baseClasses} status-connected`
      case "warning":
        return `${baseClasses} status-warning`
      case "disconnected":
        return `${baseClasses} status-disconnected`
      case "pending":
        return `${baseClasses} bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`
    }
  }

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const renderDataValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === "object") return JSON.stringify(value, null, 2)
    return String(value)
  }

  const renderSelectedData = () => {
    if (!integration.data || !integration.selectedFields || integration.selectedFields.length === 0) return null

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Integration Data</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {integration.selectedFields.map((fieldPath) => {
            const parts = fieldPath.split(".")
            let value = integration.data

            for (const part of parts) {
              if (value && typeof value === "object" && part in value) {
                value = value[part]
              } else {
                value = "N/A"
                break
              }
            }

            return (
              <div key={fieldPath} className="flex justify-between items-start gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">{fieldPath}:</span>
                <pre className="text-xs text-gray-900 dark:text-white text-right break-all whitespace-pre-wrap">
                  {renderDataValue(value)}
                </pre>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (integration.status === "pending") {
    return (
      <div className={`glass-card p-4 flex flex-col justify-between hover:shadow-lg transition-shadow ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{integration.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{integration.category}</p>
            </div>
          </div>
          <span className={getStatusBadge()}>{integration.status}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Status: {pollingMessage}</p>
          <p className="text-xs mt-1">This may take several minutes. We're polling for results.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`glass-card p-4 hover:shadow-lg transition-shadow ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{integration.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{integration.category}</p>
            </div>
          </div>
          <span className={getStatusBadge()}>{integration.status}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>Last sync: {formatLastSync(integration.last_sync)}</span>
          <span>{integration.datapoints.toLocaleString()} datapoints</span>
        </div>

        {integration.data?.error && (
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">Error: {integration.data.error}</p>
        )}

        {integration.data && (integration.selectedFields?.length ?? 0) > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            {showDetails ? "Hide Details" : "View Details"}
          </button>
        )}

        {showDetails && renderSelectedData()}
      </div>
      <QualysDataSelectionModal
        isOpen={isDataSelectionOpen}
        onClose={() => setIsDataSelectionOpen(false)}
        data={finalScanData}
        onSave={handleDataSelectionSave}
      />
    </>
  )
}
