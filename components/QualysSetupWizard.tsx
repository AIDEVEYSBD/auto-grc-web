"use client"

import { useState, useMemo } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid"
import type { Integration } from "@/types"

type WizardStep = "registration" | "field-selection" | "processing" | "complete"

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .refine((email) => !/(@gmail\.com|@yahoo\.com|@hotmail\.com)$/.test(email), {
      message: "Personal email addresses (Gmail, Yahoo, Hotmail) are not allowed.",
    }),
  organization: z.string().min(1, "Organization is required"),
})

type RegistrationFormInputs = z.infer<typeof registrationSchema>

interface QualysSetupWizardProps {
  tool: Integration
  onClose: () => void
}

export default function QualysSetupWizard({ tool, onClose }: QualysSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>("registration")
  const [error, setError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string>("")
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormInputs>({
    resolver: zodResolver(registrationSchema),
  })

  const handleRegistration: SubmitHandler<RegistrationFormInputs> = async (data) => {
    setError(null)
    try {
      const response = await fetch("/api/integrations/qualys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Registration failed")
      setRegisteredEmail(data.email)
      setStep("field-selection")
      fetchSampleFields(data.email)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchSampleFields = async (email: string) => {
    try {
      const response = await fetch("/api/integrations/qualys/sample-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to fetch sample fields")
      setAvailableFields(result.keys.sort())
      // Pre-select some common fields
      const commonFields = new Set(
        result.keys.filter((k: string) => /grade|status|protocol|host|ipAddress|serverName|issues/.test(k)),
      )
      setSelectedFields(commonFields)
    } catch (err: any) {
      setError(err.message)
      setStep("registration") // Go back if sample scan fails
    }
  }

  const handleFinalizeSetup = async () => {
    setError(null)
    setStep("processing")
    try {
      const response = await fetch("/api/integrations/qualys/finalize-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, selectedFields: Array.from(selectedFields) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Finalizing setup failed")
      setStep("complete")
      setTimeout(onClose, 2000) // Close modal after 2 seconds
    } catch (err: any) {
      setError(err.message)
      setStep("field-selection") // Go back if finalize fails
    }
  }

  const toggleField = (field: string) => {
    const newSelection = new Set(selectedFields)
    if (newSelection.has(field)) {
      newSelection.delete(field)
    } else {
      newSelection.add(field)
    }
    setSelectedFields(newSelection)
  }

  const filteredFields = useMemo(() => {
    if (!searchQuery) return availableFields
    return availableFields.filter((field) => field.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [availableFields, searchQuery])

  const renderStep = () => {
    switch (step) {
      case "registration":
        return (
          <form onSubmit={handleSubmit(handleRegistration)} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Register with Qualys to enable SSL scanning. This is a one-time setup.
            </p>
            {error && <div className="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                <input {...register("firstName")} className="input-class" />
                {errors.firstName && <p className="error-class">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                <input {...register("lastName")} className="input-class" />
                {errors.lastName && <p className="error-class">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organization</label>
              <input {...register("organization")} className="input-class" />
              {errors.organization && <p className="error-class">{errors.organization.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Work Email</label>
              <input {...register("email")} className="input-class" placeholder="user@yourcompany.com" />
              {errors.email && <p className="error-class">{errors.email.message}</p>}
            </div>
            <div className="pt-4 flex justify-end">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? "Registering..." : "Register & Continue"}
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            </div>
          </form>
        )
      case "field-selection":
        return (
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Select Data to Store</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Choose which fields from the scan results you want to save in your database for privacy and efficiency.
            </p>
            {availableFields.length === 0 ? (
              <div className="text-center py-12">
                <div className="loader"></div>
                <p className="mt-4 text-sm text-gray-500">
                  Fetching sample data from Qualys... this may take a minute.
                </p>
              </div>
            ) : (
              <>
                <div className="my-4 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fields..."
                    className="w-full pl-9 input-class"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                  {filteredFields.map((field) => (
                    <label
                      key={field}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.has(field)}
                        onChange={() => toggleField(field)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{field}</span>
                    </label>
                  ))}
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {selectedFields.size} of {availableFields.length} fields selected
                  </p>
                  <button onClick={handleFinalizeSetup} className="btn-primary">
                    Confirm & Start Scans
                  </button>
                </div>
              </>
            )}
          </div>
        )
      case "processing":
        return (
          <div className="text-center py-12">
            <div className="loader"></div>
            <p className="mt-4 text-sm text-gray-500">
              Setup complete! Running initial scans for all your applications. This may take several minutes. You can
              safely close this window.
            </p>
          </div>
        )
      case "complete":
        return (
          <div className="text-center py-12">
            <CheckIcon className="h-12 w-12 text-green-500 mx-auto" />
            <p className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Integration Connected!</p>
            <p className="text-sm text-gray-500">Qualys SSL Labs is now active.</p>
          </div>
        )
    }
  }

  return <div className="wizard-container">{renderStep()}</div>
}

// Add some base styles to globals.css or a style tag if needed
// .input-class { ... }
// .error-class { ... }
// .btn-primary { ... }
// .loader { ... }
