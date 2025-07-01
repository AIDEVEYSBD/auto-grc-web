"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Integration } from "@/types"
import RegistrationModal from "./RegistrationModal"
import QualysRegistrationModal from "./QualysRegistrationModal"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  integrations: Integration[]
  onConnectSuccess: (integrationId: string, config?: any) => void
}

const QUALYS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

export default function MarketplaceModal({ isOpen, onClose, integrations, onConnectSuccess }: MarketplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)

  const handleSelectIntegration = (integration: Integration) => {
    setSelectedIntegration(integration)
  }

  const handleCloseAll = () => {
    setSelectedIntegration(null)
    onClose()
  }

  const handleConnect = (config?: any) => {
    if (selectedIntegration) {
      onConnectSuccess(selectedIntegration.id, config)
    }
    handleCloseAll()
  }

  const filteredIntegrations = integrations.filter(
    (i) => !i["is-connected"] && i.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <Dialog open={isOpen && !selectedIntegration} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Integration Marketplace</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search marketplace..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="my-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleSelectIntegration(integration)}>Add Tool</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedIntegration && selectedIntegration.id === QUALYS_ID && (
        <QualysRegistrationModal isOpen={!!selectedIntegration} onClose={handleCloseAll} onSuccess={handleConnect} />
      )}

      {selectedIntegration && selectedIntegration.id !== QUALYS_ID && (
        <RegistrationModal
          isOpen={!!selectedIntegration}
          onClose={handleCloseAll}
          integration={selectedIntegration}
          onSuccess={handleConnect}
        />
      )}
    </>
  )
}
