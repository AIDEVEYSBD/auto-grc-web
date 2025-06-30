"use client"

import { Fragment, useState, useMemo } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import type { Integration, MarketplaceTool } from "@/types"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTool: (tool: MarketplaceTool) => void
  integrations: Integration[]
}

// This list represents all tools available in the marketplace catalog.
const availableMarketplaceTools: Omit<MarketplaceTool, "id">[] = [
  {
    name: "Splunk Enterprise",
    category: "SIEM",
    description: "Enterprise SIEM platform for security monitoring and analytics.",
    logo: "/placeholder.svg?width=40&height=40&text=Splunk",
  },
  {
    name: "IBM QRadar",
    category: "SIEM",
    description: "IBM's security intelligence platform for threat detection and response.",
    logo: "/placeholder.svg?width=40&height=40&text=QRadar",
  },
  {
    name: "CrowdStrike Falcon",
    category: "EDR / Endpoint Protection",
    description: "Cloud-native endpoint protection platform with threat intelligence.",
    logo: "/placeholder.svg?width=40&height=40&text=Falcon",
  },
  {
    name: "SentinelOne",
    category: "EDR / Endpoint Protection",
    description: "AI-powered endpoint security platform for prevention and detection.",
    logo: "/placeholder.svg?width=40&height=40&text=S1",
  },
  {
    name: "Nessus",
    category: "Vulnerability Management",
    description: "The #1 vulnerability assessment solution for security practitioners.",
    logo: "/placeholder.svg?width=40&height=40&text=Nessus",
  },
  {
    name: "Okta",
    category: "Identity Management",
    description: "Identity and access management to secure your users and data.",
    logo: "/placeholder.svg?width=40&height=40&text=Okta",
  },
]

export default function MarketplaceModal({ isOpen, onClose, onAddTool, integrations }: MarketplaceModalProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const installedToolNames = useMemo(() => new Set(integrations.map((i) => i.name)), [integrations])

  const toolsWithId = useMemo(
    () => availableMarketplaceTools.map((tool, index) => ({ ...tool, id: `tool-${index}` })),
    [],
  )

  const filteredTools = useMemo(() => {
    if (!searchQuery) return toolsWithId
    return toolsWithId.filter(
      (tool) =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [searchQuery, toolsWithId])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                      Security Tool Marketplace
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Discover and integrate cybersecurity tools to enhance your security posture
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative mb-6">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tools, vendors, or features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
                  {filteredTools.map((tool) => {
                    const isInstalled = installedToolNames.has(tool.name)
                    return (
                      <div key={tool.id} className="glass-card p-4 flex flex-col">
                        <div className="flex items-start gap-4 mb-3">
                          <img
                            src={tool.logo || "/placeholder.svg"}
                            alt={`${tool.name} logo`}
                            className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{tool.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{tool.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow mb-4">{tool.description}</p>
                        <div className="flex justify-end">
                          {isInstalled ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg">
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              Installed
                            </div>
                          ) : (
                            <button
                              onClick={() => onAddTool(tool)}
                              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Add Tool
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
