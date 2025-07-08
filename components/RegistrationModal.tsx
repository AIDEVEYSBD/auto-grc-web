"use client"

import type React from "react"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import type { MarketplaceTool } from "@/types"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tool: MarketplaceTool | null
}

export default function RegistrationModal({ isOpen, onClose, tool }: RegistrationModalProps) {
  if (!tool) return null

  const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Placeholder for actual registration logic
    console.log(`Registering ${tool.name} with provided credentials...`)
    alert(`This is a placeholder for registering ${tool.name}. Check the console for details.`)
    onClose()
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                      Connect to {tool.name}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Enter your credentials to connect your account.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      API Key
                    </label>
                    <input
                      type="text"
                      id="api-key"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
                      placeholder="Enter your API key"
                    />
                  </div>
                  <div>
                    <label htmlFor="api-secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      API Secret (optional)
                    </label>
                    <input
                      type="password"
                      id="api-secret"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700"
                      placeholder="Enter your API secret"
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
