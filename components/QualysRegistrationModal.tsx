"use client"

import type React from "react"

import { useState, useMemo } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Loader2, Lock } from "lucide-react"
import { extractFields, type ExtractedField } from "@/lib/qualys"
import type { Integration } from "@/types"

interface QualysRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onConnect: () => void
  integration: Integration
}

type Step = "userInfo" | "fieldSelection" | "connecting"

export default function QualysRegistrationModal({
  isOpen,
  onClose,
  onConnect,
  integration,
}: QualysRegistrationModalProps) {
  const [step, setStep] = useState<Step>("userInfo")
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    workEmail: "",
    organization: "",
    targetHostname: "autogrc.cloud",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiFields, setApiFields] = useState<ExtractedField[]>([])
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setUser((prev) => ({ ...prev, [id]: value }))
  }

  const fetchApiStructure = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/ssllabs?host=${user.targetHostname}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch API structure.")
      }
      const data = await response.json()
      const fields = extractFields(data)
      setApiFields(fields)

      // Pre-select non-sensitive fields
      const nonSensitive = fields.filter((f) => !f.sensitive).map((f) => f.path)
      setSelectedFields(new Set(nonSensitive))

      setStep("fieldSelection")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldToggle = (path: string) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleConnect = async () => {
    setStep("connecting")
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationId: integration.id,
          user,
          selectedFields: Array.from(selectedFields),
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to connect.")
      }
      onConnect()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setStep("fieldSelection") // Go back to previous step on error
    } finally {
      setIsLoading(false)
    }
  }

  const categorizedFields = useMemo(() => {
    const categories: Record<string, ExtractedField[]> = {
      "Host Info": [],
      Endpoints: [],
      Certificates: [],
      "Security Details": [],
      Other: [],
    }
    apiFields.forEach((field) => {
      if (field.path.startsWith("endpoints")) categories["Endpoints"].push(field)
      else if (field.path.startsWith("certs")) categories["Certificates"].push(field)
      else if (field.path.includes("vuln") || field.path.includes("supports"))
        categories["Security Details"].push(field)
      else if (["host", "port", "protocol", "status", "engineVersion"].includes(field.path))
        categories["Host Info"].push(field)
      else categories["Other"].push(field)
    })
    return categories
  }, [apiFields])

  const renderStep = () => {
    switch (step) {
      case "userInfo":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Register Qualys SSL Labs</DialogTitle>
              <DialogDescription>Please provide your information to set up the integration.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {Object.entries(user).map(([key, value]) => (
                <div className="grid grid-cols-4 items-center gap-4" key={key}>
                  <Label htmlFor={key} className="text-right capitalize">
                    {key.replace(/([A-Z])/g, " $1")}
                  </Label>
                  <Input
                    id={key}
                    value={value}
                    onChange={handleUserInputChange}
                    className="col-span-3"
                    required
                    disabled={key === "targetHostname"}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={fetchApiStructure} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Next
              </Button>
            </DialogFooter>
          </>
        )
      case "fieldSelection":
        return (
          <>
            <DialogHeader>
              <DialogTitle>Select Data Fields</DialogTitle>
              <DialogDescription>
                Choose which fields to import from the SSL Labs API. Unselected fields will be obfuscated.
              </DialogDescription>
              <div className="text-sm text-muted-foreground pt-2">
                {apiFields.length} fields available, {selectedFields.size} selected.
              </div>
            </DialogHeader>
            <ScrollArea className="h-96 my-4 border rounded-md p-4">
              <Accordion type="multiple" defaultValue={Object.keys(categorizedFields)}>
                {Object.entries(categorizedFields).map(([category, fields]) =>
                  fields.length > 0 ? (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger>{category}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {fields.map((field) => (
                            <div key={field.path} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={field.path}
                                  checked={selectedFields.has(field.path)}
                                  onCheckedChange={() => handleFieldToggle(field.path)}
                                />
                                <Label htmlFor={field.path} className="font-normal">
                                  {field.path}
                                </Label>
                                {field.sensitive && <Lock className="h-3 w-3 text-yellow-500" />}
                              </div>
                              <Badge variant="outline">{field.type}</Badge>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : null,
                )}
              </Accordion>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("userInfo")}>
                Back
              </Button>
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect
              </Button>
            </DialogFooter>
          </>
        )
      case "connecting":
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Connecting to Qualys SSL Labs...</p>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        {renderStep()}
        {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
