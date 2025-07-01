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
import { Loader2 } from "lucide-react"
import type { Integration } from "@/types"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tool: Integration
  onSuccess: () => void
}

export default function RegistrationModal({ isOpen, onClose, tool, onSuccess }: RegistrationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: tool.id,
          config: { connected: true }, // Generic config
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to connect integration.")
      }
      onSuccess()
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
          <DialogTitle>Connect {tool.name}</DialogTitle>
          <DialogDescription>This is a standard integration. Clicking connect will enable this tool.</DialogDescription>
        </DialogHeader>
        <p className="py-4 text-sm text-gray-600 dark:text-gray-400">
          You are about to connect the <strong>{tool.name}</strong> integration. This will allow AutoGRC to access data
          from this tool according to its category: <strong>{tool.category}</strong>.
        </p>
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
