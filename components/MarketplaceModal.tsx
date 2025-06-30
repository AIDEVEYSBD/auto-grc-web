"use client"

import { useState, useMemo } from "react"
import { XMarkIcon, MagnifyingGlassIcon, StarIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon } from "@heroicons/react/24/solid"
import type { Integration } from "@/types"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  integrations: Integration[]
}

// Mock marketplace data with tools that might be in your integrations table
const marketplaceTools = [
  {
    id: "splunk",
    name: "Splunk Enterprise",
    category: "SIEM",
    description: "Enterprise SIEM platform for security monitoring and analytics",
    rating: 4.5,
    reviews: 1250,
    logo: "/placeholder.svg?height=40&width=40&text=S",
  },
  {
    id: "qradar",
    name: "IBM QRadar",
    category: "SIEM",
    description: "IBM's security intelligence platform",
    rating: 4.2,
    reviews: 890,
    logo: "/placeholder.svg?height=40&width=40&text=Q",
  },
  {
    id: "crowdstrike",
    name: "CrowdStrike Falcon",
    category: "EDR",
    description: "Cloud-native endpoint protection platform",
    rating: 4.7,
    reviews: 2100,
    logo: "/placeholder.svg?height=40&width=40&text=C",
  },
  {
    id: "sentinelone",
    name: "SentinelOne",
    category: "Endpoint Protection",
    description: "AI-powered endpoint security platform",
    rating: 4.6,
    reviews: 1800,
    logo: "/placeholder.svg?height=40&width=40&text=S1",
  },
  {
    id: "rapid7",
    name: "Rapid7 InsightVM",
    category: "Vulnerability Management",
    description: "Vulnerability management and assessment platform",
    rating: 4.3,
    reviews: 650,
    logo: "/placeholder.svg?height=40&width=40&text=R7",
  },
  {
    id: "okta",
    name: "Okta",
    category: "Identity Management",
    description: "Identity and access management platform",
    rating: 4.4,
    reviews: 1500,
    logo: "/placeholder.svg?height=40&width=40&text=O",
  },
]

export default function MarketplaceModal({ isOpen, onClose, integrations }: MarketplaceModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", ...new Set(marketplaceTools.map((tool) => tool.category))]

  const filteredTools = useMemo(() => {
    return marketplaceTools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  const isToolInstalled = (toolName: string) => {
    return integrations.some((integration) => integration.name === toolName)
  }

  const getToolStatus = (toolName: string) => {
    const integration = integrations.find((integration) => integration.name === toolName)
    return integration?.is_connected ? "Connected" : "Installed"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Marketplace</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Discover and integrate cybersecurity tools</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
          </div>

          {/* Tools Grid */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTools.map((tool) => (
                <div key={tool.id} className="glass-card p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <img
                      src={tool.logo || "/placeholder.svg"}
                      alt={`${tool.name} logo`}
                      className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{tool.category}</p>
                        </div>

                        {isToolInstalled(tool.name) ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded-full">
                            <CheckCircleIcon className="h-3 w-3" />
                            {getToolStatus(tool.name)}
                          </div>
                        ) : (
                          <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Add Tool
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{tool.description}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{tool.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({tool.reviews.toLocaleString()} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTools.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No tools found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
