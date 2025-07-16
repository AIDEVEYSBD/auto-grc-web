"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import FrameworkComparisonTable from "@/components/FrameworkComparisonTable"
import UnmappedControlsTable from "@/components/UnmappedControlsTable"
import LoadingSkeleton from "@/components/LoadingSkeleton"
import { supabase } from "@/lib/supabase"
import type { Framework, Control, FrameworkMapping } from "@/types"

export default function FrameworkBaselinerPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [controls, setControls] = useState<Control[]>([])
  const [mappings, setMappings] = useState<FrameworkMapping[]>([])
  const [selectedMasterFramework, setSelectedMasterFramework] = useState<string>("")
  const [selectedOtherFrameworks, setSelectedOtherFrameworks] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch frameworks
        const { data: frameworksData, error: frameworksError } = await supabase
          .from("frameworks")
          .select("*")
          .order("name")

        if (frameworksError) throw frameworksError

        // Fetch controls
        const { data: controlsData, error: controlsError } = await supabase.from("controls").select("*").order("ID")

        if (controlsError) throw controlsError

        // Fetch mappings
        const { data: mappingsData, error: mappingsError } = await supabase.from("framework_mappings").select("*")

        if (mappingsError) throw mappingsError

        setFrameworks(frameworksData || [])
        setControls(controlsData || [])
        setMappings(mappingsData || [])

        // Auto-select first framework as master if none selected
        if (!selectedMasterFramework && frameworksData && frameworksData.length > 0) {
          setSelectedMasterFramework(frameworksData[0].id)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [refreshKey])

  const handleMappingsChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const masterFramework = frameworks.find((f) => f.id === selectedMasterFramework)
  const otherFrameworks = frameworks.filter((f) => selectedOtherFrameworks.includes(f.id))

  const handleOtherFrameworkToggle = (frameworkId: string) => {
    setSelectedOtherFrameworks((prev) => {
      if (prev.includes(frameworkId)) {
        return prev.filter((id) => id !== frameworkId)
      } else {
        return [...prev, frameworkId]
      }
    })
  }

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Framework Baseliner</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Compare and map controls across different compliance frameworks to establish baseline relationships.
        </p>
      </div>

      {/* Framework Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Framework Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Master Framework Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Master Framework
              </label>
              <Select value={selectedMasterFramework} onValueChange={setSelectedMasterFramework}>
                <SelectTrigger>
                  <SelectValue placeholder="Select master framework" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks.map((framework) => (
                    <SelectItem key={framework.id} value={framework.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{framework.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {controls.filter((c) => c.framework_id === framework.id).length} controls
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Other Frameworks Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Comparison Frameworks
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {frameworks
                  .filter((f) => f.id !== selectedMasterFramework)
                  .map((framework) => (
                    <label key={framework.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedOtherFrameworks.includes(framework.id)}
                        onChange={() => handleOtherFrameworkToggle(framework.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{framework.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {controls.filter((c) => c.framework_id === framework.id).length}
                      </Badge>
                    </label>
                  ))}
              </div>
            </div>
          </div>

          {/* Selected Frameworks Summary */}
          {masterFramework && otherFrameworks.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected for Comparison:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{masterFramework.name} (Master)</Badge>
                {otherFrameworks.map((fw) => (
                  <Badge key={fw.id} variant="secondary">
                    {fw.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Framework Comparison Table */}
      {masterFramework && otherFrameworks.length > 0 && (
        <>
          <FrameworkComparisonTable
            masterFramework={masterFramework}
            otherFrameworks={otherFrameworks}
            allControls={controls}
            allMappings={mappings}
            onMappingsChange={handleMappingsChange}
          />

          <Separator />

          {/* Unmapped Controls */}
          <UnmappedControlsTable
            masterFramework={masterFramework}
            otherFrameworks={otherFrameworks}
            allControls={controls}
            allMappings={mappings}
          />
        </>
      )}

      {/* Empty State */}
      {(!masterFramework || otherFrameworks.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Compare Frameworks</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Select a master framework and at least one comparison framework to begin mapping controls.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
