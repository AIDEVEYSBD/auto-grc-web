"use client"

import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ClockIcon, EyeIcon } from "@heroicons/react/24/solid"
import { useState } from "react"
import type { Integration } from "@/types"

interface IntegrationCardProps {
  integration: Integration
  className?: string
}

export default function IntegrationCard({ integration, className = "" }: IntegrationCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusIcon = () => {
    switch (integration.status) {
      case "connected":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case "disconnected":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
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
    if (!integration.data || !integration.selectedFields) return null

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Integration Data</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {integration.selectedFields.map((fieldPath) => {
            const parts = fieldPath.split(".")
            let value = integration.data

            // Navigate to the value
            for (const part of parts) {
              if (value && typeof value === "object") {
                value = value[part]
              } else {
                value = "N/A"
                break
              }
            }

            return (
              <div key={fieldPath} className="flex justify-between items-start gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">{fieldPath}:</span>
                <span className="text-xs text-gray-900 dark:text-white text-right break-all">
                  {renderDataValue(value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
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

      {/* Show details button for integrations with data */}
      {integration.data && integration.selectedFields && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <EyeIcon className="h-4 w-4" />
          {showDetails ? "Hide Details" : "View Details"}
        </button>
      )}

      {/* Render selected data if details are shown */}
      {showDetails && renderSelectedData()}
    </div>
  )
}
