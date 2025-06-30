"use client"

import { useState, useMemo, useCallback } from "react"
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline"
import {
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CircleStackIcon,
} from "@heroicons/react/24/solid"
import KpiTile from "@/components/KpiTile"
import IntegrationCard from "@/components/IntegrationCard"
import MarketplaceModal from "@/components/MarketplaceModal"
import RegistrationModal from "@/components/RegistrationModal"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useIntegrations, useIntegrationKPIs } from "@/lib/queries/integrations"
import type { KPIData, Integration, FilterType } from "@/types"
import { cn } from "@/lib/utils" // Assuming cn utility is available

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all") // 'all', 'connected', 'disconnected'
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Integration | null>(null)

  const { data: allIntegrations, isLoading, error } = useIntegrations()
  const kpis = useIntegrationKPIs(allIntegrations)

  const filteredAndSearchedIntegrations = useMemo(() => {
    let filtered = allIntegrations

    // Apply filter based on connection status
    if (filterType === "connected") {
      filtered = filtered.filter((i) => i.is_connected === true)
    } else if (filterType === "disconnected") {
      filtered = filtered.filter((i) => i.is_connected === false)
    }
    // 'all' filter means no status filtering

    // Apply search query
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (integration) =>
          integration.name.toLowerCase().includes(lowercasedQuery) ||
          (integration.description && integration.description.toLowerCase().includes(lowercasedQuery)) ||
          integration.category.toLowerCase().includes(lowercasedQuery),
      )
    }
    return filtered
  }, [allIntegrations, filterType, searchQuery])

  const integrationsByCategory = useMemo(() => {
    return filteredAndSearchedIntegrations.reduce(
      (acc, integration) => {
        const category = integration.category
        if (!acc[category]) acc[category] = []
        acc[category].push(integration)
        return acc
      },
      {} as Record<string, Integration[]>,
    )
  }, [filteredAndSearchedIntegrations])

  const kpiData: KPIData[] = useMemo(
    () => [
      { label: "Tool Categories", value: kpis.categories, icon: WrenchScrewdriverIcon, color: "blue" },
      { label: "Connected Tools", value: kpis.connected, icon: CheckCircleIcon, color: "green" },
      { label: "Need Attention", value: kpis.needAttention, icon: ExclamationTriangleIcon, color: "yellow" },
      { label: "Data Points", value: kpis.totalDatapoints.toLocaleString(), icon: CircleStackIcon, color: "purple" },
    ],
    [kpis],
  )

  const handleOpenMarketplace = useCallback(() => setIsMarketplaceOpen(true), [])
  const handleCloseMarketplace = useCallback(() => setIsMarketplaceOpen(false), [])

  const handleAddTool = useCallback((tool: Integration) => {
    setSelectedTool(tool)
    setIsMarketplaceOpen(false)
    setIsRegistrationOpen(true) // Placeholder for registration flow
    // In a real app, you'd likely trigger a server action here to mark the tool as connected
    console.log("Attempting to add tool:", tool.name)
  }, [])

  const handleCloseRegistration = useCallback(() => {
    setIsRegistrationOpen(false)
    setSelectedTool(null)
    // Optionally re-open marketplace or refresh data
    // setIsMarketplaceOpen(true);
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-8 mt-8">
          <CardSkeleton className="h-24" />
          <CardSkeleton className="h-24" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load integrations</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Please check your network connection and Supabase configuration.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Error: {error.message}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 p-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Integrations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your connected cybersecurity tools across all categories
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <KpiTile key={index} data={kpi} />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search connected tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                filterType === "all"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
              )}
            >
              <FunnelIcon className="h-4 w-4" />
              All
            </button>
            <button
              onClick={() => setFilterType("connected")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                filterType === "connected"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
              )}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Connected
            </button>
            <button
              onClick={() => setFilterType("disconnected")}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                filterType === "disconnected"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600",
              )}
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              Need Attention
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {Object.keys(integrationsByCategory).length > 0 ? (
            Object.entries(integrationsByCategory).map(([category, integrations]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                  {category}
                </h2>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} />
                  ))}
                  {/* Add "Add Tool" card if showing all or disconnected and no tools in category */}
                  {(filterType === "all" || filterType === "disconnected") &&
                    integrations.filter((i) => !i.is_connected).length === 0 && (
                      <IntegrationCard isAddButton onAddClick={handleOpenMarketplace} />
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Tools Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {searchQuery
                  ? "No tools match your search criteria."
                  : filterType === "connected"
                    ? "No connected tools found. Browse the marketplace to add new tools."
                    : filterType === "disconnected"
                      ? "No tools needing attention found. All your tools are connected!"
                      : "Get started by adding a new tool from the marketplace."}
              </p>
              <button
                onClick={handleOpenMarketplace}
                className="mt-4 flex mx-auto items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Browse Marketplace
              </button>
            </div>
          )}
        </div>
      </div>

      <MarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={handleCloseMarketplace}
        onAddTool={handleAddTool}
        integrations={allIntegrations} // Pass all integrations to the marketplace modal
      />

      <RegistrationModal isOpen={isRegistrationOpen} onClose={handleCloseRegistration} tool={selectedTool} />
    </>
  )
}
