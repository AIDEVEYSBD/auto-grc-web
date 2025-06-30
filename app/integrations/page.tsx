"use client"

import { useState, useCallback, useMemo } from "react"
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline"
import KpiTile from "@/components/KpiTile"
import IntegrationCard from "@/components/IntegrationCard"
import MarketplaceModal from "@/components/MarketplaceModal"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useIntegrations } from "@/lib/queries/integrations"
import type { KPIData, Integration } from "@/types"

export default function IntegrationsPage() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Cloud Security"])
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const [customIntegrations, setCustomIntegrations] = useState<Integration[]>([])

  const { data: integrations, isLoading } = useIntegrations()

  // Combine original integrations with custom ones
  const allIntegrations = useMemo(() => {
    return [...(integrations || []), ...customIntegrations]
  }, [integrations, customIntegrations])

  // Calculate KPIs with combined data
  const kpis = useMemo(() => {
    const categories = new Set(allIntegrations?.map((i) => i.category)).size || 0
    const connected = allIntegrations?.filter((i) => i.status === "connected").length || 0
    const needAttention = allIntegrations?.filter((i) => i.status !== "connected").length || 0
    const totalDatapoints = allIntegrations?.reduce((sum, i) => sum + i.datapoints, 0) || 0

    return {
      categories,
      connected,
      needAttention,
      totalDatapoints,
    }
  }, [allIntegrations])

  // Group integrations by category
  const integrationsByCategory = useMemo(() => {
    const grouped =
      allIntegrations?.reduce(
        (acc, integration) => {
          if (!acc[integration.category]) {
            acc[integration.category] = []
          }
          acc[integration.category].push(integration)
          return acc
        },
        {} as Record<string, Integration[]>,
      ) || {}

    return grouped
  }, [allIntegrations])

  const kpiData: KPIData[] = useMemo(
    () => [
      {
        label: "Categories",
        value: kpis.categories,
        delta: 1,
        trend: "up",
      },
      {
        label: "Connected",
        value: kpis.connected,
        delta: 3,
        trend: "up",
      },
      {
        label: "Need Attention",
        value: kpis.needAttention,
        delta: -2,
        trend: "down",
      },
      {
        label: "Total Datapoints",
        value: kpis.totalDatapoints.toLocaleString(),
        delta: 15,
        trend: "up",
      },
    ],
    [kpis],
  )

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }, [])

  const handleIntegrationAdded = useCallback((newIntegration: Integration) => {
    setCustomIntegrations((prev) => [...prev, newIntegration])
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your security tool integrations</p>
        </div>
        <button
          onClick={() => setIsMarketplaceOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Browse Marketplace
        </button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KpiTile key={index} data={kpi} />
        ))}
      </div>

      {/* Integration Categories */}
      <div className="space-y-4">
        {Object.entries(integrationsByCategory).map(([category, categoryIntegrations]) => (
          <div key={category} className="glass-card">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {expandedCategories.includes(category) ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category}</h3>
                </div>
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                  {categoryIntegrations.length}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {categoryIntegrations.filter((i) => i.status === "connected").length} connected
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  {categoryIntegrations.filter((i) => i.status === "warning").length} warning
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  {categoryIntegrations.filter((i) => i.status === "disconnected").length} disconnected
                </div>
              </div>
            </button>

            {expandedCategories.includes(category) && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {categoryIntegrations.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Marketplace Modal */}
      <MarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        onIntegrationAdded={handleIntegrationAdded}
      />
    </div>
  )
}
