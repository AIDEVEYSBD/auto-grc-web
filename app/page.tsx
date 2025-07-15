"use client"

import { useMemo } from "react"
import KpiTile from "@/components/KpiTile"
import DonutStrip from "@/components/DonutStrip"
import ApplicationsFrameworkTable from "@/components/ApplicationsFrameworkTable"
import DomainPanel from "@/components/DomainPanel"
import { CardSkeleton } from "@/components/LoadingSkeleton"
import { useFrameworkKPIs } from "@/lib/queries/frameworks"
import { useApplications } from "@/lib/queries/applications"
import { useComplianceAssessments } from "@/lib/queries/assessments"
import { useSupabaseQuery } from "@/lib/swr-client"
import { supabase } from "@/lib/supabase"
import {
  DocumentTextIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline"
import type { KPIData, Control } from "@/types"

export default function OverviewPage() {
  const { data: applications, isLoading: appsLoading } = useApplications()
  const { data: assessments, isLoading: assessmentsLoading } = useComplianceAssessments()
  const frameworkKPIs = useFrameworkKPIs()

  const { data: allControls, isLoading: controlsLoading } = useSupabaseQuery<Control>("all-controls", () =>
    supabase.from("controls").select("*"),
  )

  // Calculate framework compliance from live data
  const frameworkCompliance = useMemo(() => {
    if (!frameworkKPIs.frameworks || !assessments || !allControls) return []

    return frameworkKPIs.frameworks.map((framework) => {
      const frameworkControls = allControls.filter((control) => control.framework_id === framework.id)

      // Get assessments that are mapped from this framework
      const frameworkAssessments = assessments.filter((assessment) => assessment.mapped_from === framework.id)

      const totalControls = frameworkControls.length

      // Count controls with passing scores (assuming score >= 0.8 is passing, >= 0.4 is partial)
      const passingAssessments = frameworkAssessments.filter((a) => a.score >= 0.8)
      const partialAssessments = frameworkAssessments.filter((a) => a.score >= 0.4 && a.score < 0.8)

      const passedControls = passingAssessments.length + partialAssessments.length

      const compliance = totalControls > 0 ? Math.round((passedControls / totalControls) * 100) : 0

      return {
        framework,
        compliance,
        totalControls,
        passedControls,
      }
    })
  }, [frameworkKPIs.frameworks, assessments, allControls])

  // Calculate real KPIs from database
  const totalApps = applications?.length || 0
  const totalControls = frameworkKPIs.totalControls
  const failedControls = assessments?.filter((a) => a.score < 0.4).length || 0

  // Calculate overall compliance as average of all framework compliance scores
  const overallCompliance = useMemo(() => {
    if (!frameworkCompliance || frameworkCompliance.length === 0) return 0

    const totalCompliance = frameworkCompliance.reduce((sum, fw) => sum + fw.compliance, 0)
    return Math.round(totalCompliance / frameworkCompliance.length)
  }, [frameworkCompliance])

  const kpiData: KPIData[] = [
    {
      label: "Active Frameworks",
      value: frameworkKPIs.activeFrameworks,
      icon: DocumentTextIcon,
      color: "blue",
    },
    {
      label: "Applications",
      value: totalApps,
      icon: ComputerDesktopIcon,
      color: "purple",
    },
    {
      label: "Total Controls",
      value: totalControls,
      icon: ShieldCheckIcon,
      color: "green",
    },
    {
      label: "Failed Controls",
      value: failedControls,
      icon: ExclamationTriangleIcon,
      color: "red",
    },
    {
      label: "Overall Compliance",
      value: frameworkCompliance.length > 0 ? `${overallCompliance}%` : "-",
      icon: ChartBarIcon,
      color: overallCompliance >= 80 ? "green" : overallCompliance >= 40 ? "yellow" : "red",
    },
  ]

  if (appsLoading || assessmentsLoading || controlsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpiData.map((kpi, index) => (
          <KpiTile key={index} data={kpi} />
        ))}
      </div>

      {/* Framework Compliance Donuts */}
      <DonutStrip />

      {/* Applications Framework Table */}
      <ApplicationsFrameworkTable />

      {/* Domain Panel */}
      <DomainPanel applications={applications || []} />
    </div>
  )
}
