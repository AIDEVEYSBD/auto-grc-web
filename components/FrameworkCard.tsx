"use client"

import { StarIcon } from "@heroicons/react/24/solid"
import ProgressBar from "./ProgressBar"
import type { Framework } from "@/types"

interface FrameworkCardProps {
  framework: Framework & {
    controlCount?: number
    overlap?: {
      mapped: number
      percentage: number
    }
  }
  onSetMaster: (id: string) => void
  className?: string
}

export default function FrameworkCard({ framework, onSetMaster, className = "" }: FrameworkCardProps) {
  const total = framework.controlCount || 0
  const overlap = framework.overlap

  return (
    <div
      className={`glass-card p-6 hover:shadow-xl transition-shadow relative overflow-hidden ${
        framework.master ? "border-blue-500/50" : ""
      } ${className}`}
    >
      {framework.master && (
        <div className="absolute top-0 right-0 px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-bl-lg">
          MASTER
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{framework.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {framework.version ? `Version ${framework.version}` : "No version"}
          </p>
        </div>
        {!framework.master && overlap && (
          <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{overlap.percentage}%</span>
        )}
      </div>

      <div className="space-y-3">
        {framework.master ? (
          <div className="text-center py-4 h-24 flex flex-col justify-center">
            <p className="text-5xl font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Controls</p>
          </div>
        ) : (
          <div className="h-24 flex flex-col justify-center">
            {overlap && (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {overlap.mapped} of {total} controls mapped
                  </span>
                  <span className="font-medium">{overlap.percentage}%</span>
                </div>
                <ProgressBar value={overlap.percentage} />
              </>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700/50">
          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
            {total} controls
          </span>
          {!framework.master && (
            <button
              onClick={() => onSetMaster(framework.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-slate-800/50 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <StarIcon className="h-3 w-3" />
              Set Master
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
