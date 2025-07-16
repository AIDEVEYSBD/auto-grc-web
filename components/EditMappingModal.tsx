"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrashIcon, PlusIcon } from "@heroicons/react/24/solid"
import { supabase } from "@/lib/supabase"
import type { Framework, Control } from "@/types"

interface EditMappingModalProps {
  isOpen: boolean
  onClose: () => void
  masterControl: Control
  targetFramework: Framework
  existingMappings: Control[]
  allTargetControls: Control[]
  onSave: () => void
}

export default function EditMappingModal({
  isOpen,
  onClose,
  masterControl,
  targetFramework,
  existingMappings,
  allTargetControls,
  onSave,
}: EditMappingModalProps) {
  const [selectedMappings, setSelectedMappings] = useState<Control[]>(existingMappings)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSelectedMappings(existingMappings)
  }, [existingMappings])

  const filteredControls = allTargetControls.filter(
    (control) =>
      !selectedMappings.some((selected) => selected.id === control.id) &&
      (control.ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        control.description?.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAddMapping = (control: Control) => {
    setSelectedMappings((prev) => [...prev, control])
  }

  const handleRemoveMapping = (controlId: string) => {
    setSelectedMappings((prev) => prev.filter((c) => c.id !== controlId))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Delete existing mappings
      const { error: deleteError } = await supabase
        .from("framework_mappings")
        .delete()
        .or(
          `and(source_control_id.eq.${masterControl.id},target_framework_id.eq.${targetFramework.id}),and(target_control_id.eq.${masterControl.id},source_framework_id.eq.${targetFramework.id})`,
        )

      if (deleteError) {
        console.error("Error deleting existing mappings:", deleteError)
        throw deleteError
      }

      // Create new mappings
      if (selectedMappings.length > 0) {
        const newMappings = selectedMappings.map((targetControl) => ({
          source_framework_id: masterControl.framework_id,
          target_framework_id: targetFramework.id,
          source_control_id: masterControl.id,
          target_control_id: targetControl.id,
          mapping_type: "manual",
          confidence: 0.9, // Fixed: changed from confidence_score to confidence
        }))

        const { error: insertError } = await supabase.from("framework_mappings").insert(newMappings)

        if (insertError) {
          console.error("Error creating new mappings:", insertError)
          throw insertError
        }
      }

      onSave()
      onClose()
    } catch (error) {
      console.error("Error saving mappings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Mappings</DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-hidden flex gap-6">
          {/* Master Control */}
          <div className="w-1/3 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Master Control</h3>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">{masterControl.ID}</p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">{masterControl.title}</p>
              {masterControl.description && (
                <p className="text-xs text-blue-700 dark:text-blue-300">{masterControl.description}</p>
              )}
            </div>
          </div>

          {/* Selected Mappings */}
          <div className="w-1/3 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Mapped to {targetFramework.name}
            </h3>
            <div className="flex-grow overflow-y-auto space-y-2 min-h-0">
              {selectedMappings.map((control) => (
                <div
                  key={control.id}
                  className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 relative group"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveMapping(control.id)}
                  >
                    <TrashIcon className="h-3 w-3 text-red-500" />
                  </Button>
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1 pr-8">{control.ID}</p>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-1">{control.title}</p>
                  {control.description && (
                    <p className="text-xs text-green-700 dark:text-green-300">{control.description}</p>
                  )}
                </div>
              ))}
              {selectedMappings.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <span className="text-sm">No mappings selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Available Controls */}
          <div className="w-1/3 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Available {targetFramework.name} Controls
            </h3>
            <div className="mb-3">
              <Input
                placeholder="Search controls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 min-h-0">
              {filteredControls.map((control) => (
                <div
                  key={control.id}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 relative group cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => handleAddMapping(control)}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddMapping(control)
                    }}
                  >
                    <PlusIcon className="h-3 w-3 text-blue-500" />
                  </Button>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 pr-8">{control.ID}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{control.title}</p>
                  {control.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">{control.description}</p>
                  )}
                </div>
              ))}
              {filteredControls.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-600">
                  <span className="text-sm">No controls found</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Mappings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
