"use client"
import { useParams } from "next/navigation"
import { Line } from 'react-chartjs-2'
import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
import { Search, Filter, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Layers, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useApplicationComplianceDetails } from "./useAllApplicationDetails";
import Loader from "@/components/Loader";
export default function ApplicationDashboard() {
  const params = useParams()
  const appId = params?.id
  const id = Array.isArray(appId) ? appId[0] : appId
  const { application: app,complianceSummary,complianceDetails, loading, error } = useApplicationComplianceDetails(id)

const [currentPage, setCurrentPage] = useState(1)
const itemsPerPage = 10

const totalPages = Math.ceil(complianceDetails.length / itemsPerPage)
const paginatedData = complianceDetails.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  if (loading) {
    return (
   <Loader></Loader>
    )
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <span className="text-lg text-red-600">Error loading application details.</span>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      title: "Total Applications",
      value: "1",
      icon: Layers,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Compliant",
      value: app.overall_score >= 80 ? "1" : "0",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Warning",
      value: app.overall_score >= 60 && app.overall_score < 80 ? "1" : "0",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Critical",
      value: app.overall_score < 60 ? "1" : "0",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Average Score",
      value: `${app.overall_score || 0}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  const getCriticalityBadge = (criticality: string) => {
    const variants = {
      high: "destructive",
      medium: "secondary",
      low: "outline",
    } as const

    return (
      <Badge variant={variants[criticality?.toLowerCase() as keyof typeof variants] || "outline"}>{criticality}</Badge>
    )
  }

  const renderCCMTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Control ID</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(ccm) ? ccm : ccm ? [ccm] : []).flatMap((ccmObj: any, idx: number) =>
          Object.entries(ccmObj)
            .filter(([key]) => /^\d/.test(key))
            .map(([control, score]) => (
              <TableRow key={control + idx}>
                <TableCell>{control}</TableCell>
                <TableCell>{score}</TableCell>
              </TableRow>
            ))
        )}
      </TableBody>
    </Table>
  )

  const renderCrowdstrikeTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Particulars</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(crowdstrike) ? crowdstrike : crowdstrike ? [crowdstrike] : []).map((item: any, idx: number) => (
          <TableRow key={item.id || idx}>
            <TableCell className="whitespace-pre-wrap">{item.particulars}</TableCell>
            <TableCell>{item.score}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderWizTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Particulars</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(Array.isArray(wiz) ? wiz : wiz ? [wiz] : []).map((item: any, idx: number) => (
          <TableRow key={item.id || idx}>
            <TableCell className="whitespace-pre-wrap">{item.particulars}</TableCell>
            <TableCell>{item.score}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{app.name} {getCriticalityBadge(app.criticality)}</h1>
            
          </div>
          <div className="flex gap-3">
            <Button   onClick={() => window.location.reload()} className="bg-[#101522] text-white border border-[#232a44] hover:bg-[#232a44] flex items-center gap-2 px-6 py-2 rounded-xl shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12a9.75 9.75 0 0117.28-6.72M21.75 12a9.75 9.75 0 01-17.28 6.72M12 6.75v6l4.03 2.42" />
              </svg>
              Refresh
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center gap-2 px-6 py-2 rounded-xl shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5v-9m0 9l-3.75-3.75M12 16.5l3.75-3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Export Report
            </Button>
          </div>
        </div>

        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <div key={index} className="bg-white dark:bg-[#151a2b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${metric.bgColor} dark:bg-[#232a44]`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{metric.title}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div> */}

        {/* <div className="bg-white dark:bg-[#151a2b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search applications, descriptions, or tags" className="pl-10 bg-white dark:bg-[#151a2b] text-gray-900 dark:text-white border-gray-200 dark:border-gray-800" />
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Select defaultValue="all-frameworks">
                <SelectTrigger className="w-40 bg-white dark:bg-[#151a2b] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
                  <SelectValue placeholder="All Frameworks" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#151a2b] text-gray-900 dark:text-white">
                  <SelectItem value="all-frameworks">All Frameworks</SelectItem>
                  <SelectItem value="ccm">CCM</SelectItem>
                  <SelectItem value="crowdstrike">Crowdstrike</SelectItem>
                  <SelectItem value="wiz">Wiz</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all-criticality">
                <SelectTrigger className="w-40 bg-white dark:bg-[#151a2b] border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white">
                  <SelectValue placeholder="All Criticality" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#151a2b] text-gray-900 dark:text-white">
                  <SelectItem value="all-criticality">All Criticality</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Filter className="h-4 w-4" />
                Showing 1 of 1 applications
              </div>
            </div>
          </div>
        </div> */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Service Information Card */}
          <div className="bg-white dark:bg-[#151a2b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col justify-between h-full min-h-[340px]">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Service Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Owner:</span>
                  <span className="text-gray-900 dark:text-white">{app.owner_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Created:</span>
                  <span className="text-gray-900 dark:text-white">{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Cloud Provider:</span>
                  <span className="text-gray-900 dark:text-white">{app.cloud_provider || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">Overall Score:</span>
                  {(() => {
                    const score = app.overall_score || 0;
                    let badgeColor = "bg-red-500 text-white";
                    if (score >= 80) badgeColor = "bg-green-500 text-white";
                    else if (score >= 50) badgeColor = "bg-yellow-400 text-gray-900";
                    return (
                      <span className={`px-3 py-1 rounded-full font-semibold text-sm ${badgeColor}`}>{score}%</span>
                    );
                  })()}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">URL:</span>
                  {app.url ? (
                    <a
                      href={app.url.startsWith("http") ? app.url : `https://${app.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <span className="truncate max-w-32">{app.url}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
            </div>
            
          </div>

          {/* Compliance Summary Card (empty for now) */}
         <div className="bg-white dark:bg-[#151a2b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col h-full min-h-[340px]">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Compliance Summary</h2>

  {complianceSummary ? (
    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
      <div className="flex justify-between">
        <span>Total Controls:</span>
        <span>{complianceSummary.totalControls}</span>
      </div>
      <div className="flex justify-between">
        <span>Fully Met:</span>
        <span className="text-green-500 font-semibold">{complianceSummary.fullyMet}</span>
      </div>
      <div className="flex justify-between">
        <span>Partially Met:</span>
        <span className="text-yellow-400 font-semibold">{complianceSummary.partiallyMet}</span>
      </div>
      <div className="flex justify-between">
        <span>Not Met:</span>
        <span className="text-red-500 font-semibold">{complianceSummary.notMet}</span>
      </div>
      <div className="flex justify-between">
        <span>Average Score:</span>
        <span className="font-bold">{complianceSummary.avgScore}%</span>
      </div>
      <div className="flex justify-between">
        <span>Last Assessed:</span>
        <span>{complianceSummary.latestAssessed ? new Date(complianceSummary.latestAssessed).toLocaleDateString() : "N/A"}</span>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
      No compliance data available.
    </div>
  )}
</div>

          {/* Compliance Trends Card */}
          <div className="bg-white dark:bg-[#151a2b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col h-full min-h-[340px]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Compliance Trend</h2>
            <div className="flex-1 flex items-center justify-center">
              <Line
                data={{
                  labels: ['Jan 2023', 'Apr 2023', 'Jul 2023', 'Oct 2023', 'Jan 2024'],
                  datasets: [
                    {
                      label: 'Compliance %',
                      data: [0, 10, 20, 30, app.overall_score || 0],
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59,130,246,0.2)',
                      pointBackgroundColor: '#3b82f6',
                      pointBorderColor: '#fff',
                      pointRadius: 6,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: function(context) {
                          return `Compliance: ${context.parsed.y}%`;
                        }
                      }
                    },
                  },
                  scales: {
                    x: {
                      title: { display: true, text: 'Month', color: '#cbd5e1' },
                      ticks: { color: '#cbd5e1' },
                      grid: { color: 'rgba(203,213,225,0.1)' },
                    },
                    y: {
                      title: { display: true, text: 'Compliance %', color: '#cbd5e1' },
                      min: 0,
                      max: 100,
                      ticks: { color: '#cbd5e1', stepSize: 20 },
                      grid: { color: 'rgba(203,213,225,0.1)' },
                    },
                  },
                }}
                height={200}
              />
            </div>
          </div>
        </div>
<div className="bg-white dark:bg-[#151a2b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 mt-6">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Compliance Details</h2>

  {complianceSummary && complianceSummary.totalControls > 0 ? (
    <>
      <div className="overflow-auto max-h-96 border rounded-lg">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10 bg-white dark:bg-[#151a2b]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151a2b]">Control ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151a2b]">Domain</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151a2b]">Control</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151a2b]">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151a2b]">Score</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151a2b]">Source</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151a2b]">Assessed At</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((detail, idx) => (
              <tr key={detail.control_id + idx} className="border-b border-gray-200 dark:border-gray-800">
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{detail.control_id}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{detail.domain}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{detail.control}</td>
                <td className={
                  `px-4 py-2 text-sm font-semibold ` +
                  (detail.status === "Fully Met" ? "text-green-500" :
                  detail.status === "Partially Met" ? "text-yellow-400" : "text-red-500")
                }>{detail.status}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{detail.score}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{detail.source}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{new Date(detail.assessed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-gray-700 dark:text-gray-300">
        <span>Page {currentPage} of {totalPages} &nbsp;|&nbsp; Total Rows: {complianceDetails.length}</span>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </div>
    </>
  ) : (
    <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600">
      No compliance details available.
    </div>
  )}
</div>

      </div>
    // </div>
  )
}
