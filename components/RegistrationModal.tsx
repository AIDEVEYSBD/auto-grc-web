"use client"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import QualysRegistrationForm from "./QualysRegistrationForm"
import type { Integration } from "@/types"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tool: Integration | null
}

const QUALYS_SSL_LABS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

// A generic placeholder form for other integrations
const GenericPlaceholderForm = ({ tool, onClose }: { tool: Integration; onClose: () => void }) => (
  <div className="text-center">
    <p className="text-gray-600 dark:text-gray-400">
      Connection functionality for <span className="font-semibold text-gray-900 dark:text-white">{tool.name}</span> is
      not yet implemented.
    </p>
    <button
      onClick={onClose}
      className="mt-6 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      Close
    </button>
  </div>
)

export default function RegistrationModal({ isOpen, onClose, tool }: RegistrationModalProps) {
  if (!tool) return null

  const isQualysTool = tool.id === QUALYS_SSL_LABS_ID

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                      Connect to {tool.name}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {isQualysTool
                        ? "Enter your details and a hostname to run an SSL Labs scan."
                        : "Enter your credentials to connect your account."}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                {isQualysTool ? (
                  <QualysRegistrationForm tool={tool} onClose={onClose} />
                ) : (
                  <GenericPlaceholderForm tool={tool} onClose={onClose} />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
