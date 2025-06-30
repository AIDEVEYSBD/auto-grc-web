import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ClockIcon } from "@heroicons/react/24/solid"
import type { Integration } from "@/types"

interface IntegrationCardProps {
  integration: Integration
  className?: string
}

export default function IntegrationCard({ integration, className = "" }: IntegrationCardProps) {
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

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Last sync: {formatLastSync(integration.last_sync)}</span>
        <span>{integration.datapoints.toLocaleString()} datapoints</span>
      </div>
    </div>
  )
}
