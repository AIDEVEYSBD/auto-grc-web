"use client"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
}

const mockIntegrations = [
  {
    id: "1",
    name: "AWS Security Hub",
    category: "Cloud Security",
    description: "Centralized security findings from AWS services",
    logo: "☁️",
    popular: true,
  },
  {
    id: "2",
    name: "Splunk SIEM",
    category: "SIEM",
    description: "Security information and event management platform",
    logo: "🔍",
    popular: true,
  },
  {
    id: "3",
    name: "Okta Identity",
    category: "Identity Management",
    description: "Identity and access management solution",
    logo: "🔐",
    popular: false,
  },
  {
    id: "4",
    name: "CrowdStrike Falcon",
    category: "Endpoint Security",
    description: "Cloud-native endpoint protection platform",
    logo: "🛡️",
    popular: true,
  },
  {
    id: "5",
    name: "Qualys VMDR",
    category: "Vulnerability Management",
    description: "Vulnerability management, detection and response",
    logo: "🔧",
    popular: false,
  },
]

export default function MarketplaceModal({ isOpen, onClose }: MarketplaceModalProps) {
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl glass-card p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Integration Marketplace
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockIntegrations.map((integration) => (
                    <div
                      key={integration.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.logo}</span>
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{integration.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{integration.category}</p>
                          </div>
                        </div>
                        {integration.popular && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                            Popular
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{integration.description}</p>

                      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        <PlusIcon className="h-4 w-4" />
                        Add Integration
                      </button>
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
