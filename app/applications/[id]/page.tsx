"use client"
import { useParams } from "next/navigation"
import { Search, Filter, CheckCircle, AlertTriangle, AlertCircle, TrendingUp, Layers, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAllApplicationDetails } from "./useAllApplicationDetails"

export default function ApplicationDashboard() {
  const params = useParams()
  const appId = params?.id
  const id = Array.isArray(appId) ? appId[0] : appId
  const { application: app, ccm, crowdstrike, wiz, loading, error } = useAllApplicationDetails(id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-lg text-gray-600">Loading application details...</span>
        </div>
      </div>
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
    <div className="min-h-screen bg-blue-50 dark:bg-[#0a0f1c] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{app.name}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        </div>

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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Application Details</h2>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-800 p-1">
              <Button variant="ghost" size="sm" className="bg-gray-100 dark:bg-[#232a44] text-gray-900 dark:text-white">Table View</Button>
              <Button variant="ghost" size="sm" className="text-gray-900 dark:text-white">Card View</Button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151a2b] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <div className="pb-4 px-6 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{app.name}</span>
                {getCriticalityBadge(app.criticality)}
              </div>
            </div>
            <div className="space-y-6 px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Application Info</h3>
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
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Overall Score:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{app.overall_score || 0}%</span>
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

                <div className="col-span-2">
                  <Tabs defaultValue="ccm" className="w-full">
                    <TabsList className="bg-gray-100 dark:bg-[#232a44] border border-gray-200 dark:border-gray-800">
                      <TabsTrigger value="ccm" className="text-gray-900 dark:text-white">CCM</TabsTrigger>
                      <TabsTrigger value="crowdstrike" className="text-gray-900 dark:text-white">Crowdstrike</TabsTrigger>
                      <TabsTrigger value="wiz" className="text-gray-900 dark:text-white">Wiz</TabsTrigger>
                    </TabsList>
                    <TabsContent value="ccm">
                      {ccm ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151a2b]">
                          {renderCCMTable()}
                        </div>
                      ) : <p className="text-sm text-gray-600 dark:text-gray-300">No CCM data available.</p>}
                    </TabsContent>
                    <TabsContent value="crowdstrike">
                      {crowdstrike ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151a2b]">
                          {renderCrowdstrikeTable()}
                        </div>
                      ) : <p className="text-sm text-gray-600 dark:text-gray-300">No Crowdstrike data.</p>}
                    </TabsContent>
                    <TabsContent value="wiz">
                      {wiz ? (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151a2b]">
                          {renderWizTable()}
                        </div>
                      ) : <p className="text-sm text-gray-600 dark:text-gray-300">No Wiz data.</p>}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
