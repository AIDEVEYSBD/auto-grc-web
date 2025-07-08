"use client"

import { useState, useMemo } from "react"
import { ViewColumnsIcon, Squares2X2Icon } from "@heroicons/react/24/outline"
import KpiTile from "@/components/KpiTile"
import DataTable from "@/components/DataTable"
import ProgressBar from "@/components/ProgressBar"
import ApplicabilityDropdown from "@/components/ApplicabilityDropdown"
import { CardSkeleton, TableSkeleton } from "@/components/LoadingSkeleton"
import { useApplications, useApplicationKPIs } from "@/lib/queries/applications"
import { useApplicabilityCategories } from "@/lib/queries/applicability"
import type { KPIData } from "@/types"

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [selectedCriticality, setSelectedCriticality] = useState<string>("all")

  const { data: applications, isLoading } = useApplications()
  const { data: applicabilityCategories, isLoading: categoriesLoading } = useApplicabilityCategories()
  const kpis = useApplicationKPIs()

  const kpiData: KPIData[] = [
    {
      label: "Total Applications",
      value: kpis.total,
    },
    {
      label: "Compliant",
      value: kpis.compliant,
    },
    {
      label: "Warning",
      value: kpis.warning,
    },
    {
      label: "Critical",
      value: kpis.critical,
    },
    {
      label: "Avg Score",
      value: kpis.avgScore > 0 ? `${kpis.avgScore}%` : "-",
    },
  ]

  // Create a lookup map for applicability categories
  const applicabilityCategoryMap = useMemo(() => {
    if (!applicabilityCategories) return new Map()
    return new Map(applicabilityCategories.map((cat) => [cat.id, cat]))
  }, [applicabilityCategories])

  // Filter applications
  const filteredApplications =
    applications?.filter((app) => {
      if (selectedCriticality !== "all" && app.criticality !== selectedCriticality) {
        return false
      }
      return true
    }) || []

  const columns = [
    {
      key: "name",
      label: "Application Name",
      sortable: true,
      render: (value: string) => value || "-",
    },
    {
      key: "owner_email",
      label: "Owner",
      sortable: true,
      render: (value: string) => value || "-",
    },
    {
      key: "criticality",
      label: "Criticality",
      sortable: true,
      render: (value: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "Critical"
              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
              : value === "High"
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                : value === "Medium"
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                  : value === "Low"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          {value || "-"}
        </span>
      ),
    },
    {
      key: "cloud-provider",
      label: "Cloud Provider",
      sortable: true,
      render: (value: string) => value || "-",
    },
    {
      key: "applicability",
      label: "Applicability",
      sortable: false,
      render: (value: string, row: any) => {
        const currentCategory = value ? applicabilityCategoryMap.get(value) : null
        return <ApplicabilityDropdown application={row} currentApplicability={currentCategory} />
      },
    },
    {
      key: "overall_score",
      label: "Overall Score",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={value || 0} className="w-20" />
          <span className="text-sm font-medium">{value ? `${Math.round(value)}%` : "-"}</span>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor compliance across all your applications</p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 flex-shrink-0">
        {kpiData.map((kpi, index) => (
          <KpiTile key={index} data={kpi} />
        ))}
      </div>

      {/* Filters and View Toggle */}
      <div className="glass-card p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <select
              value={selectedCriticality}
              onChange={(e) => setSelectedCriticality(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Criticality</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <ViewColumnsIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "cards"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Applications Data */}
      <div className="flex-1 min-h-0">
        {viewMode === "table" ? (
          <div className="h-full">
            <DataTable data={filteredApplications} columns={columns} loading={isLoading} />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {filteredApplications.map((app) => {
                const currentCategory = app.applicability ? applicabilityCategoryMap.get(app.applicability) : null
                return (
                  <div key={app.id} className="glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {app.name || "Unnamed Application"}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{app.owner_email || "-"}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ml-2 ${
                          app.criticality === "Critical"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : app.criticality === "High"
                              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                              : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}
                      >
                        {app.criticality || "-"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Overall Score</span>
                        <span className="font-medium">
                          {app.overall_score ? `${Math.round(app.overall_score)}%` : "-"}
                        </span>
                      </div>
                      <ProgressBar value={app.overall_score || 0} />

                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Cloud Provider</span>
                          <span className="font-medium truncate ml-2">{app["cloud-provider"] || "-"}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Applicability</span>
                        </div>
                        <div className="relative">
                          <ApplicabilityDropdown application={app} currentApplicability={currentCategory} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
