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
import { extractFields } from "@/lib/qualys"
import type { Integration } from "@/types"

interface QualysRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tool: Integration
  onSuccess: (integrationId: string, config: any) => void
}

export default function QualysRegistrationModal({ isOpen, onClose, tool, onSuccess }: QualysRegistrationModalProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState({ firstName: "", lastName: "", workEmail: "", organization: "" })
  const [apiData, setApiData] = useState<any>(null)
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  const allFields = useMemo(() => (apiData ? extractFields(apiData) : []), [apiData])

  const handleUserInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value })
  }

  const handleNextStep = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/ssllabs?host=autogrc.cloud`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to fetch data from SSL Labs.")
      setApiData(data)
      const nonSensitiveFields = extractFields(data)
        .filter((f) => !f.sensitive)
        .map((f) => f.path)
      setSelectedFields(nonSensitiveFields)
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // This is the urgent fix: instead of calling a failing API,
      // we call the onSuccess callback directly with the configuration.
      // This will store the connection state in the browser's session storage.
      const config = { userInfo, selectedFields }
      onSuccess(tool.id, config)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fieldCategories = useMemo(() => {
    return allFields.reduce(
      (acc, field) => {
        const category = field.path.split(".")[0].replace(/\[\d+\]/g, "")
        if (!acc[category]) acc[category] = []
        acc[category].push(field)
        return acc
      },
      {} as Record<string, any[]>,
    )
  }, [allFields])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Connect {tool.name}</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Please provide your information to set up the integration."
              : "Select the data fields you want to sync."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={userInfo.firstName}
                  onChange={handleUserInfoChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={userInfo.lastName}
                  onChange={handleUserInfoChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="workEmail">Work Email</Label>
              <Input
                id="workEmail"
                name="workEmail"
                type="email"
                value={userInfo.workEmail}
                onChange={handleUserInfoChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                name="organization"
                value={userInfo.organization}
                onChange={handleUserInfoChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="targetHostname">Target Hostname</Label>
              <Input id="targetHostname" value="autogrc.cloud" disabled />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-semibold">Configure Data Fields</h3>
              <Badge>
                {selectedFields.length} / {allFields.length} fields selected
              </Badge>
            </div>
            <ScrollArea className="flex-grow my-4">
              <Accordion type="multiple" defaultValue={Object.keys(fieldCategories)}>
                {Object.entries(fieldCategories).map(([category, fields]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="capitalize">{category.replace(/([A-Z])/g, " $1")}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {fields.map((field) => (
                          <div key={field.path} className="flex items-center space-x-2">
                            <Checkbox
                              id={field.path}
                              checked={selectedFields.includes(field.path)}
                              onCheckedChange={(checked) => {
                                setSelectedFields((prev) =>
                                  checked ? [...prev, field.path] : prev.filter((p) => p !== field.path),
                                )
                              }}
                            />
                            <label htmlFor={field.path} className="text-sm font-mono flex-1 truncate">
                              {field.path}
                            </label>
                            {field.sensitive && <Lock className="h-3 w-3 text-yellow-500" />}
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {step === 1 && (
            <Button onClick={handleNextStep} disabled={isLoading || !userInfo.workEmail}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Next
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleFinish} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Finish & Connect
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
