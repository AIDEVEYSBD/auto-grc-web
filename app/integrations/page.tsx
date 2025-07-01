"use client"

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
import RegistrationModal from "@/components/RegistrationModal"
import QualysRegistrationModal from "@/components/QualysRegistrationModal"
import QualysSSLIntegrationCard from "@/components/QualysSSLIntegrationCard"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useIntegrations, useIntegrationKPIs } from "@/lib/queries/integrations"
import type { KPIData, Integration } from "@/types"

const QUALYS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [modalState, setModalState] = useState<{
    marketplace?: boolean
    registration?: boolean
    qualys?: boolean
  }>({})
  const [selectedTool, setSelectedTool] = useState<Integration | null>(null)

  const { data: allIntegrations, isLoading, error, mutate } = useIntegrations()
  const kpis = useIntegrationKPIs(allIntegrations)

  const handleModalClose = useCallback(() => {
    setModalState({})
    setSelectedTool(null)
  }, [])

  const handleAddTool = useCallback((tool: Integration) => {
    setSelectedTool(tool)
    if (tool.id === QUALYS_ID) {
      setModalState({ qualys: true })
    } else {
      setModalState({ registration: true })
    }
  }, [])

  const handleSuccess = useCallback(() => {
    mutate() // Re-fetches the integration data
    handleModalClose()
  }, [mutate, handleModalClose])

  const connectedIntegrations = useMemo(() => {
    if (!allIntegrations) return []

    let filtered = allIntegrations.filter((i) => i["is-connected"])

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
  }, [allIntegrations, searchQuery])

  const integrationsByCategory = useMemo(() => {
    return connectedIntegrations.reduce(
      (acc, integration) => {
        const category = integration.category
        if (!acc[category]) acc[category] = []
        acc[category].push(integration)
        return acc
      },
      {} as Record<string, Integration[]>,
    )
  }, [connectedIntegrations])

  const kpiData: KPIData[] = useMemo(
    () => [
      { label: "Tool Categories", value: kpis.categories, icon: WrenchScrewdriverIcon, color: "blue" },
      { label: "Connected Tools", value: kpis.connected, icon: CheckCircleIcon, color: "green" },
      { label: "Need Attention", value: kpis.needAttention, icon: ExclamationTriangleIcon, color: "yellow" },
      { label: "Data Points", value: kpis.totalDatapoints.toLocaleString(), icon: CircleStackIcon, color: "purple" },
    ],
    [kpis],
  )

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
            onClick={() => setModalState({ marketplace: true })}
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
        </div>

        <div className="space-y-8">
          {Object.keys(integrationsByCategory).length > 0 ? (
            Object.entries(integrationsByCategory).map(([category, integrations]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                  {category}
                </h2>
                <div className="space-y-4">
                  {integrations.map((integration) =>
                    integration.id === QUALYS_ID ? (
                      <QualysSSLIntegrationCard key={integration.id} integration={integration} />
                    ) : (
                      <IntegrationCard key={integration.id} integration={integration} />
                    ),
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Connected Tools Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {searchQuery
                  ? "No connected tools match your search criteria."
                  : "Browse the marketplace to add new tools."}
              </p>
              <button
                onClick={() => setModalState({ marketplace: true })}
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
        isOpen={!!modalState.marketplace}
        onClose={handleModalClose}
        onAddTool={handleAddTool}
        integrations={allIntegrations || []}
      />

      {selectedTool && (
        <>
          <RegistrationModal
            isOpen={!!modalState.registration}
            onClose={handleModalClose}
            tool={selectedTool}
            onSuccess={handleSuccess}
          />
          <QualysRegistrationModal
            isOpen={!!modalState.qualys}
            onClose={handleModalClose}
            tool={selectedTool}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  )
}
