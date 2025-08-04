"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  ChartBarIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  StopIcon,
  SignalIcon,
} from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const API_BASE_URL = "https://soc.autogrc.cloud"

interface HeartbeatMessage {
  timestamp: string
  progress: number
  status: string
  message: string
  jobId: string
}

interface JobStatus {
  job_id: string
  status: "processing" | "completed" | "failed"
  progress: number
  status_message: string
  filename?: string
  created_at?: string
  updated_at?: string
  result?: any
  error?: string
}

interface ProcessingStatus {
  status: "idle" | "uploading" | "processing" | "completed" | "failed"
  progress: number
  fileName?: string
  startTime?: number
  completedAt?: number
  error?: string
  statusMessage?: string
}

interface ProcessingResult {
  status: string
  filename: string
  processing_config: {
    start_page: number
    end_page: number
    sample_control_id: string
  }
  parser_results: {
    extracted_text_length: number
    text_chunks_count: number
    text_chunks: Array<{
      "Control ID": string
      Content: string
    }>
    tables_count: number
    tables: any[]
    regex_pattern_used: string
  }
  rag_results: {
    status: string
    matches_count: number
    matches: Array<{
      source_id: string
      source_text: string
      target_id: string
      target_text: string
      rank: number
    }>
    source_framework: string
    top_k: number
  }
  llm_analysis: {
    status: string
    enhanced_matches_count: number
    enhanced_matches: Array<{
      source_id: string
      source_text: string
      target_id: string
      target_text: string
      rag_rank: number
      rag_similarity_score: number
      equivalence_type: string
      confidence_score: number
      mapping_justification: string
      overlapping_concepts: string
      distinct_concepts: string
      conceptual_strength: string
      llm_audit_notes: string
    }>
    model_used: string
    analysis_type: string
  }
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
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [heartbeatMessages, setHeartbeatMessages] = useState<HeartbeatMessage[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatLogRef = useRef<HTMLDivElement>(null)

  // Auto-scroll heartbeat log to bottom
  useEffect(() => {
    if (heartbeatLogRef.current) {
      heartbeatLogRef.current.scrollTop = heartbeatLogRef.current.scrollHeight
    }
  }, [heartbeatMessages])

  const addHeartbeatMessage = (message: string, progress: number, status: string) => {
    const heartbeat: HeartbeatMessage = {
      timestamp: new Date().toLocaleTimeString(),
      progress,
      status,
      message,
      jobId: currentJobId || "unknown",
    }

    setHeartbeatMessages((prev) => [...prev.slice(-19), heartbeat]) // Keep last 20 messages
    setLastHeartbeat(new Date())

    console.log(`[${heartbeat.timestamp}] ${heartbeat.message} (${heartbeat.progress}%)`)
  }

  const startPolling = (jobId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    setIsPolling(true)
    addHeartbeatMessage("Starting job monitoring...", 0, "processing")

    const pollJobStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/job-status/${jobId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Job not found on server")
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const statusData: JobStatus = await response.json()
        setJobStatus(statusData)

        // Add heartbeat message with actual server data
        addHeartbeatMessage(
          statusData.status_message || `Job ${statusData.status}`,
          statusData.progress || 0,
          statusData.status,
        )

        if (statusData.status === "completed") {
          setIsPolling(false)
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }

          addHeartbeatMessage("✅ Processing completed successfully!", 100, "completed")
          toast.success("SOC mapping completed successfully!")

          // Clean up job on server
          try {
            await fetch(`${API_BASE_URL}/job/${jobId}`, { method: "DELETE" })
          } catch (cleanupError) {
            console.warn("Failed to cleanup job:", cleanupError)
          }
        } else if (statusData.status === "failed") {
          setIsPolling(false)
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }

          addHeartbeatMessage(
            `❌ Processing failed: ${statusData.error || "Unknown error"}`,
            statusData.progress || 0,
            "failed",
          )
          toast.error(`Processing failed: ${statusData.error || "Unknown error"}`)
        }
      } catch (error) {
        console.error("Polling error:", error)
        addHeartbeatMessage(
          `⚠️ Connection issue: ${error instanceof Error ? error.message : "Network error"}`,
          jobStatus?.progress || 0,
          "processing",
        )
        // Don't stop polling on network errors - continue trying
      }
    }

    // Start immediate poll
    pollJobStatus()

    // Set up interval polling every 3 seconds
    pollingIntervalRef.current = setInterval(pollJobStatus, 3000)
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsPolling(false)
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please select a PDF file")
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
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

    // Reset state
    setHeartbeatMessages([])
    setJobStatus(null)
    setCurrentJobId(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      addHeartbeatMessage("📤 Uploading file to server...", 5, "uploading")

      const response = await fetch(`${API_BASE_URL}/start-processing`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = "Failed to start processing"
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (!result.job_id) {
        throw new Error("Server did not return a job ID")
      }

      const jobId = result.job_id
      setCurrentJobId(jobId)

      addHeartbeatMessage(`✅ File uploaded successfully! Job ID: ${jobId}`, 10, "processing")

      // Start polling for status updates
      startPolling(jobId)
    } catch (error) {
      console.error("Upload error:", error)
      addHeartbeatMessage(`❌ Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`, 0, "failed")
      toast.error(error instanceof Error ? error.message : "Failed to start processing")
    }
  }

  const cancelProcessing = async () => {
    if (currentJobId) {
      try {
        await fetch(`${API_BASE_URL}/job/${currentJobId}`, { method: "DELETE" })
        addHeartbeatMessage("🛑 Processing cancelled by user", jobStatus?.progress || 0, "cancelled")
      } catch (error) {
        console.warn("Failed to cancel job:", error)
      }
    }

    stopPolling()
    resetState()
    toast.info("Processing cancelled")
  }

  const resetState = () => {
    stopPolling()
    setFile(null)
    setCurrentJobId(null)
    setJobStatus(null)
    setHeartbeatMessages([])
    setShowResultModal(false)
    setLastHeartbeat(null)
  }

  const downloadReport = async () => {
    if (!currentJobId) {
      toast.error("No job available for download")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/download-report/${currentJobId}`)

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `soc_compliance_report_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Report downloaded successfully!")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download report")
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const getStatusIcon = () => {
    if (!jobStatus) return null

    switch (jobStatus.status) {
      case "completed":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case "failed":
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
      case "processing":
        return <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <SignalIcon className="h-6 w-6 text-blue-500" />
    }
  }

  const isProcessing = jobStatus?.status === "processing" || isPolling
  const isCompleted = jobStatus?.status === "completed"
  const isFailed = jobStatus?.status === "failed"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SOC Mapper</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Map SOC2 Type2 reports against CIS framework with enhanced LLM analysis
        </p>
      </div>

      {/* Upload Section */}
      {!currentJobId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
              Upload SOC2 Type 2 Report
            </CardTitle>
            <CardDescription>
              Upload your SOC2 Type 2 audit report in PDF format to automatically map controls to CIS framework
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
                  <Button onClick={uploadFile} size="sm">
                    Start Processing
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Section */}
      {currentJobId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Processing Status
              </CardTitle>
              <CardDescription>
                Job ID: {currentJobId}
                {lastHeartbeat && (
                  <span className="ml-2 text-green-600">• Last update: {lastHeartbeat.toLocaleTimeString()}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{jobStatus?.progress || 0}%</span>
                </div>
                <Progress value={jobStatus?.progress || 0} className="w-full" />
              </div>

              {/* Current Status */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Current Status:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {jobStatus?.status_message || "Waiting for updates..."}
                </p>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                <span className={isPolling ? "text-green-600" : "text-gray-500"}>
                  {isPolling ? "Connected - receiving updates" : "Disconnected"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {isProcessing && (
                  <Button variant="outline" size="sm" onClick={cancelProcessing}>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}

                {isCompleted && (
                  <>
                    <Button onClick={() => setShowResultModal(true)} size="sm">
                      View Results
                    </Button>
                    <Button variant="outline" onClick={downloadReport} size="sm">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </>
                )}

                {(isCompleted || isFailed) && (
                  <Button variant="outline" onClick={resetState} size="sm">
                    Start New Job
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Heartbeat Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SignalIcon className="h-5 w-5 text-green-600" />
                Live Heartbeat Monitor
              </CardTitle>
              <CardDescription>Real-time updates from the processing server</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={heartbeatLogRef}
                className="h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg p-3 font-mono text-xs space-y-1"
              >
                {heartbeatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No heartbeat messages yet...</p>
                ) : (
                  heartbeatMessages.map((msg, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Badge
                        variant={
                          msg.status === "completed" ? "default" : msg.status === "failed" ? "destructive" : "secondary"
                        }
                        className="text-xs px-1 py-0 min-w-fit"
                      >
                        {msg.progress}%
                      </Badge>
                      <span className="text-gray-500 min-w-fit">[{msg.timestamp}]</span>
                      <span className="text-gray-900 dark:text-gray-100 break-words">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Processing Results</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowResultModal(false)}>
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {jobStatus?.result ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Controls Found</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {jobStatus.result.parser_results?.text_chunks_count || 0}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <p className="font-medium text-green-900 dark:text-green-100">RAG Matches</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {jobStatus.result.rag_results?.matches_count || 0}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                  <p className="font-medium text-purple-900 dark:text-purple-100">LLM Enhanced</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {jobStatus.result.llm_analysis?.enhanced_matches_count || 0}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                  <p className="font-medium text-orange-900 dark:text-orange-100">Text Length</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((jobStatus.result.parser_results?.extracted_text_length || 0) / 1000)}K
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No results available</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button onClick={downloadReport}>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Download Full Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
