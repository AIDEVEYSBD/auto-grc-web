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
import DisconnectConfirmModal from "@/components/DisconnectConfirmModal"
import ReconfigureModal from "@/components/ReconfigureModal"
import QualysSSLResultsModal from "@/components/QualysSSLResultsModal"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useIntegrations, useIntegrationKPIs } from "@/lib/queries/integrations"
import { supabase } from "@/lib/supabase"
import type { KPIData, Integration } from "@/types"

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false)
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false)
  const [isReconfigureModalOpen, setIsReconfigureModalOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Integration | null>(null)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [isQualysResultsOpen, setIsQualysResultsOpen] = useState(false)
  const [qualysResults, setQualysResults] = useState<any[]>([])

  const { data: allIntegrations, isLoading, error, mutate } = useIntegrations()

  const kpis = useIntegrationKPIs(allIntegrations)

  const filteredAndSearchedIntegrations = useMemo(() => {
    // Always filter for connected tools using "is-connected"
    let filtered = allIntegrations.filter((i) => i["is-connected"] === true)

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
  }, [allIntegrations, searchQuery])

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
    setIsRegistrationOpen(true)
    console.log("Attempting to add tool:", tool.name)
  }, [])

  const handleCloseRegistration = useCallback(() => {
    setIsRegistrationOpen(false)
    setSelectedTool(null)
  }, [])

  const handleRunTool = useCallback(
    async (integration: Integration) => {
      setIsProcessing(integration.id)

      try {
        console.log(`Running tool: ${integration.name}`)

        // Custom behavior for Qualys SSL Labs
        if (integration.id === "b3f4ff74-56c1-4321-b137-690b939e454a") {
          await handleQualysSSLLabsExecution(integration)
          return
        }

        // Generic behavior for other integrations
        if (!integration.endpoint) {
          console.warn("No endpoint available for", integration.name)
          alert(`No endpoint configured for ${integration.name}. Please configure it first.`)
          return
        }

        const response = await fetch(integration.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tool_id: integration.id,
            timestamp: new Date().toISOString(),
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`Tool ${integration.name} executed successfully:`, result)
          alert(`Tool "${integration.name}" executed successfully!`)
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error(`Failed to run tool ${integration.name}:`, error)
        alert(`Failed to run tool "${integration.name}". Please check the console for details.`)
      } finally {
        setIsProcessing(null)
      }
    },
    [mutate],
  )

  const handleQualysSSLLabsExecution = async (integration: Integration) => {
    try {
      console.log("Executing Qualys SSL Labs with custom endpoint...")

      // Use the specific endpoint for Qualys SSL Labs
      const endpoint = "https://integrations-y21v.onrender.com/ssl-analysis"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tool_id: integration.id,
          tool_name: integration.name,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Qualys SSL Labs results:", result)

        // Check if result is an array or contains an array
        let resultsArray = result
        if (!Array.isArray(result)) {
          // If it's an object, try to find an array property
          const arrayKeys = Object.keys(result).filter((key) => Array.isArray(result[key]))
          if (arrayKeys.length > 0) {
            resultsArray = result[arrayKeys[0]]
          } else {
            // If no array found, wrap the single result in an array
            resultsArray = [result]
          }
        }

        // Store results and open the results modal
        setQualysResults(resultsArray)
        setIsQualysResultsOpen(true)
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("Qualys SSL Labs execution failed:", error)
      throw error
    }
  }

  const handleDisconnectClick = useCallback((integration: Integration) => {
    setSelectedTool(integration)
    setIsDisconnectModalOpen(true)
  }, [])

  const handleDisconnectConfirm = useCallback(async () => {
    if (!selectedTool) return

    setIsProcessing(selectedTool.id)

    try {
      const { error } = await supabase.from("integrations").update({ "is-connected": false }).eq("id", selectedTool.id)

      if (error) {
        throw error
      }

      console.log(`Disconnected tool: ${selectedTool.name}`)
      mutate()
      setIsDisconnectModalOpen(false)
      setSelectedTool(null)
    } catch (error) {
      console.error(`Failed to disconnect tool ${selectedTool.name}:`, error)
      alert(`Failed to disconnect tool "${selectedTool.name}". Please try again.`)
    } finally {
      setIsProcessing(null)
    }
  }, [selectedTool, mutate])

  const handleReconfigureClick = useCallback((integration: Integration) => {
    setSelectedTool(integration)
    setIsReconfigureModalOpen(true)
  }, [])

  const handleReconfigureSave = useCallback(
    async (endpoint: string) => {
      if (!selectedTool) return

      setIsProcessing(selectedTool.id)

      try {
        const { error } = await supabase.from("integrations").update({ endpoint }).eq("id", selectedTool.id)

        if (error) {
          throw error
        }

        console.log(`Updated endpoint for tool: ${selectedTool.name}`)
        mutate()
        setIsReconfigureModalOpen(false)
        setSelectedTool(null)
      } catch (error) {
        console.error(`Failed to update endpoint for tool ${selectedTool.name}:`, error)
        alert(`Failed to update endpoint for tool "${selectedTool.name}". Please try again.`)
      } finally {
        setIsProcessing(null)
      }
    },
    [selectedTool, mutate],
  )

  const handleCloseDisconnectModal = useCallback(() => {
    setIsDisconnectModalOpen(false)
    setSelectedTool(null)
  }, [])

  const handleCloseReconfigureModal = useCallback(() => {
    setIsReconfigureModalOpen(false)
    setSelectedTool(null)
  }, [])

  const handleCloseQualysResults = useCallback(() => {
    setIsQualysResultsOpen(false)
    setQualysResults([])
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
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      onRunTool={handleRunTool}
                      onDisconnect={handleDisconnectClick}
                      onReconfigure={handleReconfigureClick}
                      className={isProcessing === integration.id ? "opacity-50 pointer-events-none" : ""}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Connected Tools Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {searchQuery
                  ? "No connected tools match your search criteria."
                  : "No connected tools found. Browse the marketplace to add new tools."}
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
        integrations={allIntegrations}
        onRefresh={mutate}
      />

      <RegistrationModal isOpen={isRegistrationOpen} onClose={handleCloseRegistration} tool={selectedTool} />

      <DisconnectConfirmModal
        isOpen={isDisconnectModalOpen}
        onClose={handleCloseDisconnectModal}
        onConfirm={handleDisconnectConfirm}
        integration={selectedTool}
        isProcessing={isProcessing === selectedTool?.id}
      />

      <ReconfigureModal
        isOpen={isReconfigureModalOpen}
        onClose={handleCloseReconfigureModal}
        onSave={handleReconfigureSave}
        integration={selectedTool}
        isProcessing={isProcessing === selectedTool?.id}
      />

      <QualysSSLResultsModal
        isOpen={isQualysResultsOpen}
        onClose={handleCloseQualysResults}
        results={qualysResults}
        isProcessing={isProcessing === "b3f4ff74-56c1-4321-b137-690b939e454a"}
      />
    </>
  )
}
