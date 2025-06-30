"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from "@heroicons/react/24/solid"
import type { Integration } from "@/types"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  integrations: Integration[]
}

const marketplaceTools = [
  {
    name: "Splunk Enterprise",
    category: "SIEM",
    description: "Enterprise SIEM platform for security monitoring and analytics",
    rating: 4.8,
    reviews: 1250,
    price: "Enterprise",
    logo: "🔍",
  },
  {
    name: "IBM QRadar",
    category: "SIEM",
    description: "IBM's security intelligence platform",
    rating: 4.5,
    reviews: 890,
    price: "Enterprise",
    logo: "🛡️",
  },
  {
    name: "CrowdStrike Falcon",
    category: "EDR / Endpoint Protection",
    description: "Cloud-native endpoint protection platform",
    rating: 4.9,
    reviews: 2100,
    price: "Paid",
    logo: "🦅",
  },
  {
    name: "SentinelOne",
    category: "EDR / Endpoint Protection",
    description: "AI-powered endpoint security platform",
    rating: 4.7,
    reviews: 1680,
    price: "Paid",
    logo: "🤖",
  },
  {
    name: "Qualys VMDR",
    category: "Vulnerability Management",
    description: "Vulnerability Management, Detection and Response",
    rating: 4.4,
    reviews: 750,
    price: "Paid",
    logo: "🔍",
  },
  {
    name: "Rapid7 InsightVM",
    category: "Vulnerability Management",
    description: "Vulnerability risk management solution",
    rating: 4.3,
    reviews: 620,
    price: "Paid",
    logo: "⚡",
  },
]

export default function MarketplaceModal({ isOpen, onClose, integrations }: MarketplaceModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", ...new Set(marketplaceTools.map((tool) => tool.category))]

  const filteredTools = marketplaceTools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getToolStatus = (toolName: string) => {
    const integration = integrations.find((i) => i.name === toolName)
    return integration?.status || "not_installed"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case "disconnected":
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getActionButton = (tool: any) => {
    const status = getToolStatus(tool.name)

    if (status === "connected") {
      return (
        <button disabled className="px-4 py-2 bg-green-100 text-green-800 font-medium rounded-lg cursor-not-allowed">
          Installed
        </button>
      )
    }

    return (
      <button
        onClick={() => {
          // Placeholder for add tool functionality
          console.log(`Adding ${tool.name}`)
        }}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add Tool
      </button>
    )
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900 dark:text-white">
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
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tools, vendors, or features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === category
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tool Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
                  {filteredTools.map((tool) => {
                    const status = getToolStatus(tool.name)
                    return (
                      <div key={tool.name} className="glass-card p-6 flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{tool.logo}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{tool.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{tool.category}</p>
                            </div>
                          </div>
                          {getStatusIcon(status)}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">{tool.description}</p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tool.rating}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({tool.reviews})</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{tool.price}</span>
                        </div>

                        <div className="flex justify-end">{getActionButton(tool)}</div>
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
