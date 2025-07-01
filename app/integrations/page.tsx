"use client"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { PlusIcon, SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getIntegrations } from "@/lib/queries/integrations"
import MarketplaceModal from "@/components/MarketplaceModal"
import IntegrationCard from "@/components/IntegrationCard"
import type { Integration } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = () => getIntegrations()

export default function IntegrationsPage() {
  const { data: initialIntegrations, error, isLoading } = useSWR<Integration[]>("integrations", fetcher)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (initialIntegrations) {
      const sessionConnections = JSON.parse(sessionStorage.getItem("integrationConnections") || "{}")
      const mergedIntegrations = initialIntegrations.map((integ) => {
        if (sessionConnections[integ.id]) {
          return {
            ...integ,
            "is-connected": true,
            config: sessionConnections[integ.id].config,
          }
        }
        return integ
      })
      setIntegrations(mergedIntegrations)
    }
  }, [initialIntegrations])

  const handleConnectionChange = useCallback((integrationId: string, config?: any) => {
    const sessionConnections = JSON.parse(sessionStorage.getItem("integrationConnections") || "{}")
    sessionConnections[integrationId] = { connected: true, config: config || {} }
    sessionStorage.setItem("integrationConnections", JSON.stringify(sessionConnections))

    setIntegrations((prev) =>
      prev.map((integ) => (integ.id === integrationId ? { ...integ, "is-connected": true, config } : integ)),
    )
  }, [])

  const filteredIntegrations = integrations.filter((integration) =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const connectedIntegrations = filteredIntegrations.filter((i) => i["is-connected"])
  const availableIntegrations = filteredIntegrations.filter((i) => !i["is-connected"])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" /> Add New Integration
          </Button>
        </div>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search integrations..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/4" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      )}

      {error && <p className="text-red-500">Failed to load integrations.</p>}

      {connectedIntegrations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Connected</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectedIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
          </div>
        </div>
      )}

      {availableIntegrations.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Available</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} onConnect={() => setIsModalOpen(true)} />
            ))}
          </div>
        </div>
      )}

      <MarketplaceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        integrations={initialIntegrations || []}
        onConnectSuccess={handleConnectionChange}
      />
    </div>
  )
}
