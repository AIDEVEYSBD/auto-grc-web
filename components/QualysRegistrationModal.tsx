"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, ShieldCheck } from "lucide-react"
import { extractFields } from "@/lib/qualys"
import { Badge } from "@/components/ui/badge"

interface QualysRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (config: any) => void
}

type Step = "form" | "fetching" | "fields" | "saving"

export default function QualysRegistrationModal({ isOpen, onClose, onSuccess }: QualysRegistrationModalProps) {
  const [step, setStep] = useState<Step>("form")
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    workEmail: "",
    organization: "",
    targetHostname: "autogrc.cloud",
  })
  const [apiFields, setApiFields] = useState<any[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFetchFields = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep("fetching")
    setError(null)

    try {
      const response = await fetch(`/api/ssllabs?host=${formData.targetHostname}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data from SSL Labs.")
      }
      const fields = extractFields(data)
      setApiFields(fields)
      setSelectedFields(fields.filter((f) => !f.sensitive).map((f) => f.path))
      setStep("fields")
    } catch (err: any) {
      setError(err.message)
      setStep("form")
    }
  }

  const handleFieldToggle = (path: string) => {
    setSelectedFields((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]))
  }

  const handleSave = async () => {
    setStep("saving")
    const config = {
      userInfo: formData,
      selectedFields,
    }
    // No API call, just call onSuccess for sessionStorage
    onSuccess(config)
    setStep("form") // Reset for next time
  }

  const fieldCategories = useMemo(() => {
    const categories: Record<string, any[]> = {
      "Host Info": [],
      Endpoints: [],
      Certificates: [],
      "Security Details": [],
      Other: [],
    }
    apiFields.forEach((field) => {
      if (field.path.startsWith("endpoints")) categories.Endpoints.push(field)
      else if (field.path.startsWith("certs")) categories.Certificates.push(field)
      else if (field.path.includes("vuln") || field.path.includes("bleed")) categories["Security Details"].push(field)
      else if (["host", "port", "protocol", "status"].some((p) => field.path.startsWith(p)))
        categories["Host Info"].push(field)
      else categories.Other.push(field)
    })
    return categories
  }, [apiFields])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connect to Qualys SSL Labs</DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleFetchFields} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="workEmail">Work Email</Label>
              <Input
                id="workEmail"
                name="workEmail"
                type="email"
                value={formData.workEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="targetHostname">Target Hostname</Label>
              <Input
                id="targetHostname"
                name="targetHostname"
                value={formData.targetHostname}
                onChange={handleInputChange}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter>
              <Button type="submit">Fetch & Select Fields</Button>
            </DialogFooter>
          </form>
        )}

        {step === "fetching" && (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Analyzing host... this may take a minute.</p>
          </div>
        )}

        {step === "fields" && (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Select Data Fields to Capture</h4>
              <Badge>
                {selectedFields.length} / {apiFields.length} selected
              </Badge>
            </div>
            <ScrollArea className="h-72 border rounded-md p-4">
              {Object.entries(fieldCategories).map(([category, fields]) =>
                fields.length > 0 ? (
                  <div key={category} className="mb-4">
                    <h5 className="font-semibold mb-2 text-sm">{category}</h5>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <div key={field.path} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.path}
                            checked={selectedFields.includes(field.path)}
                            onCheckedChange={() => handleFieldToggle(field.path)}
                          />
                          <Label htmlFor={field.path} className="font-normal flex-grow">
                            {field.path}
                          </Label>
                          {field.sensitive && <ShieldCheck className="h-4 w-4 text-red-500" />}
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </ScrollArea>
            <DialogFooter>
              <Button onClick={handleSave}>Connect</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
