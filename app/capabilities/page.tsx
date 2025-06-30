"use client"

import KpiTile from "@/components/KpiTile"
import CapabilityCard from "@/components/CapabilityCard"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useCapabilities, useCapabilityKPIs } from "@/lib/queries/capabilities"
import type { KPIData } from "@/types"

export default function CapabilitiesPage() {
  const { data: capabilities, isLoading } = useCapabilities()
  const kpis = useCapabilityKPIs()

  const kpiData: KPIData[] = [
    {
      label: "Total Capabilities",
      value: kpis.total,
      delta: 2,
      trend: "up",
    },
    {
      label: "Active",
      value: kpis.active,
      delta: 1,
      trend: "up",
    },
    {
      label: "Beta",
      value: kpis.beta,
      delta: 0,
      trend: "neutral",
    },
    {
      label: "Available",
      value: kpis.available,
      delta: 1,
      trend: "up",
    },
  ]

  const handleCapabilityToggle = (id: string, enabled: boolean) => {
    // In a real app, this would update the capability in Supabase
    console.log(`Toggling capability ${id} to ${enabled}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capabilities</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Enable and manage your security capabilities</p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KpiTile key={index} data={kpi} />
        ))}
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {capabilities?.map((capability) => (
          <CapabilityCard key={capability.id} capability={capability} onToggle={handleCapabilityToggle} />
        ))}
      </div>
    </div>
  )
}
