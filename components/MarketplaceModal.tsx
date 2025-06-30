"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, MagnifyingGlassIcon, ChevronDownIcon, StarIcon } from "@heroicons/react/24/outline"
import QualysIntegrationModal from "./QualysIntegrationModal"
import type { Integration } from "@/types"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  onIntegrationAdded: (integration: Integration) => void
}

const mockIntegrations = [
  {
    id: "qualys-ssl-labs",
    name: "Qualys SSL Labs",
    vendor: "Qualys",
    description: "Free SSL/TLS configuration analysis and security testing",
    rating: 4.8,
    reviews: 1250,
    pricing: "Free",
    setupTime: "2-3 minutes",
    tags: ["SSL", "TLS", "Security", "+2"],
    popular: true,
    recommended: true,
  },
  {
    id: "splunk",
    name: "Splunk",
    vendor: "Splunk Inc.",
    description: "Leading SIEM platform for security monitoring, analytics, and threat detection",
    rating: 4.5,
    reviews: 2847,
    pricing: "Paid",
    setupTime: "2-4 hours",
    tags: ["SIEM", "Analytics", "Enterprise"],
    popular: true,
    recommended: false,
  },
  {
    id: "splunk-enterprise",
    name: "Splunk Enterprise",
    vendor: "Splunk Inc.",
    description: "Search, monitor, and analyze machine-generated data",
    rating: 4.5,
    reviews: 890,
    pricing: "Enterprise",
    setupTime: "15-30 minutes",
    tags: ["SIEM", "Analytics", "Monitoring", "+1"],
    popular: true,
    recommended: false,
  },
  {
    id: "crowdstrike-falcon",
    name: "CrowdStrike Falcon",
    vendor: "CrowdStrike",
    description: "AI-powered endpoint protection and threat intelligence",
    rating: 4.7,
    reviews: 650,
    pricing: "Paid",
    setupTime: "10-15 minutes",
    tags: ["EDR", "AI", "Threat Intelligence", "+1"],
    popular: true,
    recommended: true,
  },
  {
    id: "qualys-vmdr",
    name: "Qualys VMDR",
    vendor: "Qualys",
    description: "Vulnerability Management, Detection and Response",
    rating: 4.4,
    reviews: 380,
    pricing: "Paid",
    setupTime: "15-25 minutes",
    tags: ["Vulnerability", "Scanning", "Risk Management"],
    popular: false,
    recommended: false,
  },
  {
    id: "microsoft-sentinel",
    name: "Microsoft Sentinel",
    vendor: "Microsoft",
    description: "Cloud-native SIEM and SOAR solution",
    rating: 4.3,
    reviews: 420,
    pricing: "Paid",
    setupTime: "20-45 minutes",
    tags: ["SIEM", "SOAR", "Cloud", "+1"],
    popular: false,
    recommended: true,
  },
]

export default function MarketplaceModal({ isOpen, onClose, onIntegrationAdded }: MarketplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedPricing, setSelectedPricing] = useState("All Pricing")
  const [isQualysModalOpen, setIsQualysModalOpen] = useState(false)

  const filteredIntegrations = mockIntegrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.vendor.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === "All Categories" ||
      integration.tags.some((tag) => tag.toLowerCase().includes(selectedCategory.toLowerCase()))

    const matchesPricing =
      selectedPricing === "All Pricing" || integration.pricing.toLowerCase() === selectedPricing.toLowerCase()

    return matchesSearch && matchesCategory && matchesPricing
  })

  const handleToolClick = (toolId: string) => {
    if (toolId === "qualys-ssl-labs") {
      setIsQualysModalOpen(true)
    } else {
      // Handle other integrations
      console.log("Integration not implemented yet:", toolId)
    }
  }

  const handleScanInitiated = ({
    host,
    email,
    initialData,
  }: {
    host: string
    email: string
    initialData: any
  }) => {
    const newIntegration: Integration = {
      id: `qualys-ssl-${Date.now()}`,
      category: "SSL/TLS Analysis",
      name: `Qualys SSL Labs - ${host}`,
      status: "pending",
      last_sync: new Date().toISOString(),
      datapoints: 0,
      data: {
        host,
        email,
        scanStatus: initialData.status,
        statusMessage: initialData.statusMessage,
      },
      selectedFields: [],
    }

    onIntegrationAdded(newIntegration)
    setIsQualysModalOpen(false)
    onClose() // Close the main marketplace modal as well
  }

  const getPricingColor = (pricing: string) => {
    switch (pricing.toLowerCase()) {
      case "free":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
      case "paid":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
      case "enterprise":
        return "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400"
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  return (
    <>
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
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                        Security Tool Marketplace
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search tools, vendors, or features..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="appearance-none px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>All Categories</option>
                          <option>SIEM</option>
                          <option>EDR</option>
                          <option>Vulnerability</option>
                          <option>SSL</option>
                        </select>
                        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>

                      <div className="relative">
                        <select
                          value={selectedPricing}
                          onChange={(e) => setSelectedPricing(e.target.value)}
                          className="appearance-none px-4 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option>All Pricing</option>
                          <option>Free</option>
                          <option>Paid</option>
                          <option>Enterprise</option>
                        </select>
                        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Tools Grid */}
                  <div className="p-6 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredIntegrations.map((integration) => (
                        <div
                          key={integration.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                        >
                          {/* Header with badges */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {integration.name}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{integration.vendor}</p>
                            </div>
                            <div className="flex gap-1">
                              {integration.popular && (
                                <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded font-medium">
                                  Popular
                                </span>
                              )}
                              {integration.recommended && (
                                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded font-medium">
                                  Recommended
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {integration.description}
                          </p>

                          {/* Rating and Pricing */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {integration.rating}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">({integration.reviews})</span>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded font-medium ${getPricingColor(integration.pricing)}`}
                            >
                              {integration.pricing}
                            </span>
                          </div>

                          {/* Setup time */}
                          <div className="flex items-center gap-1 mb-3">
                            <svg
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{integration.setupTime}</span>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {integration.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Add Tool Button */}
                          <button
                            onClick={() => handleToolClick(integration.id)}
                            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Add Tool
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Qualys Integration Modal */}
      <QualysIntegrationModal
        isOpen={isQualysModalOpen}
        onClose={() => setIsQualysModalOpen(false)}
        onScanInitiated={handleScanInitiated}
      />
    </>
  )
}
