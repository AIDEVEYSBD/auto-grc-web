"use client"
import { Fragment, useState, type FormEvent } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, ArrowDownTrayIcon, CheckIcon } from "@heroicons/react/24/outline"
import type { Framework } from "@/types"

interface ExportMappingsModalProps {
  isOpen: boolean
  onClose: () => void
  frameworks: Framework[]
}

export default function ExportMappingsModal({ isOpen, onClose, frameworks }: ExportMappingsModalProps) {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFrameworkToggle = (frameworkName: string) => {
    setSelectedFrameworks((prev) =>
      prev.includes(frameworkName) ? prev.filter((name) => name !== frameworkName) : [...prev, frameworkName],
    )
  }

  const handleClose = () => {
    setSelectedFrameworks([])
    setIsLoading(false)
    setError(null)
    setSuccess(false)
    onClose()
  }

  const handleExport = async (e: FormEvent) => {
    e.preventDefault()

    if (selectedFrameworks.length < 2) {
      setError("Please select at least 2 frameworks to generate mappings report.")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("https://export-lyrk.onrender.com/api/framework-mappings/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frameworks: selectedFrameworks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to export mappings")
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url

      // Extract filename from response headers or create default
      const contentDisposition = response.headers.get("content-disposition")
      let filename = `Framework_Mapping_Report_${selectedFrameworks.join("_vs_")}_${new Date().toISOString().split("T")[0]}.xlsx`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during export.")
    } finally {
      setIsLoading(false)
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl glass-card p-6 text-left align-middle shadow-xl transition-all">
                {success ? (
                  // Success View
                  <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Export Successful</h3>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>Your framework mappings report has been downloaded successfully.</p>
                    </div>
                  </div>
                ) : (
                  // Form View
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                        Export Framework Mappings
                      </Dialog.Title>
                      <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleExport} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Select Frameworks to Export (minimum 2)
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {frameworks.map((framework) => (
                            <label
                              key={framework.id}
                              className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedFrameworks.includes(framework.name)}
                                onChange={() => handleFrameworkToggle(framework.name)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div className="ml-3 flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {framework.name}
                                  {framework.master && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Master
                                    </span>
                                  )}
                                </div>
                                {framework.version && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Version: {framework.version}
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Selected: {selectedFrameworks.length} framework{selectedFrameworks.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      )}

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isLoading || selectedFrameworks.length < 2}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          {isLoading ? "Exporting..." : "Export Mappings"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
