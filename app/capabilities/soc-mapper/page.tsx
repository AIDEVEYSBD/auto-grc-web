"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import {
  ChartBarIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  StopIcon,
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

interface ProcessingStatus {
  status: "idle" | "uploading" | "processing" | "completed" | "failed"
  progress: number
  fileName?: string
  statusMessage?: string
  startTime?: number
  completedAt?: number
  error?: string
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
      "Content": string
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

// Change this to your server URL
const API_BASE_URL = "https://soc.autogrc.cloud"

export default function SocMapperPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: "idle",
    progress: 0
  })
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const convertResultToExcel = useCallback((result: ProcessingResult): ExcelData => {
    const sheets: ExcelSheet[] = []

    // Sheet 1: LLM Enhanced Analysis Results (Primary Results)
    if (result.llm_analysis.enhanced_matches && result.llm_analysis.enhanced_matches.length > 0) {
      const enhancedData = [
        ["RAG Rank", "CIS Control ID", "CIS Control Text", "SOC Control ID", "SOC Control Text", 
         "Equivalence Type", "Confidence Score", "Mapping Justification", "Overlapping Concepts", 
         "Distinct Concepts", "Conceptual Strength", "LLM Audit Notes"]
      ]
      
      result.llm_analysis.enhanced_matches.forEach(match => {
        enhancedData.push([
          match.rag_rank,
          match.source_id,
          match.source_text.substring(0, 200) + (match.source_text.length > 200 ? "..." : ""),
          match.target_id,
          match.target_text.substring(0, 200) + (match.target_text.length > 200 ? "..." : ""),
          match.equivalence_type,
          match.confidence_score,
          match.mapping_justification,
          match.overlapping_concepts,
          match.distinct_concepts,
          match.conceptual_strength,
          match.llm_audit_notes
        ])
      })

      sheets.push({
        name: "LLM Enhanced Analysis",
        data: enhancedData
      })
    }

    // Sheet 2: RAG Mapping Results (Original RAG Results)
    if (result.rag_results.matches && result.rag_results.matches.length > 0) {
      const mappingData = [
        ["Rank", "CIS Control ID", "CIS Control Text", "SOC Control ID", "SOC Control Text"]
      ]
      
      result.rag_results.matches.forEach(match => {
        mappingData.push([
          match.rank,
          match.source_id,
          match.source_text.substring(0, 200) + (match.source_text.length > 200 ? "..." : ""),
          match.target_id,
          match.target_text.substring(0, 200) + (match.target_text.length > 200 ? "..." : "")
        ])
      })

      sheets.push({
        name: "RAG Mapping Results",
        data: mappingData
      })
    }

    // Sheet 3: Extracted SOC Controls
    if (result.parser_results.text_chunks && result.parser_results.text_chunks.length > 0) {
      const chunksData = [
        ["Control ID", "Control Content"]
      ]
      
      result.parser_results.text_chunks.forEach(chunk => {
        chunksData.push([
          chunk["Control ID"],
          chunk["Content"]
        ])
      })

      sheets.push({
        name: "Extracted SOC Controls",
        data: chunksData
      })
    }

    // Sheet 4: Processing Summary
    const summaryData = [
      ["Metric", "Value"],
      ["Filename", result.filename],
      ["Pages Processed", `${result.processing_config.start_page} - ${result.processing_config.end_page}`],
      ["Regex Pattern", result.processing_config.sample_control_id],
      ["Extracted Text Length", result.parser_results.extracted_text_length],
      ["Text Chunks Found", result.parser_results.text_chunks_count],
      ["Tables Found", result.parser_results.tables_count],
      ["RAG Status", result.rag_results.status],
      ["RAG Matches", result.rag_results.matches_count],
      ["LLM Analysis Status", result.llm_analysis.status],
      ["LLM Enhanced Matches", result.llm_analysis.enhanced_matches_count],
      ["LLM Model Used", result.llm_analysis.model_used || "N/A"],
      ["Source Framework", result.rag_results.source_framework || "N/A"],
      ["Top K Matches", result.rag_results.top_k || "N/A"]
    ]

    sheets.push({
      name: "Processing Summary",
      data: summaryData
    })

    return {
      sheets,
      fileName: result.filename.replace(".pdf", "_enhanced_soc_mapping.xlsx")
    }
  }, [])

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

  const startPolling = (jobId: string, initialProgress?: number) => {
    let networkErrorCount = 0
    let hardErrorCount = 0
    const maxNetworkErrors = 20     // Allow many network errors
    const maxHardErrors = 5         // Fewer hard errors (404, 500, etc.)
    let currentBackoffDelay = 4000  // Start with 4 seconds
    const maxBackoffDelay = 30000   // Max 30 seconds between polls
    let lastKnownProgress = initialProgress || 0       // Track progress to prevent regression
    
    const pollJobStatus = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000) // Increased to 45s timeout
        
        const statusResponse = await fetch(`${API_BASE_URL}/job-status/${jobId}`, {
          method: 'GET',
          mode: 'cors',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        
        clearTimeout(timeoutId)
        
        // Handle different HTTP status codes
        if (!statusResponse.ok) {
          if (statusResponse.status === 404) {
            hardErrorCount++
            throw new Error("Job not found on server")
          }
          if (statusResponse.status === 524 || statusResponse.status === 502 || statusResponse.status === 503) {
            // These are network/proxy timeouts, not hard errors
            networkErrorCount++
            throw new Error(`Network timeout (${statusResponse.status}) - processing continues on server`)
          }
          if (statusResponse.status >= 500) {
            hardErrorCount++
            throw new Error(`Server error: ${statusResponse.status}`)
          }
          // For other 4xx errors
          hardErrorCount++
          throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`)
        }

        const statusData = await statusResponse.json()
        
        // Reset error counters and backoff on successful response
        networkErrorCount = 0
        hardErrorCount = 0
        currentBackoffDelay = 4000 // Reset to 4 seconds
        
        // Ensure progress never goes backwards
        const newProgress = Math.max(statusData.progress || lastKnownProgress, lastKnownProgress)
        lastKnownProgress = newProgress
        
        console.log(`Job ${jobId} status: ${newProgress}% - ${statusData.status_message}`)
        
        // Update progress based on job status
        setProcessingStatus(prev => ({
          ...prev,
          progress: newProgress,
          statusMessage: statusData.status_message || prev.statusMessage,
          status: statusData.status === "completed" ? "completed" : 
                  statusData.status === "failed" ? "failed" : "processing"
        }))

        if (statusData.status === "completed") {
          // Job completed successfully
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }

          setProcessingStatus(prev => ({
            ...prev,
            status: "completed",
            progress: 100,
            statusMessage: "Processing completed successfully!",
            completedAt: Date.now()
          }))

          // Set the result
          setProcessingResult(statusData.result)
          
          // Convert result to Excel format
          const excelData = convertResultToExcel(statusData.result)
          setExcelData(excelData)
          
          setFile(null)
          
          if (statusData.result.rag_results.status === "completed" && statusData.result.llm_analysis.status === "completed") {
            toast.success("SOC mapping and LLM analysis completed successfully!")
          } else if (statusData.result.rag_results.status === "completed") {
            toast.warning(`RAG mapping completed but LLM analysis: ${statusData.result.llm_analysis.status}`)
          } else {
            toast.warning(`Processing completed but RAG matching: ${statusData.result.rag_results.status}`)
          }

        } else if (statusData.status === "failed") {
          // Job failed
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }

          setProcessingStatus(prev => ({
            ...prev,
            status: "failed",
            statusMessage: statusData.status_message || prev.statusMessage,
            error: statusData.error || "Processing failed"
          }))

          setCurrentJobId(null)
          toast.error(`SOC report processing failed: ${statusData.error || "Unknown error"}`)
        }

      } catch (pollError) {
        console.warn("Polling error:", pollError)
        
        // Determine error type
        let isNetworkError = false
        let errorMessage = "Unknown error"
        
        if (pollError instanceof Error) {
          errorMessage = pollError.message
          const msg = errorMessage.toLowerCase()
          
          // Network errors: timeouts, aborts, CORS, fetch failures
          if (msg.includes("524") || msg.includes("502") || msg.includes("503") || 
              msg.includes("timeout") || msg.includes("aborted") || 
              msg.includes("cors") || msg.includes("network") ||
              msg.includes("fetch") || pollError.name === 'AbortError') {
            isNetworkError = true
            networkErrorCount++
          } else {
            hardErrorCount++
          }
        } else {
          hardErrorCount++
        }
        
        console.log(`Error counts - Network: ${networkErrorCount}/${maxNetworkErrors}, Hard: ${hardErrorCount}/${maxHardErrors}`)
        
        // Update UI with network status
        if (isNetworkError) {
          setProcessingStatus(prev => ({
            ...prev,
            statusMessage: `Network timeout - processing continues on server (${networkErrorCount}/${maxNetworkErrors})`
          }))
          
          // Implement exponential backoff for network errors
          currentBackoffDelay = Math.min(currentBackoffDelay * 1.5, maxBackoffDelay)
        }
        
        // Check if we should stop polling
        const shouldStop = hardErrorCount >= maxHardErrors || networkErrorCount >= maxNetworkErrors
        
        if (shouldStop) {
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          
          let finalErrorMessage = errorMessage
          
          // Provide specific guidance based on error type
          if (networkErrorCount >= maxNetworkErrors) {
            finalErrorMessage = `Multiple network timeouts detected (${networkErrorCount}). Your processing is likely still running on the server. The job will continue in the background. You can close this window and return later, or try refreshing to reconnect.`
            
            // Don't mark as failed for network issues - suggest reconnection
            setProcessingStatus(prev => ({
              ...prev,
              statusMessage: "Network connection lost - job continues on server",
              error: finalErrorMessage
            }))
            
            // Show a less alarming toast for network issues
            toast.warning("Connection lost - job continues on server. Try refreshing to reconnect.")
          } else {
            // Hard errors - mark as failed
            setProcessingStatus(prev => ({
              ...prev,
              status: "failed",
              statusMessage: "Processing failed",
              error: finalErrorMessage
            }))
            
            setCurrentJobId(null)
            toast.error("Processing failed: " + finalErrorMessage)
          }
        }
      }
    }

    // Start immediate poll
    pollJobStatus()

    // Set up interval polling - start with base interval, will be cleared and recreated with backoff if needed
    let currentInterval = setInterval(pollJobStatus, currentBackoffDelay)
    setPollingInterval(currentInterval)
    
    // Update the interval when backoff changes
    const updatePollingInterval = () => {
      if (currentInterval) {
        clearInterval(currentInterval)
      }
      currentInterval = setInterval(pollJobStatus, currentBackoffDelay)
      setPollingInterval(currentInterval)
    }
    
    // This doesn't actually work in the current structure, but leaving the logic
    // for potential future enhancement where polling delay could be dynamic
  }

  const uploadFile = async () => {
    if (!file) return

    setProcessingStatus({
      status: "uploading",
      progress: 5,
      statusMessage: "Uploading file and starting processing...",
      fileName: file.name,
      startTime: Date.now()
    })

    const formData = new FormData()
    formData.append("file", file)

    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 5000 // 5 seconds between retries

    const attemptUpload = async (): Promise<any> => {
      try {
        // Show current attempt
        if (retryCount > 0) {
          setProcessingStatus(prev => ({
            ...prev,
            progress: 5 + (retryCount * 2),
            statusMessage: `Upload attempt ${retryCount + 1}/${maxRetries + 1}...`
          }))
        }

        // Health check with shorter timeout for faster feedback
        try {
          const healthController = new AbortController()
          const healthTimeout = setTimeout(() => healthController.abort(), 10000)
          
          const healthResponse = await fetch(`${API_BASE_URL}/health`, {
            method: "GET",
            mode: "cors",
            signal: healthController.signal
          })
          
          clearTimeout(healthTimeout)
          
          if (!healthResponse.ok) {
            throw new Error(`Server health check failed: ${healthResponse.status}`)
          }
        } catch (healthError) {
          if (healthError.name === 'AbortError') {
            throw new Error("Server health check timed out - server may be overloaded")
          }
          throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check if the server is running.`)
        }

        // Update progress after health check
        setProcessingStatus(prev => ({
          ...prev,
          progress: 8,
          statusMessage: "Server accessible, starting file upload..."
        }))

        // Upload with extended timeout
        const uploadController = new AbortController()
        const uploadTimeout = setTimeout(() => uploadController.abort(), 120000) // 2 minutes timeout
        
        const startResponse = await fetch(`${API_BASE_URL}/start-processing`, {
          method: "POST",
          mode: "cors",
          body: formData,
          signal: uploadController.signal
        })

        clearTimeout(uploadTimeout)

        // Handle different response scenarios
        if (!startResponse.ok) {
          let errorMessage = "Failed to start processing"
          
          // Handle 524 specifically - this means the job might have started but response timed out
          if (startResponse.status === 524) {
            throw new Error("UPLOAD_TIMEOUT_524")
          }
          
          try {
            const errorData = await startResponse.json()
            errorMessage = errorData.detail || errorMessage
          } catch {
            errorMessage = `HTTP ${startResponse.status}: ${startResponse.statusText}`
          }
          throw new Error(errorMessage)
        }

        const startResult = await startResponse.json()
        
        // Validate that we got a job ID
        if (!startResult.job_id) {
          throw new Error("Server did not return a job ID")
        }
        
        return startResult.job_id

      } catch (error) {
        retryCount++
        
        // Handle specific error types
        if (error instanceof Error) {
          const errorMsg = error.message
          
          // For 524 or network timeouts, the job might have started - check for existing jobs
          if (errorMsg.includes("524") || errorMsg.includes("UPLOAD_TIMEOUT_524") || 
              errorMsg.includes("timeout") || error.name === 'AbortError') {
            
            if (retryCount <= maxRetries) {
              setProcessingStatus(prev => ({
                ...prev,
                statusMessage: `Upload timeout (attempt ${retryCount}/${maxRetries + 1}) - job may have started, retrying...`
              }))
              
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, retryDelay))
              
              // Before retrying, check if there are any recent jobs that might be ours
              try {
                const debugResponse = await fetch(`${API_BASE_URL}/debug/all-jobs`)
                if (debugResponse.ok) {
                  const debugData = await debugResponse.json()
                  
                  // Look for a recent job with our filename
                  const recentJobs = Object.entries(debugData.jobs).filter(([jobId, job]: [string, any]) => {
                    const jobTime = new Date(job.created_at).getTime()
                    const timeDiff = Date.now() - jobTime
                    return timeDiff < 300000 && job.filename === file.name // Within 5 minutes
                  })
                  
                  if (recentJobs.length > 0) {
                    const [foundJobId, foundJob] = recentJobs[recentJobs.length - 1] // Get most recent
                    console.log(`Found existing job ${foundJobId} for file ${file.name}`)
                    
                    // Update processing status with found job progress
                    setProcessingStatus(prev => ({
                      ...prev,
                      progress: Math.max(foundJob.progress || 15, prev.progress),
                      statusMessage: `Found existing job - ${foundJob.status_message || 'Processing...'}`
                    }))
                    
                    return foundJobId
                  }
                }
              } catch (debugError) {
                console.warn("Could not check for existing jobs:", debugError)
              }
              
              return attemptUpload() // Retry
            }
          }
          
          // For other errors, retry if we haven't exceeded max retries
          if (retryCount <= maxRetries && !errorMsg.includes("health check")) {
            setProcessingStatus(prev => ({
              ...prev,
              statusMessage: `Upload failed (attempt ${retryCount}/${maxRetries + 1}), retrying...`
            }))
            
            await new Promise(resolve => setTimeout(resolve, retryDelay))
            return attemptUpload()
          }
        }
        
        // If we've exhausted retries or it's a non-retryable error, throw it
        throw error
      }
    }

    try {
      const jobId = await attemptUpload()
      setCurrentJobId(jobId)

      setProcessingStatus(prev => ({ 
        ...prev, 
        status: "processing", 
        progress: Math.max(prev.progress, 15),
        statusMessage: "File uploaded successfully, processing started..."
      }))

      // Start polling for job status
      startPolling(jobId, 15)

    } catch (error) {
      console.error("Upload error after all retries:", error)
      let errorMessage = error instanceof Error ? error.message : "Upload failed"
      
      // Provide specific guidance for common errors
      if (errorMessage.includes("CORS") || errorMessage.includes("Cross-Origin") || errorMessage.includes("524")) {
        errorMessage = `Upload timed out or CORS error. This often happens with large files or server overload. The job may have started anyway - check the server logs or try refreshing. If the issue persists, try a smaller file or contact support.`
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        errorMessage = `Cannot connect to server at ${API_BASE_URL}. Please verify the server is running and accessible.`
      } else if (errorMessage.includes("timeout") || errorMessage.includes("AbortError")) {
        errorMessage = `Upload timed out after ${retryCount} attempts. The server may be processing a large backlog. Your job might have started - check back in a few minutes or try with a smaller file.`
      }
      
      setProcessingStatus(prev => ({
        ...prev,
        status: "failed",
        statusMessage: "Upload failed after retries",
        error: errorMessage
      }))
      toast.error(errorMessage)
    }
  }

  const cancelProcessing = async () => {
    if (currentJobId && pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
      
      try {
        // Clean up the job on the server
        await fetch(`${API_BASE_URL}/job/${currentJobId}`, { method: "DELETE" })
      } catch (error) {
        console.warn("Failed to cancel job:", error)
      }
      
      setCurrentJobId(null)
      setProcessingStatus({ status: "idle", progress: 0 })
      toast.info("Processing cancelled")
    }
  }

  const downloadExcel = async () => {
    if (!currentJobId) {
      toast.error("No job ID available for download")
      return
    }

    try {
      // Download the server-generated Excel report
      const response = await fetch(`${API_BASE_URL}/download-report/${currentJobId}`)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }
      
      // Get the filename from the response headers or use a default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'soc_compliance_report.xlsx'
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }
      
      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Report downloaded successfully!")
      
    } catch (error) {
      console.error('Download error:', error)
      toast.error(`Failed to download report: ${error.message}`)
      
      // Fallback to client-side Excel generation if server download fails
      if (excelData) {
        const workbook = XLSX.utils.book_new()
        excelData.sheets.forEach(sheet => {
          const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)
          XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
        })
        XLSX.writeFile(workbook, excelData.fileName)
        toast.info("Downloaded client-generated Excel as fallback")
      }
    }
  }

  const resetProcessing = () => {
    // Clean up polling if active
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    
    // Clean up job if exists
    if (currentJobId) {
      fetch(`${API_BASE_URL}/job/${currentJobId}`, { method: "DELETE" }).catch(console.warn)
      setCurrentJobId(null)
    }
    
    setProcessingStatus({ status: "idle", progress: 0 })
    setProcessingResult(null)
    setExcelData(null)
    setShowResultModal(false)
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup polling interval on component unmount
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const getStatusIcon = () => {
    switch (processingStatus.status) {
      case "completed":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />
      case "failed":
        return <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
      case "uploading":
      case "processing":
        return <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    // Use the detailed status message from backend if available
    if (processingStatus.statusMessage) {
      return processingStatus.statusMessage
    }
    
    // Fallback to basic status text
    switch (processingStatus.status) {
      case "uploading":
        return "Starting SOC report processing..."
      case "processing":
        return "Processing and mapping controls..."
      case "completed":
        return "Processing completed successfully!"
      case "failed":
        return processingStatus.error || "Processing failed"
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
        <p className="text-gray-600 dark:text-gray-400 mt-1">Map SOC2 Type2 reports against CIS framework with enhanced LLM analysis</p>
      </div>

      {processingStatus.status === "idle" ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-green-700 text-green-700 text-green-700 text-yellow-400 text-zinc-950 text-white text-black text-emerald-300 text-emerald-300 text-green-900 text-green-600 text-lime-700 text-amber-950 text-zinc-500 text-slate-400" />
              Upload SOC2 Type 2 Report
            </CardTitle>
            <CardDescription>
              Upload your SOC2 Type 2 audit report in PDF format to automatically map controls to CIS framework with enhanced LLM analysis for conceptual overlap assessment
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
                    Start Mapping
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
              {processingStatus.fileName} 
              {processingStatus.startTime && ` • Started ${formatDuration(processingStatus.startTime)}`}
              {processingStatus.completedAt &&
                ` • Completed in ${formatDuration(processingStatus.startTime!, processingStatus.completedAt)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{getStatusText()}</span>
                <span>{processingStatus.progress}%</span>
              </div>
              <Progress value={processingStatus.progress} className="w-full" />
            </div>

            {processingStatus.status === "completed" && processingResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Controls Found</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {processingResult.parser_results.text_chunks_count}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                    <p className="font-medium text-green-900 dark:text-green-100">RAG Matches</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {processingResult.rag_results.matches_count}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                    <p className="font-medium text-purple-900 dark:text-purple-100">LLM Enhanced</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {processingResult.llm_analysis.enhanced_matches_count}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg">
                    <p className="font-medium text-orange-900 dark:text-orange-100">Text Length</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(processingResult.parser_results.extracted_text_length / 1000)}K
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setShowResultModal(true)}>View Results</Button>
                  <Button variant="outline" onClick={downloadExcel}>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button variant="outline" onClick={resetProcessing}>
                    Start New Mapping
                  </Button>
                </div>
              </div>
            )}

            {processingStatus.status === "failed" && (
              <div className="space-y-3">
                <div className="flex gap-3 flex-wrap">
                  <Button variant="outline" onClick={resetProcessing}>
                    Try Again
                  </Button>
                  {currentJobId && (
                    <Button variant="outline" onClick={() => {
                      // Try to reconnect to existing job
                      setProcessingStatus(prev => ({
                        ...prev,
                        status: "processing",
                        statusMessage: "Reconnecting to existing job..."
                      }))
                      startPolling(currentJobId, processingStatus.progress)
                    }}>
                      Reconnect to Job
                    </Button>
                  )}
                  <Button variant="outline" onClick={async () => {
                    try {
                      // Check for jobs with our filename
                      const debugResponse = await fetch(`${API_BASE_URL}/debug/all-jobs`)
                      if (!debugResponse.ok) {
                        throw new Error(`Server responded with ${debugResponse.status}`)
                      }
                      
                      const debugData = await debugResponse.json()
                      const recentJobs = Object.entries(debugData.jobs).filter(([jobId, job]: [string, any]) => {
                        const jobTime = new Date(job.created_at).getTime()
                        const timeDiff = Date.now() - jobTime
                        return timeDiff < 1800000 && job.filename === processingStatus.fileName // Within 30 minutes
                      })
                      
                      if (recentJobs.length > 0) {
                        const [foundJobId, foundJob] = recentJobs[recentJobs.length - 1] as [string, any]
                        setCurrentJobId(foundJobId)
                        
                        toast.success(`Found existing job for ${foundJob.filename}!`)
                        
                        setProcessingStatus(prev => ({
                          ...prev,
                          status: "processing",
                          progress: foundJob.progress || 15,
                          statusMessage: `Reconnected to existing job - ${foundJob.status_message || 'Processing...'}`
                        }))
                        
                        startPolling(foundJobId, foundJob.progress || 15)
                      } else {
                        toast.info(`No recent jobs found for ${processingStatus.fileName}`)
                      }
                    } catch (error) {
                      console.error('Check jobs error:', error)
                      toast.error(`Failed to check for existing jobs: ${error.message}`)
                    }
                  }}>
                    Check for Existing Jobs
                  </Button>
                  <Button variant="outline" onClick={async () => {
                    try {
                      const response = await fetch(`${API_BASE_URL}/test-connection`)
                      if (response.ok) {
                        toast.success("Server connection test successful!")
                      } else {
                        toast.error(`Server test failed: ${response.status}`)
                      }
                    } catch (error) {
                      toast.error(`Connection test failed: ${error.message}`)
                    }
                  }}>
                    Test Connection
                  </Button>
                </div>
                {processingStatus.error && (
                  <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                    {processingStatus.error}
                  </div>
                )}
              </div>
            )}

            {(processingStatus.status === "uploading" || processingStatus.status === "processing") && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={cancelProcessing}>
                    <StopIcon className="h-4 w-4 mr-2" />
                    Cancel Processing
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium mb-1">Processing Information:</p>
                  <p>Total time can take up to 40+ minutes for complex documents. The system has enhanced resilience for both upload timeouts and network issues during processing. 
                  Upload attempts are automatically retried up to 3 times with extended timeouts. If you see "Network timeout" messages during processing, your job continues running on the server.</p>
                  {currentJobId && (
                    <p className="mt-1">Job ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">{currentJobId}</code></p>
                  )}
                  <p className="mt-1 text-xs">💡 <strong>Tip:</strong> If upload fails, try the "Check for Existing Jobs" button - your job might have started successfully despite the timeout.</p>
                </div>
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
                  Download Report
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
