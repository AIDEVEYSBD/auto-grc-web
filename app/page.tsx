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
import {
  DocumentTextIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline"
import type { KPIData } from "@/types"

export default function OverviewPage() {
  const { data: applications, isLoading: appsLoading } = useApplications()
  const { data: assessments, isLoading: assessmentsLoading } = useComplianceAssessments()
  const frameworkKPIs = useFrameworkKPIs()

  // Calculate real KPIs from database
  const totalApps = applications?.length || 0
  const totalControls = frameworkKPIs.totalControls
  const failedControls = assessments?.filter((a) => a.status === "fail").length || 0

  // Calculate overall compliance as average of all applications' compliance scores
  const overallCompliance = useMemo(() => {
    if (!applications || applications.length === 0) return 0

    const totalScore = applications.reduce((sum, app) => sum + (app.compliance_score || 0), 0)
    return Math.round(totalScore / applications.length)
  }, [applications])

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
      value: totalApps > 0 ? `${overallCompliance}%` : "-",
      icon: ChartBarIcon,
      color: overallCompliance >= 80 ? "green" : overallCompliance >= 40 ? "yellow" : "red",
    },
  ]

  if (appsLoading || assessmentsLoading) {
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
