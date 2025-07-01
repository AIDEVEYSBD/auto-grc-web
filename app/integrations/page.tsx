"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import IntegrationCard from "@/components/IntegrationCard"
import MarketplaceModal from "@/components/MarketplaceModal"
import { Loader2 } from "lucide-react"
import type { Integration } from "@/types"
import QualysSSLIntegrationCard from "@/components/QualysSSLIntegrationCard"

const QUALYS_SSL_LABS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarketplaceOpen, setMarketplaceOpen] = useState(false)

  const fetchIntegrations = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("integrations").select("*").order("name")
    if (data) {
      setIntegrations(data)
    }
    if (error) {
      console.error("Error fetching integrations:", error)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const connectedIntegrations = integrations.filter((i) => i["is-connected"])

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Integrations</h1>
        <Button onClick={() => setMarketplaceOpen(true)}>Add New Integration</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectedIntegrations.map((integration) =>
            integration.id === QUALYS_SSL_LABS_ID ? (
              <QualysSSLIntegrationCard key={integration.id} integration={integration} />
            ) : (
              <IntegrationCard key={integration.id} integration={integration} />
            ),
          )}
        </div>
      )}

      {connectedIntegrations.length === 0 && !isLoading && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No integrations connected</h2>
          <p className="text-gray-500 mt-2">Connect a new integration to get started.</p>
          <Button className="mt-4" onClick={() => setMarketplaceOpen(true)}>
            Add Integration
          </Button>
        </div>
      )}

      <MarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
        integrations={integrations}
        onConnect={fetchIntegrations}
      />
    </div>
  )
}
