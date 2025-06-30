"use client"

import { useState } from "react"
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline"
import FrameworkCard from "@/components/FrameworkCard"
import MappingTable from "@/components/MappingTable"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useFrameworks, useFrameworkControls } from "@/lib/queries/frameworks"
import { useFrameworkMappings } from "@/lib/queries/mappings"

export default function FrameworksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null)

  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()
  const { data: mappings, isLoading: mappingsLoading } = useFrameworkMappings()
  const { data: controls } = useFrameworkControls(selectedFramework || undefined)

  // Mock framework data with scores
  const frameworksWithScores =
    frameworks?.map((framework) => ({
      ...framework,
      implemented: Math.floor(Math.random() * 80) + 20,
      total: 100,
      score: Math.floor(Math.random() * 40) + 60,
      delta: Math.floor(Math.random() * 10) - 5,
    })) || []

  const filteredFrameworks = frameworksWithScores.filter((framework) =>
    framework.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Group controls by domain for the matrix view
  const controlsByDomain =
    controls?.reduce(
      (acc, control) => {
        if (!acc[control.Domain]) {
          acc[control.Domain] = []
        }
        acc[control.Domain].push(control)
        return acc
      },
      {} as Record<string, typeof controls>,
    ) || {}

  if (frameworksLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Frameworks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and monitor your compliance frameworks</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search frameworks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FunnelIcon className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Framework Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFrameworks.map((framework) => (
          <FrameworkCard
            key={framework.id}
            framework={framework}
            className="cursor-pointer"
            onClick={() => setSelectedFramework(framework.id)}
          />
        ))}
      </div>

      {/* Additional Framework Controls Matrix */}
      {selectedFramework && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Framework Controls</h3>
          <div className="space-y-4">
            {Object.entries(controlsByDomain).map(([domain, domainControls]) => (
              <div key={domain} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{domain}</h4>
                <div className="flex flex-wrap gap-2">
                  {domainControls?.map((control) => (
                    <span
                      key={control.id}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                    >
                      {control.ID}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Framework Mappings */}
      <MappingTable mappings={mappings || []} className="mt-6" />
    </div>
  )
}
