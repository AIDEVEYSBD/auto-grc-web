"use client"

import { useMemo } from "react"
import { mutate } from "swr"
import { DocumentTextIcon, ShieldCheckIcon, StarIcon } from "@heroicons/react/24/outline"
import KpiTile from "@/components/KpiTile"
import FrameworkCard from "@/components/FrameworkCard"
import FrameworkComparisonTable from "@/components/FrameworkComparisonTable"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useFrameworks, useFrameworkKPIs, setMasterFramework } from "@/lib/queries/frameworks"
import { useFrameworkMappings } from "@/lib/queries/mappings"
import type { KPIData } from "@/types"

export default function FrameworksPage() {
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()
  const { data: mappings, isLoading: mappingsLoading } = useFrameworkMappings()
  const { totalControls, controls: allControls } = useFrameworkKPIs()

  const isLoading = frameworksLoading || mappingsLoading

  const frameworkData = useMemo(() => {
    if (!frameworks || !mappings || !allControls) return []

    const masterFramework = frameworks.find((f) => f.master)
    const masterControlIds = new Set(allControls.filter((c) => c.framework_id === masterFramework?.id).map((c) => c.id))

    const data = frameworks.map((framework) => {
      const frameworkControls = allControls.filter((c) => c.framework_id === framework.id)
      const controlCount = frameworkControls.length
      let overlap

      if (!framework.master && masterFramework) {
        const frameworkControlIds = new Set(frameworkControls.map((c) => c.id))

        const mappedControls = new Set()
        mappings.forEach((mapping) => {
          // Check if a mapping connects this framework's control to a master control
          if (frameworkControlIds.has(mapping.source_control_id) && masterControlIds.has(mapping.target_control_id)) {
            mappedControls.add(mapping.source_control_id)
          }
          if (frameworkControlIds.has(mapping.target_control_id) && masterControlIds.has(mapping.source_control_id)) {
            mappedControls.add(mapping.target_control_id)
          }
        })

        const mappedCount = mappedControls.size
        const percentage = controlCount > 0 ? Math.round((mappedCount / controlCount) * 100) : 0
        overlap = { mapped: mappedCount, percentage }
      }

      return {
        ...framework,
        controlCount,
        overlap,
      }
    })

    // Sort to bring master framework to the front
    return data.sort((a, b) => (a.master === b.master ? 0 : a.master ? -1 : 1))
  }, [frameworks, mappings, allControls])

  const masterFramework = frameworkData.find((f) => f.master)
  const otherFrameworks = frameworkData.filter((f) => !f.master)

  const handleSetMaster = async (frameworkId: string) => {
    if (!frameworks) return

    // Optimistic UI update
    const originalFrameworks = [...frameworks]
    const newFrameworks = frameworks.map((f) => ({
      ...f,
      master: f.id === frameworkId,
    }))
    mutate("frameworks", newFrameworks, false)

    try {
      await setMasterFramework(frameworkId)
      mutate("frameworks") // Revalidate data from server
    } catch (error) {
      console.error("Failed to set master framework:", error)
      mutate("frameworks", originalFrameworks, false) // Revert on error
    }
  }

  const kpiData: KPIData[] = [
    {
      label: "Total Frameworks",
      value: frameworkData.length,
      icon: DocumentTextIcon,
      color: "blue",
    },
    {
      label: "Total Controls",
      value: totalControls,
      icon: ShieldCheckIcon,
      color: "green",
    },
    {
      label: "Master Framework",
      value: masterFramework?.name || "Not Set",
      icon: StarIcon,
      color: "yellow",
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Frameworks</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and monitor your compliance frameworks</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <KpiTile key={index} data={kpi} />
        ))}
      </div>

      {/* Framework Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {frameworkData.map((framework) => (
          <FrameworkCard key={framework.id} framework={framework} onSetMaster={handleSetMaster} />
        ))}
      </div>

      {/* Framework Comparison Table */}
      {masterFramework && allControls && mappings && (
        <FrameworkComparisonTable
          masterFramework={masterFramework}
          otherFrameworks={otherFrameworks}
          allControls={allControls}
          allMappings={mappings}
        />
      )}
    </div>
  )
}
