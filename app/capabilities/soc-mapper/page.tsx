"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  ChartBarIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface JobStatus {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  fileName: string
  startTime: number
  completedAt?: number
  resultUrl?: string
  error?: string
}

interface ExcelSheet {
  name: string
  data: any[][]
}

interface ExcelData {
  sheets: ExcelSheet[]
  fileName: string
}

export default function SocMapperPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Load job from localStorage on mount
  useEffect(() => {
    const savedJob = localStorage.getItem("socMapperJob")
    if (savedJob) {
      const job = JSON.parse(savedJob) as JobStatus
      if (job.status !== "completed" && job.status !== "failed") {
        setCurrentJob(job)
        startPolling(job.id)
      } else {
        setCurrentJob(job)
      }
    }
  }, [])

  // Save job to localStorage whenever it changes
  useEffect(() => {
    if (currentJob) {
      localStorage.setItem("socMapperJob", JSON.stringify(currentJob))
    }
  }, [currentJob])

  const startPolling = useCallback((jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`https://soc.autogrc.cloud/api/jobs/${jobId}/status`)
        const jobStatus = await response.json()

        setCurrentJob((prev) => (prev ? { ...prev, ...jobStatus } : null))

        if (jobStatus.status === "completed" || jobStatus.status === "failed") {
          clearInterval(pollInterval)
          if (jobStatus.status === "completed" && jobStatus.resultUrl) {
            await downloadAndParseResult(jobStatus.resultUrl)
          }
        }
      } catch (error) {
        console.error("Error polling job status:", error)
        toast.error("Failed to check job status")
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [])

  const downloadAndParseResult = async (resultUrl: string) => {
    try {
      const response = await fetch(resultUrl)
      const arrayBuffer = await response.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })

      const sheets: ExcelSheet[] = workbook.SheetNames.map((sheetName) => ({
        name: sheetName,
        data: XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }),
      }))

      setExcelData({
        sheets,
        fileName: currentJob?.fileName.replace(".pdf", "_mapped.xlsx") || "soc_mapping_result.xlsx",
      })

      setShowResultModal(true)
      toast.success("SOC mapping completed successfully!")
    } catch (error) {
      console.error("Error downloading result:", error)
      toast.error("Failed to download mapping result")
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please select a PDF file")
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      // 50MB limit
      toast.error("File size must be less than 50MB")
      return
    }

    setFile(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("https://soc.autogrc.cloud/api/upload-soc-report", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()
      const newJob: JobStatus = {
        id: result.jobId,
        status: "pending",
        progress: 0,
        fileName: file.name,
        startTime: Date.now(),
      }

      setCurrentJob(newJob)
      setFile(null)
      startPolling(result.jobId)
      toast.success("SOC report uploaded successfully. Processing started.")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload SOC report")
    } finally {
      setIsUploading(false)
    }
  }

  const downloadExcel = () => {
    if (!excelData || !currentJob?.resultUrl) return

    // Create a link to download the original Excel file
    const link = document.createElement("a")
    link.href = currentJob.resultUrl
    link.download = excelData.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetJob = () => {
    setCurrentJob(null)
    setExcelData(null)
    setShowResultModal(false)
    localStorage.removeItem("socMapperJob")
  }

  const getStatusIcon = () => {
    if (!currentJob) return null

    switch (currentJob.status) {
      case "completed":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case "failed":
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
      default:
        return <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusText = () => {
    if (!currentJob) return ""

    switch (currentJob.status) {
      case "pending":
        return "Queued for processing..."
      case "processing":
        return "Mapping SOC controls to frameworks..."
      case "completed":
        return "Mapping completed successfully!"
      case "failed":
        return currentJob.error || "Processing failed"
      default:
        return ""
    }
  }

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SOC Mapper</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Map SOC2 Type2 reports against selected frameworks</p>
      </div>

      {!currentJob ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Upload SOC2 Type 2 Report
            </CardTitle>
            <CardDescription>
              Upload your SOC2 Type 2 audit report in PDF format to automatically map controls to compliance frameworks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {file ? file.name : "Drop your SOC2 report here, or click to browse"}
                </p>
                <p className="text-sm text-gray-500">PDF files up to 50MB are supported</p>
              </div>
              <input type="file" accept=".pdf" onChange={handleFileInputChange} className="hidden" id="file-upload" />
              <label
                htmlFor="file-upload"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Browse Files
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400 font-semibold text-sm">PDF</span>
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                    Remove
                  </Button>
                  <Button onClick={uploadFile} disabled={isUploading} size="sm">
                    {isUploading ? "Uploading..." : "Start Mapping"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Processing SOC Report
            </CardTitle>
            <CardDescription>
              {currentJob.fileName} • Started {formatDuration(currentJob.startTime)}
              {currentJob.completedAt &&
                ` • Completed in ${formatDuration(currentJob.startTime, currentJob.completedAt)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getStatusText()}</span>
                <span>{currentJob.progress}%</span>
              </div>
              <Progress value={currentJob.progress} className="w-full" />
            </div>

            {currentJob.status === "completed" && (
              <div className="flex gap-3">
                <Button onClick={() => setShowResultModal(true)}>View Results</Button>
                <Button variant="outline" onClick={downloadExcel}>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Excel
                </Button>
                <Button variant="outline" onClick={resetJob}>
                  Start New Mapping
                </Button>
              </div>
            )}

            {currentJob.status === "failed" && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetJob}>
                  Try Again
                </Button>
              </div>
            )}

            {(currentJob.status === "pending" || currentJob.status === "processing") && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>• Extracting controls from SOC report</p>
                <p>• Mapping to compliance frameworks</p>
                <p>• Generating detailed mapping report</p>
                <p className="mt-2 font-medium">
                  This process can take up to 1 hour. You can safely navigate away from this page.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>SOC Mapping Results</DialogTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadExcel}>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowResultModal(false)}>
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {excelData && (
            <div className="overflow-hidden">
              <Tabs defaultValue={excelData.sheets[0]?.name} className="w-full">
                <TabsList className="grid w-full grid-cols-auto overflow-x-auto">
                  {excelData.sheets.map((sheet) => (
                    <TabsTrigger key={sheet.name} value={sheet.name} className="whitespace-nowrap">
                      {sheet.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {excelData.sheets.map((sheet) => (
                  <TabsContent key={sheet.name} value={sheet.name} className="mt-4">
                    <div className="border rounded-lg overflow-auto max-h-96">
                      <Table>
                        <TableHeader>
                          {sheet.data[0] && (
                            <TableRow>
                              {sheet.data[0].map((header: any, index: number) => (
                                <TableHead key={index} className="whitespace-nowrap">
                                  {header}
                                </TableHead>
                              ))}
                            </TableRow>
                          )}
                        </TableHeader>
                        <TableBody>
                          {sheet.data.slice(1).map((row: any[], rowIndex: number) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell: any, cellIndex: number) => (
                                <TableCell key={cellIndex} className="whitespace-nowrap">
                                  {typeof cell === "string" && cell.length > 50 ? (
                                    <span title={cell}>{cell.substring(0, 50)}...</span>
                                  ) : (
                                    cell
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <Badge variant="secondary">{sheet.data.length - 1} rows</Badge>
                      <Badge variant="secondary">{sheet.data[0]?.length || 0} columns</Badge>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
