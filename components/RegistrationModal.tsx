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
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { Integration } from "@/types"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tool: Integration
  onSuccess: (integrationId: string, config: any) => void
}

export default function RegistrationModal({ isOpen, onClose, tool, onSuccess }: RegistrationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState("")

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulate API key validation
      if (!apiKey) {
        throw new Error("API Key is required.")
      }
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay

      // Urgent fix: Call onSuccess to store in session storage
      const config = { apiKeyProvided: true } // Store a minimal config
      onSuccess(tool.id, config)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to {tool.name}</DialogTitle>
          <DialogDescription>Please enter the required information to connect this tool.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="••••••••••••••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
