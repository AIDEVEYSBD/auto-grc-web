import DonutChart from "./DonutChart"
import ProgressBar from "./ProgressBar"
import type { Framework } from "@/types"

interface FrameworkCardProps {
  framework: Framework & {
    controlCount?: number
    passedCount?: number
  }
  className?: string
}

export default function FrameworkCard({ framework, className = "" }: FrameworkCardProps) {
  const total = framework.controlCount || 0
  const passed = framework.passedCount || 0
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0

  return (
    <div className={`glass-card p-6 hover:shadow-xl transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{framework.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {framework.version ? `Version ${framework.version}` : "No version"}
          </p>
        </div>
        <DonutChart
          data={{
            name: framework.name,
            value: passed,
            total: total || 1,
          }}
          size={60}
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {passed} of {total} controls
          </span>
          <span className="font-medium">{total > 0 ? `${percentage}%` : "-"}</span>
        </div>

        <ProgressBar value={percentage} />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
              {framework.master ? "Master" : "Active"}
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
              {total} controls
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
