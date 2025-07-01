"use client"

import type React from "react"

import { useState } from "react"
import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Integration } from "@/types"

interface QualysSetupWizardProps {
  tool: Integration
  onClose: () => void
}

interface RegistrationData {
  firstName: string
  lastName: string
  email: string
  organization: string
}

interface FieldCategory {
  basic: string[]
  certificate: string[]
  security: string[]
  protocols: string[]
  other: string[]
}

type Step = "registration" | "field-selection" | "processing" | "completion"

export default function QualysSetupWizard({ tool, onClose }: QualysSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("registration")
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
  })
  const [availableFields, setAvailableFields] = useState<FieldCategory | null>(null)
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string>("")
  const [completionResults, setCompletionResults] = useState<any>(null)

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/integrations/qualys/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setRegisteredEmail(data.email)

      // Automatically proceed to sample scan
      const sampleResponse = await fetch("/api/integrations/qualys/sample-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      })

      const sampleData = await sampleResponse.json()

      if (!sampleResponse.ok) {
        throw new Error(sampleData.error || "Sample scan failed")
      }

      setAvailableFields(sampleData.availableFields)

      // Pre-select some recommended fields
      const recommendedFields = [
        "host",
        "status",
        "grade",
        "startTime",
        "testTime",
        ...sampleData.availableFields.basic.slice(0, 3),
        ...sampleData.availableFields.security.slice(0, 5),
      ]
      setSelectedFields(recommendedFields)

      setCurrentStep("field-selection")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) => (prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]))
  }

  const handleCategoryToggle = (category: keyof FieldCategory) => {
    if (!availableFields) return

    const categoryFields = availableFields[category]
    const allSelected = categoryFields.every((field) => selectedFields.includes(field))

    if (allSelected) {
      setSelectedFields((prev) => prev.filter((field) => !categoryFields.includes(field)))
    } else {
      setSelectedFields((prev) => [...new Set([...prev, ...categoryFields])])
    }
  }

  const handleFinalize = async () => {
    setLoading(true)
    setError(null)
    setCurrentStep("processing")

    try {
      const response = await fetch("/api/integrations/qualys/finalize-setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registeredEmail,
          selectedFields,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Setup failed")
      }

      setCompletionResults(data.results)
      setCurrentStep("completion")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setCurrentStep("field-selection")
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: "registration", label: "Registration", completed: currentStep !== "registration" },
      {
        key: "field-selection",
        label: "Field Selection",
        completed: ["processing", "completion"].includes(currentStep),
      },
      { key: "processing", label: "Processing", completed: currentStep === "completion" },
      { key: "completion", label: "Complete", completed: false },
    ]

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : currentStep === step.key
                    ? "border-blue-500 text-blue-500"
                    : "border-gray-300 text-gray-300"
              }`}
            >
              {step.completed ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                step.completed || currentStep === step.key ? "text-gray-900 dark:text-white" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 mx-4 ${step.completed ? "bg-green-500" : "bg-gray-300"}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderRegistrationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Register with Qualys SSL Labs</CardTitle>
        <CardDescription>
          Enter your details to register with the Qualys SSL Labs API. This is required to access their scanning
          services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegistration} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={registrationData.firstName}
                onChange={(e) => setRegistrationData((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={registrationData.lastName}
                onChange={(e) => setRegistrationData((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Organization Email</Label>
            <Input
              id="email"
              type="email"
              value={registrationData.email}
              onChange={(e) => setRegistrationData((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Personal email addresses (Gmail, Yahoo, Hotmail) are not allowed
            </p>
          </div>
          <div>
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              value={registrationData.organization}
              onChange={(e) => setRegistrationData((prev) => ({ ...prev, organization: e.target.value }))}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registering..." : "Register & Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  const renderFieldSelectionStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Select Data Fields</CardTitle>
        <CardDescription>
          Choose which data fields you want to collect from SSL scans. We've pre-selected recommended fields for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Badge variant="outline">{selectedFields.length} fields selected</Badge>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-6">
            {availableFields &&
              Object.entries(availableFields).map(([category, fields]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize text-gray-900 dark:text-white">
                      {category.replace(/([A-Z])/g, " $1").trim()} ({fields.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCategoryToggle(category as keyof FieldCategory)}
                    >
                      {fields.every((field) => selectedFields.includes(field)) ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pl-4">
                    {fields.map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                          id={field}
                          checked={selectedFields.includes(field)}
                          onCheckedChange={() => handleFieldToggle(field)}
                        />
                        <Label htmlFor={field} className="text-sm font-mono">
                          {field}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {category !== "other" && <Separator className="mt-4" />}
                </div>
              ))}
          </div>
        </ScrollArea>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mt-4">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => setCurrentStep("registration")} disabled={loading}>
            Back
          </Button>
          <Button onClick={handleFinalize} disabled={loading || selectedFields.length === 0} className="flex-1">
            {loading ? "Setting up..." : `Setup Integration (${selectedFields.length} fields)`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderProcessingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Setting Up Integration</CardTitle>
        <CardDescription>
          Please wait while we configure your Qualys SSL Labs integration and scan your applications.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          This may take several minutes as we scan all your applications...
        </p>
      </CardContent>
    </Card>
  )

  const renderCompletionStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckIcon className="h-5 w-5 text-green-500" />
          Setup Complete!
        </CardTitle>
        <CardDescription>Your Qualys SSL Labs integration has been successfully configured.</CardDescription>
      </CardHeader>
      <CardContent>
        {completionResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completionResults.scanned}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Applications Scanned</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedFields.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Data Fields Collected</div>
              </div>
            </div>

            {completionResults.errors > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {completionResults.errors} applications had scanning issues. Check the logs for details.
                </p>
              </div>
            )}
          </div>
        )}

        <Button onClick={onClose} className="w-full mt-6">
          Close
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {renderStepIndicator()}

      {currentStep === "registration" && renderRegistrationStep()}
      {currentStep === "field-selection" && renderFieldSelectionStep()}
      {currentStep === "processing" && renderProcessingStep()}
      {currentStep === "completion" && renderCompletionStep()}
    </div>
  )
}
