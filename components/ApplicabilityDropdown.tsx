"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline"
import { useApplicabilityCategories, updateApplicationApplicability } from "@/lib/queries/applicability"
import { mutate } from "swr"
import type { Application, ApplicabilityCategory } from "@/types"

interface ApplicabilityDropdownProps {
  application: Application
  currentApplicability?: ApplicabilityCategory | null
}

export default function ApplicabilityDropdown({ application, currentApplicability }: ApplicabilityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">("bottom")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { data: categories, error, isLoading } = useApplicabilityCategories()

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top

      // Estimate dropdown height (assuming ~40px per item + padding)
      const estimatedDropdownHeight = Math.min((categories?.length || 0) * 40 + 16, 240)

      // Use top positioning if there's more space above and not enough below
      if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top")
      } else {
        setDropdownPosition("bottom")
      }
    }
  }, [isOpen, categories])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen])

  const handleSelect = async (category: ApplicabilityCategory) => {
    if (isUpdating) return

    setIsUpdating(true)
    try {
      await updateApplicationApplicability(application.id, category.id)
      // Refresh the applications data
      await mutate("applications")
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to update applicability:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (error) {
    console.error("Error loading applicability categories:", error)
    return (
      <div className="w-32 px-3 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        Error loading
      </div>
    )
  }

  if (isLoading) {
    return <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center justify-between w-full min-w-[140px] px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate">
          {isUpdating ? "Updating..." : currentApplicability?.category_name || "Select category"}
        </span>
        <ChevronDownIcon className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div
            className={`absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto ${
              dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            style={{
              minWidth: "140px",
              maxWidth: "280px",
            }}
          >
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleSelect(category)}
                  disabled={isUpdating}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-lg last:rounded-b-lg"
                >
                  <span className="truncate pr-2">{category.category_name}</span>
                  {currentApplicability?.id === category.id && (
                    <CheckIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No categories available</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
