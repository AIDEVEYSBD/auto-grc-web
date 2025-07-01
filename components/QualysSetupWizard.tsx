"use client"

import type React from "react"
import { useState } from "react"
import type { Integration } from "@/types"
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"

type WizardStep = "register" | "select_fields" | "processing" | "complete" | "error"

export default function QualysSetupWizard({ tool, onClose }: { tool: Integration; onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>("register")
  const [formData, setFormData] = useState({ firstName: "", lastName: "", organization: "", email: "" })
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFieldSelection = (field: string) => {
    const newSelection = new Set(selectedFields)
    if (newSelection.has(field)) {
      newSelection.delete(field)
    } else {
      newSelection.add(field)
    }
    setSelectedFields(newSelection)
  }

  const handleRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStep("processing")
    setMessage("Registering with Qualys API...")

    try {
      const regResponse = await fetch("/api/integrations/qualys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const regData = await regResponse.json()
      if (!regResponse.ok) throw new Error(regData.error || "Registration failed")

      setMessage("Fetching sample data fields from Qualys...")
      const sampleResponse = await fetch("/api/integrations/qualys/sample-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })
      const sampleData = await sampleResponse.json()
      if (!sampleResponse.ok) throw new Error(sampleData.error || "Failed to fetch sample data")

      setAvailableFields(sampleData.availableFields)
      setStep("select_fields")
    } catch (err: any) {
      setStep("error")
      setMessage(err.message)
    }
  }

  const handleSetup = async () => {
    setStep("processing")
    setMessage("Creating database table and running initial scans. This may take several minutes...")

    try {
      const response = await fetch("/api/integrations/qualys/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, selectedFields: Array.from(selectedFields) }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Setup failed")

      setMessage(data.message)
      setStep("complete")
    } catch (err: any) {
      setStep("error")
      setMessage(err.message)
    }
  }

  const renderContent = () => {
    switch (step) {
      case "register":
        return (
          <form onSubmit={handleRegistration} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              First, register with Qualys. This information is required to use their API.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                name="firstName"
                placeholder="First Name"
                onChange={handleInputChange}
                required
                className="input-field"
              />
              <input
                name="lastName"
                placeholder="Last Name"
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </div>
            <input
              name="organization"
              placeholder="Organization"
              onChange={handleInputChange}
              required
              className="input-field"
            />
            <input
              type="email"
              name="email"
              placeholder="Corporate Email"
              onChange={handleInputChange}
              required
              className="input-field"
            />
            <div className="flex justify-end pt-4">
              <button type="submit" className="btn-primary">
                Register & Continue
              </button>
            </div>
          </form>
        )
      case "select_fields":
        return (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Select Data to Store</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose which fields from the Qualys API response you want to store in your database.
            </p>
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
              {availableFields.map((field) => (
                <label
                  key={field}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field)}
                    onChange={() => handleFieldSelection(field)}
                    className="h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-mono text-gray-800 dark:text-gray-200">{field}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">{selectedFields.size} fields selected</span>
              <button onClick={handleSetup} className="btn-primary" disabled={selectedFields.size === 0}>
                Confirm & Run Scans
              </button>
            </div>
          </div>
        )
      case "processing":
        return (
          <div className="text-center py-8">
            <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin text-blue-500" />
            <p className="mt-4 text-gray-700 dark:text-gray-300">{message}</p>
          </div>
        )
      case "complete":
        return (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500" />
            <p className="mt-4 font-semibold text-lg text-gray-900 dark:text-white">Setup Complete!</p>
            <p className="mt-2 text-gray-700 dark:text-gray-300">{message}</p>
            <button onClick={onClose} className="btn-primary mt-6">
              Finish
            </button>
          </div>
        )
      case "error":
        return (
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500" />
            <p className="mt-4 font-semibold text-lg text-red-700 dark:text-red-400">An Error Occurred</p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {message}
            </p>
            <button onClick={() => setStep("register")} className="btn-secondary mt-6">
              Try Again
            </button>
          </div>
        )
    }
  }

  return <div>{renderContent()}</div>
}
