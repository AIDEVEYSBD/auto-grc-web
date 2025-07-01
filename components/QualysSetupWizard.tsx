"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, ScanLine } from "lucide-react"
import { ScrollArea } from "./ui/scroll-area"
import type { Integration } from "@/types"

interface QualysSetupWizardProps {
  tool: Integration
  onSetupComplete: () => void
}

type Step = "register" | "selectFields" | "processing" | "complete"

export default function QualysSetupWizard({ tool, onSetupComplete }: QualysSetupWizardProps) {
  const [step, setStep] = useState<Step>("register")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
  })
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())

  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSampleScan = async (email: string) => {
    setIsLoading(true)
    setLoadingMessage("Performing a sample scan on autogrc.cloud...")
    setError(null)

    try {
      const response = await fetch("/api/integrations/qualys/sample-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to perform sample scan.")

      setAvailableFields(data.availableFields)
      setStep("selectFields")
    } catch (err: any) {
      setError(err.message)
      setStep("register") // Go back to registration step on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoadingMessage("Registering with Qualys SSL Labs...")
    setError(null)

    try {
      const response = await fetch("/api/integrations/qualys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Registration failed.")

      toast({
        title: "Registration Successful",
        description: data.message,
      })
      // Pass email directly to the next step
      await handleSampleScan(formData.email)
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleFieldSelection = (field: string) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(field)) {
        newSet.delete(field)
      } else {
        newSet.add(field)
      }
      return newSet
    })
  }

  const handleFinalizeSetup = async () => {
    setIsLoading(true)
    setLoadingMessage("Applying settings and running initial scans for all applications...")
    setError(null)
    setStep("processing")

    try {
      const response = await fetch("/api/integrations/qualys/finalize-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          selectedFields: Array.from(selectedFields),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) throw new Error(data.error || "Final setup failed.")

      setStep("complete")
    } catch (err: any) {
      setError(err.message)
      setStep("selectFields") // Go back to field selection on error
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    if (isLoading)
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg font-semibold">{loadingMessage}</p>
          <p className="mt-2 text-sm text-muted-foreground">Please wait, this may take a few minutes...</p>
        </div>
      )

    if (error)
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="mt-4 text-lg font-semibold text-destructive">An Error Occurred</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => setError(null)} className="mt-4">
            Try Again
          </Button>
        </div>
      )

    switch (step) {
      case "register":
        return (
          <form onSubmit={handleRegistration} className="space-y-4 p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Register with Qualys SSL Labs</h3>
              <p className="text-sm text-muted-foreground">
                To use this integration, you need to register with the free Qualys SSL Labs API.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Organization Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="user@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name</Label>
              <Input
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Register and Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )
      case "selectFields":
        return (
          <div className="p-6">
            <div className="space-y-1 mb-4">
              <h3 className="text-lg font-semibold">Select Data Fields to Store</h3>
              <p className="text-sm text-muted-foreground">
                Choose which data points from the SSL scan you want to save in your database.
              </p>
            </div>
            <ScrollArea className="h-72 w-full rounded-md border p-4">
              <div className="space-y-2">
                {availableFields.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={selectedFields.has(field)}
                      onCheckedChange={() => handleFieldSelection(field)}
                    />
                    <label htmlFor={field} className="text-sm font-mono">
                      {field}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleFinalizeSetup} className="w-full mt-4" disabled={selectedFields.size === 0}>
              Finalize Setup <ScanLine className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )
      case "complete":
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="mt-4 text-lg font-semibold">Setup Complete!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The {tool.name} integration is now active. Initial scans have been performed.
            </p>
            <Button onClick={onSetupComplete} className="mt-4">
              Finish
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  return <div>{renderStep()}</div>
}
