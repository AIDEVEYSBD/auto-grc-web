"use client"

import { useState, useTransition } from "react"
import { useFormState } from "react-dom"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, CheckCircleIcon, ArrowPathIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline"
import { registerAndFetchSchema, customizeSchemaAndRunAssessments } from "@/app/integrations/qualys/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface QualysRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = "form" | "schema" | "progress" | "done" | "error"

const initialState = { success: false, error: null, keys: [], email: null, fieldErrors: {} }

export default function QualysRegistrationModal({ isOpen, onClose }: QualysRegistrationModalProps) {
  const [step, setStep] = useState<Step>("form")
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [formState, formAction] = useFormState(registerAndFetchSchema, initialState)
  const [isPending, startTransition] = useTransition()
  const [bulkState, setBulkState] = useState<{ loading: boolean; error?: string | null }>({
    loading: false,
    error: null,
  })

  const handleFormSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await registerAndFetchSchema(null, formData)
      if (result.success) {
        formState.keys = result.keys
        formState.email = result.email
        setStep("schema")
      } else {
        formState.error = result.error
        formState.fieldErrors = result.fieldErrors || {}
      }
    })
  }

  const handleKeySelection = (key: string) => {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const handleSchemaSubmit = () => {
    setStep("progress")
    setBulkState({ loading: true, error: null })
    startTransition(async () => {
      const result = await customizeSchemaAndRunAssessments({
        selectedKeys,
        email: formState.email!,
      })
      if (result.success) {
        setStep("done")
      } else {
        setBulkState({ loading: false, error: result.error })
        setStep("error")
      }
    })
  }

  const resetAndClose = () => {
    setStep("form")
    setSelectedKeys([])
    onClose()
    // This is a good place to trigger a refresh of the integrations page data
    window.location.reload()
  }

  return (
    <Transition appear show={isOpen} as="div">
      <Dialog as="div" className="relative z-50" onClose={resetAndClose}>
        <Transition.Child
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
              as="div"
              className="w-full max-w-2xl"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    Connect to Qualys SSL Labs
                  </Dialog.Title>
                  <button onClick={resetAndClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                {step === "form" && (
                  <form action={handleFormSubmit} className="mt-4 space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Register with Qualys to enable the integration. Please use your corporate email.
                    </p>
                    {/* Form fields */}
                    {/* ... (firstName, lastName, email, organization) ... */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" required />
                        {formState.fieldErrors?.firstName && (
                          <p className="text-red-500 text-sm mt-1">{formState.fieldErrors.firstName[0]}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" required />
                        {formState.fieldErrors?.lastName && (
                          <p className="text-red-500 text-sm mt-1">{formState.fieldErrors.lastName[0]}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="organization">Organization</Label>
                      <Input id="organization" name="organization" required />
                      {formState.fieldErrors?.organization && (
                        <p className="text-red-500 text-sm mt-1">{formState.fieldErrors.organization[0]}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" required />
                      {formState.fieldErrors?.email && (
                        <p className="text-red-500 text-sm mt-1">{formState.fieldErrors.email[0]}</p>
                      )}
                    </div>
                    {formState.error && <p className="text-red-500 text-sm">{formState.error}</p>}
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "Registering..." : "Register & Continue"}
                      </Button>
                    </div>
                  </form>
                )}

                {step === "schema" && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Select the data points you want to store from the SSL Labs assessment. These will be added as
                      columns to your database.
                    </p>
                    <div className="max-h-80 overflow-y-auto space-y-2 rounded-md border p-4 dark:border-gray-700">
                      {formState.keys.map((key) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox id={key} onCheckedChange={() => handleKeySelection(key)} />
                          <label htmlFor={key} className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {key}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSchemaSubmit} disabled={selectedKeys.length === 0}>
                        Save Schema & Run Assessments
                      </Button>
                    </div>
                  </div>
                )}

                {step === "progress" && (
                  <div className="mt-4 text-center py-10">
                    <ArrowPathIcon className="mx-auto h-12 w-12 animate-spin text-blue-500" />
                    <h4 className="mt-4 text-lg font-semibold">Assessment in Progress</h4>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      We are now running SSL assessments for all your applications. This may take several minutes.
                      Please don't close this window.
                    </p>
                  </div>
                )}

                {step === "done" && (
                  <div className="mt-4 text-center py-10">
                    <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                    <h4 className="mt-4 text-lg font-semibold">Integration Complete!</h4>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Your integration with Qualys SSL Labs is now complete. You can start using the data in your
                      dashboard.
                    </p>
                  </div>
                )}

                {step === "error" && (
                  <div className="mt-4 text-center py-10">
                    <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
                    <h4 className="mt-4 text-lg font-semibold">Error Occurred</h4>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      There was an error during the integration process. Please try again.
                    </p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
