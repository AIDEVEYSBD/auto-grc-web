"use client"

import type React from "react"
import { useState, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react"
import type { Integration } from "@/types"

interface QualysSSLIntegrationCardProps {
  integration: Integration
}

const gradeConfig: Record<string, { color: string; icon: React.ElementType }> = {
  "A+": { color: "bg-green-500", icon: ShieldCheck },
  A: { color: "bg-green-500", icon: ShieldCheck },
  B: { color: "bg-blue-500", icon: Shield },
  C: { color: "bg-yellow-500", icon: ShieldAlert },
  D: { color: "bg-orange-500", icon: ShieldAlert },
  E: { color: "bg-red-500", icon: ShieldX },
  F: { color: "bg-red-500", icon: ShieldX },
  T: { color: "bg-gray-500", icon: Shield },
  M: { color: "bg-gray-500", icon: Shield },
}

const ResultRenderer = ({ data, pathPrefix = "", selectedFields }: any) => {
  if (typeof data !== "object" || data === null) {
    return <span className="text-gray-400">No details</span>
  }

  return (
    <div className="space-y-1 text-sm">
      {Object.entries(data).map(([key, value]) => {
        const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key
        const isSelected = selectedFields.some((p: string) => p.startsWith(currentPath))

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          return (
            <Accordion key={key} type="single" collapsible className="w-full">
              <AccordionItem value={key}>
                <AccordionTrigger className="text-xs font-semibold capitalize">{key}</AccordionTrigger>
                <AccordionContent>
                  <ResultRenderer data={value} pathPrefix={currentPath} selectedFields={selectedFields} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )
        }

        return (
          <div key={key} className="flex justify-between items-center py-1">
            <span className="font-medium capitalize text-gray-600 dark:text-gray-400">
              {key.replace(/([A-Z])/g, " $1")}
            </span>
            <span className="font-mono text-xs text-right max-w-[50%] truncate">
              {isSelected ? (
                typeof value === "boolean" ? (
                  <Badge variant={value ? "destructive" : "default"}>{value ? "Yes" : "No"}</Badge>
                ) : (
                  String(value)
                )
              ) : (
                "***"
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function QualysSSLIntegrationCard({ integration }: QualysSSLIntegrationCardProps) {
  const [hostname, setHostname] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleAnalyze = async () => {
    if (!hostname) {
      setError("Please enter a hostname to analyze.")
      return
    }
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const response = await fetch(`/api/ssllabs?host=${hostname}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Analysis failed.")
      }
      setAnalysisResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedFields = integration.config?.selectedFields || []

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{integration.name}</CardTitle>
            <CardDescription>Perform real-time SSL/TLS server analysis.</CardDescription>
          </div>
          <Badge variant="secondary">Connected</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Enter hostname (e.g., vercel.com)"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze
          </Button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {analysisResult && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{analysisResult.host}</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Overall Grade</span>
                {analysisResult.endpoints.map((ep: any, index: number) => {
                  const config = gradeConfig[ep.grade] || gradeConfig["T"]
                  return (
                    <Badge key={index} className={`${config.color} text-white text-lg`}>
                      <config.icon className="h-4 w-4 mr-1" />
                      {ep.grade}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <Accordion type="multiple" className="w-full" defaultValue={["endpoints-0"]}>
              {analysisResult.endpoints.map((endpoint: any, index: number) => (
                <AccordionItem key={endpoint.ipAddress} value={`endpoints-${index}`}>
                  <AccordionTrigger>
                    Endpoint: {endpoint.ipAddress} (Grade: {endpoint.grade})
                  </AccordionTrigger>
                  <AccordionContent>
                    <ResultRenderer
                      data={endpoint.details}
                      pathPrefix={`endpoints[${index}].details`}
                      selectedFields={selectedFields}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(QualysSSLIntegrationCard)
