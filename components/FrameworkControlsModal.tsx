"use client"

import { Fragment, useState, useEffect } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, FunnelIcon, CheckIcon, XIcon } from "@heroicons/react/24/outline"
import { supabase } from "@/lib/supabase"
import type { Framework, Control } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  const [filteredControls, setFilteredControls] = useState<Control[]>([])
  const [applicabilityCategories, setApplicabilityCategories] = useState<ApplicabilityCategory[]>([])
  const [controlsApplicability, setControlsApplicability] = useState<ControlApplicability[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [domainFilter, setDomainFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isOpen && framework) {
      fetchData()
    }
  }, [isOpen, framework])

  useEffect(() => {
    // Apply filters
    let filtered = controls

    if (searchTerm) {
      filtered = filtered.filter(
        (control) =>
          control.ID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          control.Controls?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          control.Domain?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (domainFilter !== "all") {
      filtered = filtered.filter((control) => control.Domain === domainFilter)
    }

    setFilteredControls(filtered)
  }, [controls, searchTerm, domainFilter])

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

  const handleSelectAllForCategory = async (applicabilityId: string, selectAll: boolean) => {
    if (!framework) return

    try {
      if (selectAll) {
        // Select all controls for this category
        const controlsToAdd = filteredControls
          .filter((control) => !isApplicabilityChecked(control.id, applicabilityId))
          .map((control) => ({
            control_id: control.id,
            framework_id: framework.id,
            applicability_id: applicabilityId,
          }))

        if (controlsToAdd.length > 0) {
          const { error } = await supabase.from("controls_applicability").insert(controlsToAdd)
          if (error) throw error

          setControlsApplicability((prev) => [...prev, ...controlsToAdd])
        }
      } else {
        // Unselect all controls for this category
        const controlIdsToRemove = filteredControls.map((control) => control.id)

        const { error } = await supabase
          .from("controls_applicability")
          .delete()
          .eq("framework_id", framework.id)
          .eq("applicability_id", applicabilityId)
          .in("control_id", controlIdsToRemove)

        if (error) throw error

        setControlsApplicability((prev) =>
          prev.filter(
            (ca) =>
              !(
                ca.framework_id === framework.id &&
                ca.applicability_id === applicabilityId &&
                controlIdsToRemove.includes(ca.control_id)
              ),
          ),
        )
      }
    } catch (err: any) {
      console.error("Error updating bulk applicability:", err)
      setError(err.message || "Failed to update bulk applicability")
    }
  }

  const isApplicabilityChecked = (controlId: string, applicabilityId: string) => {
    return controlsApplicability.some(
      (ca) =>
        ca.control_id === controlId && ca.framework_id === framework?.id && ca.applicability_id === applicabilityId,
    )
  }

  const getCategorySelectAllState = (applicabilityId: string) => {
    const totalControls = filteredControls.length
    const selectedControls = filteredControls.filter((control) =>
      isApplicabilityChecked(control.id, applicabilityId),
    ).length

    if (selectedControls === 0) return "none"
    if (selectedControls === totalControls) return "all"
    return "some"
  }

  const uniqueDomains = Array.from(new Set(controls.map((control) => control.Domain).filter(Boolean)))

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
              <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                      {framework?.name} Controls
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {framework?.version && `Version ${framework.version} • `}
                      {filteredControls.length} of {controls.length} controls
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <FunnelIcon className="h-4 w-4" />
                      Filters
                    </Button>
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Search Controls
                        </label>
                        <Input
                          type="text"
                          placeholder="Search by Control ID, Text, or Domain..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Filter by Domain
                        </label>
                        <Select value={domainFilter} onValueChange={setDomainFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select domain" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Domains</SelectItem>
                            {uniqueDomains.map((domain) => (
                              <SelectItem key={domain} value={domain || ""}>
                                {domain || "No Domain"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

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
                          {applicabilityCategories.map((category) => {
                            const selectState = getCategorySelectAllState(category.id)
                            return (
                              <th
                                key={category.id}
                                className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white"
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <span>{category.category_name}</span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSelectAllForCategory(category.id, true)}
                                      disabled={selectState === "all"}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <CheckIcon className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSelectAllForCategory(category.id, false)}
                                      disabled={selectState === "none"}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <XIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredControls.map((control, index) => (
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
                              <div className="truncate" title={control.Controls}>
                                {control.Controls || "N/A"}
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

                {!isLoading && filteredControls.length === 0 && controls.length > 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No controls match the current filters.</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("")
                        setDomainFilter("all")
                      }}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
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
