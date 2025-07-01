"use client"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import QualysSetupWizard from "./QualysSetupWizard"
import type { Integration } from "@/types"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tool: Integration | null
}

const QUALYS_SSL_LABS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

const GenericPlaceholder = ({ tool }: { tool: Integration }) => (
  <div className="text-center py-8">
    <p className="text-gray-600 dark:text-gray-400">
      Connection functionality for <span className="font-semibold text-gray-900 dark:text-white">{tool.name}</span> is
      not yet implemented.
    </p>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
                <div className="flex items-start justify-between">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    Connect to {tool.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4">
                  {isQualysTool ? (
                    <QualysSetupWizard tool={tool} onClose={onClose} />
                  ) : (
                    <GenericPlaceholder tool={tool} />
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
