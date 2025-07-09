"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { CogIcon, XMarkIcon } from "@heroicons/react/24/outline"
import type { Integration } from "@/types"

interface ReconfigureModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (endpoint: string) => void
  integration: Integration | null
  isProcessing?: boolean
}

export default function ReconfigureModal({
  isOpen,
  onClose,
  onSave,
  integration,
  isProcessing = false,
}: ReconfigureModalProps) {
  const [endpoint, setEndpoint] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (integration) {
      setEndpoint(integration.endpoint || "")
      setError("")
    }
  }, [integration])

  const validateUrl = (url: string) => {
    if (!url.trim()) {
      return "Endpoint URL is required"
    }
    try {
      new URL(url)
      return ""
    } catch {
      return "Please enter a valid URL"
    }
  }

  const handleSave = () => {
    const validationError = validateUrl(endpoint)
    if (validationError) {
      setError(validationError)
      return
    }
    setError("")
    onSave(endpoint.trim())
  }

  const handleClose = () => {
    setError("")
    onClose()
  }

  if (!integration) return null

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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <CogIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Configure {integration.name}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isProcessing}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endpoint URL
                  </label>
                  <input
                    type="url"
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => {
                      setEndpoint(e.target.value)
                      if (error) setError("")
                    }}
                    placeholder="https://api.example.com/webhook"
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      error ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={isProcessing}
                  />
                  {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This endpoint will be called when you run the tool. Make sure it's accessible and accepts POST
                    requests.
                  </p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    onClick={handleClose}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    onClick={handleSave}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Saving..." : "Save Configuration"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
