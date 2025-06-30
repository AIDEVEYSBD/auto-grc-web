"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline"

interface QualysIntegrationModalProps {
  isOpen: boolean
  onClose: () => void
  onScanInitiated: (scanDetails: { host: string; email: string; initialData: any }) => void
}

export default function QualysIntegrationModal({ isOpen, onClose, onScanInitiated }: QualysIntegrationModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    testDomain: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    if (isOpen) {
      try {
        const savedDetails = localStorage.getItem("qualysRegDetails")
        if (savedDetails) {
          const parsedDetails = JSON.parse(savedDetails)
          setFormData((prev) => ({ ...prev, ...parsedDetails }))
        }
      } catch (e) {
        console.error("Failed to parse Qualys registration details from localStorage", e)
      }
    }
  }, [isOpen])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleInstall = async () => {
    const { firstName, lastName, email, organization, testDomain } = formData
    if (!firstName || !lastName || !email || !organization || !testDomain) {
      setError("All fields are required.")
      return
    }

    const cleanDomain = testDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Register if needed
      setStatusMessage("Checking registration with Qualys SSL Labs...")
      const regResponse = await fetch("/api/qualys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, organization }),
      })

      const regResult = await regResponse.json()
      if (!regResponse.ok && regResult.status !== "already_registered") {
        throw new Error(regResult.details?.errors?.[0]?.message || regResult.error || "Registration failed")
      }

      setStatusMessage("Registration confirmed. Saving details...")
      localStorage.setItem("qualysRegDetails", JSON.stringify({ firstName, lastName, email, organization }))

      // Step 2: Initiate scan
      setStatusMessage(`Initiating scan for ${cleanDomain}...`)
      const params = new URLSearchParams({
        host: cleanDomain,
        email: formData.email,
        startNew: "on",
      })
      const scanResponse = await fetch(`/api/qualys?${params}`)
      const scanResult = await scanResponse.json()

      if (!scanResponse.ok) {
        throw new Error(scanResult.error || "Failed to start scan")
      }

      // Step 3: Callback and close
      onScanInitiated({ host: cleanDomain, email: formData.email, initialData: scanResult })
      handleClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
      setStatusMessage("")
    }
  }

  const handleClose = () => {
    // Don't clear form data on close, just reset status
    setError(null)
    setStatusMessage("")
    setIsLoading(false)
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                    Install Qualys SSL Labs
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter your first name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter your last name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter your organization email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded mt-1">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Must be a business email (no Gmail, Yahoo, etc.) for registration.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleInputChange("organization", e.target.value)}
                      placeholder="Enter your organization name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Domain to Scan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.testDomain}
                      onChange={(e) => handleInputChange("testDomain", e.target.value)}
                      placeholder="example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Domain to analyze (without https://)
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    </div>
                  )}

                  {statusMessage && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                        <p className="text-sm text-blue-600 dark:text-blue-400">{statusMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInstall}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Working..." : "Start Scan"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
