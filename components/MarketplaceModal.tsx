"use client"

import type React from "react"

import { Fragment, useState, useMemo } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline"
import {
  ShieldCheckIcon,
  EyeIcon,
  BugAntIcon,
  UserGroupIcon,
  CloudIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon,
  KeyIcon,
} from "@heroicons/react/24/solid"
import type { Integration } from "@/types"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  onAddTool: (tool: Integration) => void
  integrations: Integration[]
}

// Category icons mapping
const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SIEM: EyeIcon,
  "EDR / Endpoint Protection": ShieldCheckIcon,
  "Vulnerability Management": BugAntIcon,
  "Identity Management": UserGroupIcon,
  "Cloud Security": CloudIcon,
  "Network Security": CpuChipIcon,
  Compliance: DocumentMagnifyingGlassIcon,
  Encryption: KeyIcon,
}

export default function MarketplaceModal({ isOpen, onClose, onAddTool, integrations }: MarketplaceModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Filter integrations to show only those that are NOT connected (i.e., available in marketplace)
  const availableMarketplaceTools = useMemo(() => integrations.filter((tool) => !tool["is-connected"]), [integrations])

  // Get unique categories from available tools
  const availableCategories = useMemo(() => {
    const categories = Array.from(new Set(availableMarketplaceTools.map((tool) => tool.category)))
    return categories.sort()
  }, [availableMarketplaceTools])

  const filteredTools = useMemo(() => {
    let filtered = availableMarketplaceTools

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((tool) => tool.category === selectedCategory)
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          tool.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    return filtered
  }, [searchQuery, selectedCategory, availableMarketplaceTools])

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category] || ShieldCheckIcon
    return <IconComponent className="h-5 w-5" />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-white">
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

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tools, vendors, or features..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FunnelIcon className="h-5 w-5 text-gray-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Categories</option>
                        {availableCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
                    {filteredTools.length > 0 ? (
                      filteredTools.map((tool) => (
                        <div key={tool.id} className="glass-card p-4 flex flex-col hover:shadow-lg transition-shadow">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                              {getCategoryIcon(tool.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{tool.name}</h4>
                              <div className="flex items-center gap-1 mt-1">
                                {getCategoryIcon(tool.category)}
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{tool.category}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow mb-4 line-clamp-3">
                            {tool.description ||
                              `A comprehensive ${tool.category.toLowerCase()} solution for enhanced security management.`}
                          </p>
                          <div className="flex justify-end">
                            <button
                              onClick={() => onAddTool(tool)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                            >
                              Add Tool
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                          <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">No tools found</h3>
                            <p className="text-sm">
                              {searchQuery || selectedCategory !== "all"
                                ? "Try adjusting your search or filter criteria."
                                : "All available tools have been connected."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {filteredTools.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Showing {filteredTools.length} of {availableMarketplaceTools.length} available tools
                      </p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
