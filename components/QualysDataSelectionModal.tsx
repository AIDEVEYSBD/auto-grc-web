"use client"

import { Fragment, useState, useMemo, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline"

interface QualysDataSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  data: any
  onSave: (selectedFields: string[]) => void
}

export default function QualysDataSelectionModal({ isOpen, onClose, data, onSave }: QualysDataSelectionModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => new Set(availableFields))

  // Extract all possible field paths from the data
  const availableFields = useMemo(() => {
    const extractFields = (obj: any, prefix = ""): string[] => {
      const fields: string[] = []

      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        Object.keys(obj).forEach((key) => {
          const currentPath = prefix ? `${prefix}.${key}` : key
          const value = obj[key]

          if (value && typeof value === "object" && !Array.isArray(value)) {
            // If it's a nested object, recurse
            fields.push(...extractFields(value, currentPath))
          } else {
            // It's a primitive value or array
            fields.push(currentPath)
          }
        })
      }

      return fields
    }

    return extractFields(data).sort()
  }, [data])

  // Initialize with all fields selected
  useEffect(() => {
    if (availableFields.length > 0 && selectedFields.size === 0) {
      setSelectedFields(new Set(availableFields))
    }
  }, [availableFields])

  const toggleField = (field: string) => {
    const newSelected = new Set(selectedFields)
    if (newSelected.has(field)) {
      newSelected.delete(field)
    } else {
      newSelected.add(field)
    }
    setSelectedFields(newSelected)
  }

  const toggleAll = () => {
    if (selectedFields.size === availableFields.length) {
      setSelectedFields(new Set())
    } else {
      setSelectedFields(new Set(availableFields))
    }
  }

  const handleSave = () => {
    onSave(Array.from(selectedFields))
    onClose()
  }

  const getFieldValue = (fieldPath: string) => {
    const parts = fieldPath.split(".")
    let value = data

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part]
      } else {
        return "N/A"
      }
    }

    if (typeof value === "object") {
      return JSON.stringify(value)
    }

    return String(value || "N/A")
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                      Select Data Fields
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Choose which data fields to include in your integration
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <button
                    onClick={toggleAll}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {selectedFields.size === availableFields.length ? "Deselect All" : "Select All"}
                  </button>
                  <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                    {selectedFields.size} of {availableFields.length} fields selected
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Select
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Field Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Sample Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {availableFields.map((field) => (
                        <tr key={field} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => toggleField(field)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                selectedFields.has(field)
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
                              }`}
                            >
                              {selectedFields.has(field) && <CheckIcon className="h-3 w-3" />}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{field}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs block">
                              {getFieldValue(field)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Integration ({selectedFields.size} fields)
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
