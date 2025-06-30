"use client"

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline"
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid"
import type { Integration } from "@/types"

interface IntegrationCardProps {
  integration?: Integration
  isAddButton?: boolean
  onAddClick?: () => void
  className?: string
}

export default function IntegrationCard({
  integration,
  isAddButton = false,
  onAddClick,
  className = "",
}: IntegrationCardProps) {
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

  const getStatusIcon = () => {
    switch (integration.status) {
      case "connected":
        return <CheckCircleIconSolid className="h-5 w-5 text-green-500" />
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case "disconnected":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (integration.status) {
      case "connected":
        return "Connected"
      case "warning":
        return "Warning"
      case "disconnected":
        return "Disconnected"
      default:
        return "Unknown"
    }
  }

  const getStatusColor = () => {
    switch (integration.status) {
      case "connected":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "disconnected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className={`glass-card p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-base mb-1">{integration.name}</h4>
            {integration.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{integration.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>{getStatusText()}</span>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <ArrowPathIcon className="h-4 w-4 text-gray-500" />
          </button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
