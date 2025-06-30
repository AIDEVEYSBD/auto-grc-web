"use client"

import type React from "react"

import { Fragment, useState, type FormEvent } from "react"
import { Dialog, Transition, Switch } from "@headlessui/react"
import { XMarkIcon, CloudArrowUpIcon, CheckIcon } from "@heroicons/react/24/outline"

interface UploadFrameworkModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (formData: { name: string; version: string; isMaster: boolean; file: File }) => Promise<any>
}

export default function UploadFrameworkModal({ isOpen, onClose, onUpload }: UploadFrameworkModalProps) {
  const [name, setName] = useState("")
  const [version, setVersion] = useState("")
  const [isMaster, setIsMaster] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleClose = () => {
    // Reset internal state before calling parent's onClose
    setName("")
    setVersion("")
    setIsMaster(false)
    setFile(null)
    setIsLoading(false)
    setError(null)
    setSuccessData(null)
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !file) {
      setError("Framework name and file are required.")
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const result = await onUpload({ name, version, isMaster, file })
      setSuccessData(result) // On success, show the confirmation screen
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl glass-card p-6 text-left align-middle shadow-xl transition-all">
                {successData ? (
                  // Success View
                  <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                      <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Upload Successful</h3>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>{successData.message}</p>
                    </div>
                    <div className="mt-4 w-full bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg text-left text-sm space-y-2">
                      <div>
                        <strong>Framework:</strong> {successData.framework_name}
                      </div>
                      <div>
                        <strong>Controls Added:</strong> {successData.controls_count}
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700"
                        onClick={handleClose}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  // Form View
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                        Upload New Framework
                      </Dialog.Title>
                      <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Form fields... */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., CIS Controls"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Version (Optional)
                        </label>
                        <input
                          type="text"
                          id="version"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., v8"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as Master</span>
                        <Switch
                          checked={isMaster}
                          onChange={setIsMaster}
                          className={`${
                            isMaster ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                        >
                          <span
                            className={`${
                              isMaster ? "translate-x-6" : "translate-x-1"
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </Switch>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Framework File
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  onChange={handleFileChange}
                                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">CSV, XLS, XLSX up to 10MB</p>
                            {file && <p className="text-sm text-green-600 dark:text-green-400 pt-2">{file.name}</p>}
                          </div>
                        </div>
                      </div>

                      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "Uploading..." : "Upload Framework"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
