"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { CogIcon, XMarkIcon, GlobeAltIcon } from "@heroicons/react/24/outline"
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid"
import type { Integration } from "@/types"

interface QualysSSLConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: QualysSSLConfig) => void
  integration: Integration | null
  isProcessing?: boolean
}

interface QualysSSLConfig {
  endpoint: string
  domains: string[]
  options: {
    publish: boolean
    maxAge: number
    fromCache: boolean
    ignoreMismatch: boolean
  }
  notifications: {
    email: string
    threshold: string
  }
}

export default function QualysSSLConfigModal({
  isOpen,
  onClose,
  onSave,
  integration,
  isProcessing = false,
}: QualysSSLConfigModalProps) {
  const [config, setConfig] = useState<QualysSSLConfig>({
    endpoint: "",
    domains: [""],
    options: {
      publish: false,
      maxAge: 24,
      fromCache: false,
      ignoreMismatch: false,
    },
    notifications: {
      email: "",
      threshold: "B",
    },
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (integration) {
      setConfig({
        endpoint: integration.endpoint || "",
        domains: integration.config?.domains || [""],
        options: {
          publish: integration.config?.options?.publish || false,
          maxAge: integration.config?.options?.maxAge || 24,
          fromCache: integration.config?.options?.fromCache || false,
          ignoreMismatch: integration.config?.options?.ignoreMismatch || false,
        },
        notifications: {
          email: integration.config?.notifications?.email || "",
          threshold: integration.config?.notifications?.threshold || "B",
        },
      })
      setErrors({})
    }
  }, [integration])

  const validateConfig = () => {
    const newErrors: Record<string, string> = {}

    if (!config.endpoint.trim()) {
      newErrors.endpoint = "Endpoint URL is required"
    } else {
      try {
        new URL(config.endpoint)
      } catch {
        newErrors.endpoint = "Please enter a valid URL"
      }
    }

    const validDomains = config.domains.filter((d) => d.trim())
    if (validDomains.length === 0) {
      newErrors.domains = "At least one domain is required"
    }

    if (config.notifications.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.notifications.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateConfig()) {
      onSave(config)
    }
  }

  const addDomain = () => {
    setConfig((prev) => ({
      ...prev,
      domains: [...prev.domains, ""],
    }))
  }

  const removeDomain = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      domains: prev.domains.filter((_, i) => i !== index),
    }))
  }

  const updateDomain = (index: number, value: string) => {
    setConfig((prev) => ({
      ...prev,
      domains: prev.domains.map((domain, i) => (i === index ? value : domain)),
    }))
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  if (!integration || integration.id !== "b3f4ff74-56c1-4321-b137-690b939e454a") return null

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <CogIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Configure Qualys SSL Labs
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

                <div className="space-y-6">
                  {/* Endpoint Configuration */}
                  <div>
                    <label
                      htmlFor="endpoint"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      API Endpoint URL
                    </label>
                    <input
                      type="url"
                      id="endpoint"
                      value={config.endpoint}
                      onChange={(e) => setConfig((prev) => ({ ...prev, endpoint: e.target.value }))}
                      placeholder="https://api.ssllabs.com/api/v3/analyze"
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.endpoint ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                      }`}
                      disabled={isProcessing}
                    />
                    {errors.endpoint && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.endpoint}</p>
                    )}
                  </div>

                  {/* Domains Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Domains to Analyze
                      </label>
                      <button
                        type="button"
                        onClick={addDomain}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={isProcessing}
                      >
                        <PlusIcon className="h-3 w-3" />
                        Add Domain
                      </button>
                    </div>
                    <div className="space-y-2">
                      {config.domains.map((domain, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <GlobeAltIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={domain}
                            onChange={(e) => updateDomain(index, e.target.value)}
                            placeholder="example.com"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isProcessing}
                          />
                          {config.domains.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDomain(index)}
                              className="p-1 text-red-600 hover:text-red-800"
                              disabled={isProcessing}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.domains && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.domains}</p>}
                  </div>

                  {/* Analysis Options */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Analysis Options</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.options.publish}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, publish: e.target.checked },
                            }))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isProcessing}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Publish results</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.options.fromCache}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, fromCache: e.target.checked },
                            }))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isProcessing}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Use cached results</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.options.ignoreMismatch}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, ignoreMismatch: e.target.checked },
                            }))
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isProcessing}
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Ignore cert mismatch</span>
                      </label>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max age (hours)</label>
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={config.options.maxAge}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, maxAge: Number.parseInt(e.target.value) || 24 },
                            }))
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Notifications</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Email (optional)</label>
                        <input
                          type="email"
                          value={config.notifications.email}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              notifications: { ...prev.notifications, email: e.target.value },
                            }))
                          }
                          placeholder="admin@company.com"
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.email ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"
                          }`}
                          disabled={isProcessing}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Alert threshold</label>
                        <select
                          value={config.notifications.threshold}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              notifications: { ...prev.notifications, threshold: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isProcessing}
                        >
                          <option value="A+">A+ or below</option>
                          <option value="A">A or below</option>
                          <option value="B">B or below</option>
                          <option value="C">C or below</option>
                          <option value="D">D or below</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
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
