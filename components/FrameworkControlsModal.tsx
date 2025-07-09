"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { supabase } from "@/lib/supabase"
import type { Framework, Control } from "@/types"

interface ApplicabilityCategory {
  id: string
  category_name: string
}

interface ControlApplicability {
  control_id: string
  framework_id: string
  applicability_id: string
}

interface FrameworkControlsModalProps {
  isOpen: boolean
  onClose: () => void
  framework: Framework | null
}

export default function FrameworkControlsModal({ isOpen, onClose, framework }: FrameworkControlsModalProps) {
  const [controls, setControls] = useState<Control[]>([])
  const [applicabilityCategories, setApplicabilityCategories] = useState<ApplicabilityCategory[]>([])
  const [controlsApplicability, setControlsApplicability] = useState<ControlApplicability[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && framework) {
      fetchData()
    }
  }, [isOpen, framework])

  const fetchData = async () => {
    if (!framework) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch controls for this framework
      const { data: controlsData, error: controlsError } = await supabase
        .from("controls")
        .select("*")
        .eq("framework_id", framework.id)
        .order("Domain", { ascending: true })

      if (controlsError) throw controlsError

      // Fetch applicability categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("applicability_categories")
        .select("*")
        .order("category_name", { ascending: true })

      if (categoriesError) throw categoriesError

      // Fetch existing controls applicability
      const { data: applicabilityData, error: applicabilityError } = await supabase
        .from("controls_applicability")
        .select("*")
        .eq("framework_id", framework.id)

      if (applicabilityError) throw applicabilityError

      setControls(controlsData || [])
      setApplicabilityCategories(categoriesData || [])
      setControlsApplicability(applicabilityData || [])
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplicabilityChange = async (controlId: string, applicabilityId: string, isChecked: boolean) => {
    if (!framework) return

    try {
      if (isChecked) {
        // Add applicability
        const { error } = await supabase.from("controls_applicability").insert({
          control_id: controlId,
          framework_id: framework.id,
          applicability_id: applicabilityId,
        })

        if (error) throw error

        setControlsApplicability((prev) => [
          ...prev,
          { control_id: controlId, framework_id: framework.id, applicability_id: applicabilityId },
        ])
      } else {
        // Remove applicability
        const { error } = await supabase
          .from("controls_applicability")
          .delete()
          .eq("control_id", controlId)
          .eq("framework_id", framework.id)
          .eq("applicability_id", applicabilityId)

        if (error) throw error

        setControlsApplicability((prev) =>
          prev.filter(
            (ca) =>
              !(
                ca.control_id === controlId &&
                ca.framework_id === framework.id &&
                ca.applicability_id === applicabilityId
              ),
          ),
        )
      }
    } catch (err: any) {
      console.error("Error updating applicability:", err)
      setError(err.message || "Failed to update applicability")
    }
  }

  const isApplicabilityChecked = (controlId: string, applicabilityId: string) => {
    return controlsApplicability.some(
      (ca) =>
        ca.control_id === controlId && ca.framework_id === framework?.id && ca.applicability_id === applicabilityId,
    )
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
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl glass-card p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                      {framework?.name} Controls
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {framework?.version && `Version ${framework.version} • `}
                      {controls.length} controls
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">S.No.</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Control ID</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                            Control Domain
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                            Control Text
                          </th>
                          {applicabilityCategories.map((category) => (
                            <th
                              key={category.id}
                              className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white"
                            >
                              {category.category_name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {controls.map((control, index) => (
                          <tr
                            key={control.id}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-mono">{control.ID}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                              {control.Domain || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white max-w-md">
                              <div className="truncate" title={control.title}>
                                {control.title}
                              </div>
                            </td>
                            {applicabilityCategories.map((category) => (
                              <td key={category.id} className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isApplicabilityChecked(control.id, category.id)}
                                  onChange={(e) => handleApplicabilityChange(control.id, category.id, e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!isLoading && controls.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No controls found for this framework.</p>
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
