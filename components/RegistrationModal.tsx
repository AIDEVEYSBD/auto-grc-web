"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Integration } from "@/types"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  integration: Integration
  onSuccess: () => void
}

export default function RegistrationModal({ isOpen, onClose, integration, onSuccess }: RegistrationModalProps) {
  const [apiKey, setApiKey] = useState("")

  const handleConnect = () => {
    // For now, just call onSuccess to update session storage
    onSuccess()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to {integration.name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
        </div>
        <DialogFooter>
          <Button onClick={handleConnect}>Connect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
