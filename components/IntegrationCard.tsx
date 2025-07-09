"use client"

import { ArrowPathIcon, PlusIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline"
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon,
  PlayIcon,
  CogIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid"
import { memo, useState } from "react"
import type { Integration } from "@/types"

interface IntegrationCardProps {
  integration?: Integration
  isAddButton?: boolean
  onAddClick?: () => void
  onRunTool?: (integration: Integration) => void
  onDisconnect?: (integration: Integration) => void
  onReconfigure?: (integration: Integration) => void
  className?: string
}

function IntegrationCard({
  integration,
  isAddButton = false,
  onAddClick,
  onRunTool,
  onDisconnect,
  onReconfigure,
  className = "",
}: IntegrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (isAddButton) {
    return (
      <button
        onClick={onAddClick}
        className={`glass-card p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col items-center justify-center min-h-[120px] group ${className}`}
      >
        <PlusIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2" />
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
          Add Tool
        </span>
      </button>
    )
  }

  if (!integration) return null

  // Use "is-connected" property
  const isConnected = integration["is-connected"] === true

  const getStatusIcon = () => {
    if (isConnected) {
      return <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
    } else {
      // For disconnected tools, we'll use a warning icon as per the screenshot's "Warning" status
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusText = () => (isConnected ? "Connected" : "Disconnected")

  const getStatusColor = () =>
    isConnected
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" // Using yellow for "Disconnected" to match "Warning" in screenshot

  const handleRunTool = () => {
    if (onRunTool && integration.endpoint) {
      onRunTool(integration)
    }
  }

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect(integration)
    }
  }

  const handleReconfigure = () => {
    if (onReconfigure) {
      onReconfigure(integration)
    }
  }

  return (
    <div className={`glass-card hover:shadow-lg transition-all duration-200 ${className}`}>
      {/* Main card content */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{integration.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {integration.description || `${integration.category} integration`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>{getStatusText()}</span>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
              <ArrowPathIcon className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded content with action buttons */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRunTool}
              disabled={!integration.endpoint}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                integration.endpoint
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              <PlayIcon className="h-4 w-4" />
              Run Tool
            </button>

            <button
              onClick={handleReconfigure}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CogIcon className="h-4 w-4" />
              Re-configure
            </button>

            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Disconnect
            </button>
          </div>

          {integration.endpoint && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Endpoint:</span> {integration.endpoint}
            </div>
          )}

          {integration.last_sync && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Last Sync:</span> {new Date(integration.last_sync).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(IntegrationCard)
