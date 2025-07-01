"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import RegistrationModal from "./RegistrationModal"
import QualysRegistrationModal from "./QualysRegistrationModal"
import type { Integration } from "@/types"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  integrations: Integration[]
  onConnect: () => void
}

const QUALYS_SSL_LABS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

export default function MarketplaceModal({ isOpen, onClose, integrations, onConnect }: MarketplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTool, setSelectedTool] = useState<Integration | null>(null)
  const [isRegistrationOpen, setRegistrationOpen] = useState(false)
  const [isQualysRegistrationOpen, setQualysRegistrationOpen] = useState(false)

  const availableIntegrations = integrations.filter((tool) => !tool["is-connected"])
  const filteredIntegrations = availableIntegrations.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddTool = (tool: Integration) => {
    setSelectedTool(tool)
    if (tool.id === QUALYS_SSL_LABS_ID) {
      setQualysRegistrationOpen(true)
    } else {
      setRegistrationOpen(true)
    }
  }

  const handleCloseRegistration = () => {
    setRegistrationOpen(false)
    setQualysRegistrationOpen(false)
    setSelectedTool(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Integration Marketplace</DialogTitle>
            <DialogDescription>Connect new tools to your AutoGRC platform.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {filteredIntegrations.map((tool) => (
                <Card key={tool.id}>
                  <CardHeader>
                    <CardTitle>{tool.name}</CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {tool.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 h-20 overflow-hidden">{tool.description}</p>
                    <Button className="w-full mt-4" onClick={() => handleAddTool(tool)}>
                      Add Tool
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTool && !isQualysRegistrationOpen && (
        <RegistrationModal
          isOpen={isRegistrationOpen}
          onClose={handleCloseRegistration}
          toolName={selectedTool.name}
          onConnect={() => {
            onConnect()
            handleCloseRegistration()
          }}
          integrationId={selectedTool.id}
        />
      )}

      {selectedTool && isQualysRegistrationOpen && (
        <QualysRegistrationModal
          isOpen={isQualysRegistrationOpen}
          onClose={handleCloseRegistration}
          integration={selectedTool}
          onConnect={() => {
            onConnect()
            handleCloseRegistration()
          }}
        />
      )}
    </>
  )
}
