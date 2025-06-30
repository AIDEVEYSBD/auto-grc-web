"use client"

import type React from "react"

import { useState, useMemo, useCallback } from "react"
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import {
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CircleStackIcon,
} from "@heroicons/react/24/solid"
import KpiTile from "@/components/KpiTile"
import IntegrationCard from "@/components/IntegrationCard"
import MarketplaceModal from "@/components/MarketplaceModal"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useIntegrations, useIntegrationKPIs, useIntegrationsByCategory } from "@/lib/queries/integrations"
import type { KPIData } from "@/types"

type FilterType = "all" | "connected" | "disconnected"

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)

  const { data: integrations, isLoading } = useIntegrations()
  const kpis = useIntegrationKPIs(integrations)
  const integrationsByCategory = useIntegrationsByCategory(integrations)

  const kpiData: KPIData[] = useMemo(
    () => [
      {
        label: "Tool Categories",
        value: kpis.categories,
        icon: WrenchScrewdriverIcon,
        color: "blue",
      },
      {
        label: "Connected Tools",
        value: kpis.connected,
        icon: CheckCircleIcon,
        color: "green",
      },
      {
        label: "Need Attention",
        value: kpis.needAttention,
        icon: ExclamationTriangleIcon,
        color: "yellow",
      },
      {
        label: "Data Points",
        value: kpis.totalDatapoints.toLocaleString(),
        icon: CircleStackIcon,
        color: "purple",
      },
    ],
    [kpis],
  )

  const filteredIntegrationsByCategory = useMemo(() => {
    const filtered: Record<string, any[]> = {}

    Object.entries(integrationsByCategory).forEach(([category, categoryIntegrations]) => {
      let filteredIntegrations = categoryIntegrations

      // Apply search filter
      if (searchQuery) {
        filteredIntegrations = filteredIntegrations.filter(
          (integration) =>
            integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            integration.category.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      }

      // Apply status filter
      if (activeFilter === "connected") {
        filteredIntegrations = filteredIntegrations.filter((integration) => integration.is_connected === true)
      } else if (activeFilter === "disconnected") {
        filteredIntegrations = filteredIntegrations.filter((integration) => integration.is_connected === false)
      }

      if (filteredIntegrations.length > 0) {
        filtered[category] = filteredIntegrations
      }
    })

    return filtered
  }, [integrationsByCategory, searchQuery, activeFilter])

  const filterButtons = useMemo(
    () => [
      { key: "all" as FilterType, label: "All", count: integrations?.length || 0 },
      { key: "connected" as FilterType, label: "Connected", count: kpis.connected },
      { key: "disconnected" as FilterType, label: "Disconnected", count: kpis.needAttention },
    ],
    [integrations, kpis.connected, kpis.needAttention],
  )

  const handleOpenMarketplace = useCallback(() => {
    setIsMarketplaceOpen(true)
  }, [])

  const handleCloseMarketplace = useCallback(() => {
    setIsMarketplaceOpen(false)
  }, [])

  const handleFilterChange = useCallback((filter: FilterType) => {
    setActiveFilter(filter)
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Integrations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Connect and manage your cybersecurity tools across all categories
          </p>
        </div>
        <button
          onClick={handleOpenMarketplace}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-lg"
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories or tools..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          {filterButtons.map((filter) => (
            <button
              key={filter.key}
              onClick={() => handleFilterChange(filter.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeFilter === filter.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {filter.label}
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  activeFilter === filter.key
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Integration Categories */}
      <div className="space-y-8">
        {Object.entries(filteredIntegrationsByCategory).map(([category, categoryIntegrations]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
              {category}
            </h2>
            <div className="space-y-4">
              {categoryIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
              <IntegrationCard isAddButton onAddClick={handleOpenMarketplace} />
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="fixed bottom-4 left-4 flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Status</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">All systems operational</span>
      </div>

      {/* Marketplace Modal */}
      <MarketplaceModal isOpen={isMarketplaceOpen} onClose={handleCloseMarketplace} integrations={integrations} />
    </div>
  )
}
