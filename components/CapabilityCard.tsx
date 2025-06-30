"use client"

import { useState } from "react"
import { Switch } from "@headlessui/react"
import { PlayIcon, EyeIcon } from "@heroicons/react/24/outline"
import type { Capability } from "@/types"

interface CapabilityCardProps {
  capability: Capability
  onToggle?: (id: string, enabled: boolean) => void
  className?: string
}

export default function CapabilityCard({ capability, onToggle, className = "" }: CapabilityCardProps) {
  const [enabled, setEnabled] = useState(capability.is_enabled)

  const handleToggle = (newEnabled: boolean) => {
    setEnabled(newEnabled)
    onToggle?.(capability.id, newEnabled)
  }

  return (
    <div className={`glass-card p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{capability.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{capability.description}</p>
        </div>

        <Switch
          checked={enabled}
          onChange={handleToggle}
          className={`${
            enabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          <span
            className={`${
              enabled ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>

      <div className="flex items-center gap-2">
        {enabled ? (
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <PlayIcon className="h-4 w-4" />
            Launch
          </button>
        ) : (
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <EyeIcon className="h-4 w-4" />
            View Details
          </button>
        )}

        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            enabled
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          {enabled ? "Active" : "Available"}
        </span>
      </div>
    </div>
  )
}
