"use client"

import React from "react"
import Link from "next/link"

import { useState, useMemo } from "react"
import { ViewColumnsIcon, Squares2X2Icon, FunnelIcon } from "@heroicons/react/24/outline"
import KpiTile from "@/components/KpiTile"
import DataTable from "@/components/DataTable"
import ProgressBar from "@/components/ProgressBar"
import ApplicabilityDropdown from "@/components/ApplicabilityDropdown"
import { CardSkeleton, TableSkeleton } from "@/components/LoadingSkeleton"
import { useApplications } from "@/lib/queries/applications"
import { useApplicabilityCategories } from "@/lib/queries/applicability"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import type { KPIData } from "@/types"

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")
  const [filters, setFilters] = useState({
    name: "",
    owner: "",
    criticality: "all",
    cloudProvider: "all",
    scoreRange: { min: 0, max: 100 },
  })
  const [showFilters, setShowFilters] = useState(false)
  const [applicationsWithScores, setApplicationsWithScores] = useState<any[]>([])
  const [isLoadingScores, setIsLoadingScores] = useState(false)

  const { data: applications, isLoading } = useApplications()
  const { data: applicabilityCategories, isLoading: categoriesLoading } = useApplicabilityCategories()

  // CIS Framework UUID
  const CIS_FRAMEWORK_UUID = "ba74fa54-9650-47d0-b9c6-0973a4a35d70"

  // Fetch CIS scores for applications
  const fetchApplicationScores = async () => {
    if (!applications || applications.length === 0) return

    setIsLoadingScores(true)
    try {
      const appsWithScores = await Promise.all(
        applications.map(async (app) => {
          // Get CIS compliance assessment scores for this application
          const { data: assessments, error } = await supabase
            .from("compliance_assessment")
            .select("score")
            .eq("application_id", app.id)
            .eq("mapped_from", CIS_FRAMEWORK_UUID)

          let cisScore = 0
          if (!error && assessments && assessments.length > 0) {
            // Calculate average score from all CIS assessments for this application
            const totalScore = assessments.reduce((sum, assessment) => sum + (assessment.score || 0), 0)
            cisScore = Math.round(totalScore / assessments.length)
          }

          return {
            ...app,
            overall_score: cisScore,
          }
        }),
      )

      setApplicationsWithScores(appsWithScores)
    } catch (error) {
      console.error("Error fetching CIS scores:", error)
      setApplicationsWithScores(applications.map((app) => ({ ...app, overall_score: 0 })))
    } finally {
      setIsLoadingScores(false)
    }
  }

  // Fetch scores when applications data is available
  React.useEffect(() => {
    if (applications && applications.length > 0) {
      fetchApplicationScores()
    }
  }, [applications])

  // Calculate KPIs based on applications with CIS scores
  const kpis = useMemo(() => {
    const total = applicationsWithScores?.length || 0
    const compliant = applicationsWithScores?.filter((app) => app.overall_score >= 80).length || 0
    const warning =
      applicationsWithScores?.filter((app) => app.overall_score >= 50 && app.overall_score < 80).length || 0
    const critical = applicationsWithScores?.filter((app) => app.overall_score < 50).length || 0
    const avgScore = total > 0 ? applicationsWithScores?.reduce((sum, app) => sum + app.overall_score, 0) / total : 0

    return {
      total,
      compliant,
      warning,
      critical,
      avgScore: Math.round(avgScore || 0),
    }
  }, [applicationsWithScores])

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
      label: "Avg CIS Score",
      value: kpis.avgScore > 0 ? `${kpis.avgScore}%` : "-",
    },
  ]

  // Create a lookup map for applicability categories
  const applicabilityCategoryMap = useMemo(() => {
    if (!applicabilityCategories) return new Map()
    return new Map(applicabilityCategories.map((cat) => [cat.id, cat]))
  }, [applicabilityCategories])

  // Get unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    if (!applicationsWithScores) return { criticalities: [], cloudProviders: [], owners: [] }

    const criticalities = [...new Set(applicationsWithScores.map((app) => app.criticality).filter(Boolean))]
    const cloudProviders = [...new Set(applicationsWithScores.map((app) => app["cloud-provider"]).filter(Boolean))]
    const owners = [...new Set(applicationsWithScores.map((app) => app.owner_email).filter(Boolean))]

    return { criticalities, cloudProviders, owners }
  }, [applicationsWithScores])

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (!applicationsWithScores) return []

    return applicationsWithScores.filter((app) => {
      // Name filter
      if (filters.name && !app.name?.toLowerCase().includes(filters.name.toLowerCase())) {
        return false
      }

      // Owner filter
      if (filters.owner && !app.owner_email?.toLowerCase().includes(filters.owner.toLowerCase())) {
        return false
      }

      // Criticality filter
      if (filters.criticality !== "all" && app.criticality !== filters.criticality) {
        return false
      }

      // Cloud provider filter
      if (filters.cloudProvider !== "all" && app["cloud-provider"] !== filters.cloudProvider) {
        return false
      }

      // Score range filter
      const score = app.overall_score || 0
      if (score < filters.scoreRange.min || score > filters.scoreRange.max) {
        return false
      }

      return true
    })
  }, [applicationsWithScores, filters])

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      name: "",
      owner: "",
      criticality: "all",
      cloudProvider: "all",
      scoreRange: { min: 0, max: 100 },
    })
  }

  const columns = [
    {
      key: "name",
      label: "Application Name",
      sortable: true,
      render: (value: string, row: any) => (
        <Link href={`/applications/${row.id}`} className="font-medium text-blue-600 hover:underline">
          {value || "Unnamed Application"}
        </Link>
      ),
    },
    {
      key: "owner_email",
      label: "Owner",
      sortable: true,
      render: (value: string) => <div className="text-sm">{value || "-"}</div>,
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
          {value || "Not Set"}
        </span>
      ),
    },
    {
      key: "cloud-provider",
      label: "Cloud Provider",
      sortable: true,
      render: (value: string) => <div className="text-sm">{value || "Not Specified"}</div>,
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
      label: "CIS Score",
      sortable: true,
      render: (value: number, row: any) => {
        const score = value || 0
        return (
          <div className="flex items-center gap-2">
            <ProgressBar value={score} className="w-20" />
            <span className="text-sm font-medium min-w-[40px]">{score > 0 ? `${score}%` : "0%"}</span>
          </div>
        )
      },
    },
  ]

  if (isLoading || isLoadingScores) {
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
    <div className="flex flex-col min-h-screen overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor CIS compliance across all your applications</p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 flex-shrink-0 mb-6">
        {kpiData.map((kpi, index) => (
          <KpiTile key={index} data={kpi} />
        ))}
      </div>

      {/* Filters and View Toggle */}
      <div className="glass-card p-4 flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
            </Button>

            {(filters.name ||
              filters.owner ||
              filters.criticality !== "all" ||
              filters.cloudProvider !== "all" ||
              filters.scoreRange.min > 0 ||
              filters.scoreRange.max < 100) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}

            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredApplications.length} of {applicationsWithScores?.length || 0} applications
            </span>
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

        {/* Filter Controls */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <Label htmlFor="name-filter" className="text-sm font-medium mb-2 block">
                Application Name
              </Label>
              <Input
                id="name-filter"
                placeholder="Search by name..."
                value={filters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="owner-filter" className="text-sm font-medium mb-2 block">
                Owner
              </Label>
              <Input
                id="owner-filter"
                placeholder="Search by owner..."
                value={filters.owner}
                onChange={(e) => handleFilterChange("owner", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="criticality-filter" className="text-sm font-medium mb-2 block">
                Criticality
              </Label>
              <Select value={filters.criticality} onValueChange={(value) => handleFilterChange("criticality", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Criticality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Criticality</SelectItem>
                  {uniqueValues.criticalities.map((criticality) => (
                    <SelectItem key={criticality} value={criticality}>
                      {criticality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cloud-provider-filter" className="text-sm font-medium mb-2 block">
                Cloud Provider
              </Label>
              <Select
                value={filters.cloudProvider}
                onValueChange={(value) => handleFilterChange("cloudProvider", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {uniqueValues.cloudProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-2 block">
                Score Range: {filters.scoreRange.min}% - {filters.scoreRange.max}%
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.scoreRange.min}
                    onChange={(e) =>
                      handleFilterChange("scoreRange", {
                        ...filters.scoreRange,
                        min: Number.parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.scoreRange.max}
                    onChange={(e) =>
                      handleFilterChange("scoreRange", {
                        ...filters.scoreRange,
                        max: Number.parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Applications Data - Scrollable Container */}
      <div className="flex-1 min-h-0">
        {viewMode === "table" ? (
          <div className="h-full overflow-y-auto max-h-[350px]">
            <div className="glass-card">
              <DataTable data={filteredApplications} columns={columns} loading={isLoading || isLoadingScores} />
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {filteredApplications.map((app) => {
                const currentCategory = app.applicability ? applicabilityCategoryMap.get(app.applicability) : null;
                const score = app.overall_score || 0;
                return (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="glass-card p-6 block hover:shadow-lg transition-shadow"
                  >
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
                              : app.criticality === "Medium"
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                : app.criticality === "Low"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {app.criticality || "Not Set"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">CIS Score</span>
                        <span className="font-medium">{score > 0 ? `${score}%` : "0%"}</span>
                      </div>
                      <ProgressBar value={score} />

                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Cloud Provider</span>
                          <span className="font-medium truncate ml-2">{app["cloud-provider"] || "Not Specified"}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Applicability</span>
                        </div>
                        <div className="relative">
                          <ApplicabilityDropdown application={app} currentApplicability={currentCategory} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
