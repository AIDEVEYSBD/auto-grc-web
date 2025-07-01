"use client"

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from "react"
import { CloudArrowUpIcon, DocumentIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface JobStatus {
  job_id: string
  status: "queued" | "processing" | "completed" | "failed"
  progress: number
  stage: string
  filename: string
  download_url?: string
  download_filename?: string
  error?: string
}

export default function SocMapperPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [checkJobId, setCheckJobId] = useState<string>("")
  const [showJobCheck, setShowJobCheck] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed.")
        setFile(null)
        return
      }
      setError(null)
      setFile(selectedFile)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type !== "application/pdf") {
        setError("Only PDF files are allowed.")
        setFile(null)
        return
      }
      setError(null)
      setFile(droppedFile)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/status/${jobId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch job status")
      }
      
      const status: JobStatus = await response.json()
      setJobStatus(status)
      
      // Handle completion
      if (status.status === "completed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        
        // Auto-download the file
        const downloadUrl = `http://localhost:8000/download/${jobId}`
        const a = document.createElement("a")
        a.href = downloadUrl
        a.download = status.download_filename || "soc-mapping-report.xlsx"
        document.body.appendChild(a)
        a.click()
        a.remove()
        
        // Reset state after successful download
        setTimeout(() => {
          setIsUploading(false)
          setFile(null)
          setJobId(null)
          setJobStatus(null)
        }, 2000)
      } else if (status.status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setError(status.error || "Processing failed")
        setIsUploading(false)
        setJobId(null)
        setJobStatus(null)
      }
    } catch (err) {
      console.error("Error polling job status:", err)
      // Don't stop polling on transient errors
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file to upload.")
      return
    }

    setIsUploading(true)
    setError(null)
    setJobStatus(null)

    const formData = new FormData()
    formData.append("soc_pdf", file)
    // Hardcoded values as requested
    formData.append("start_page", "36")
    formData.append("end_page", "81")
    formData.append("pattern", "\\d+\\.\\d+")
    formData.append("top_k", "5")
    formData.append("workers", "5")

    try {
      // First, check if we're in test mode
      const isTestMode = window.location.search.includes("test=true")
      const endpoint = isTestMode ? "http://localhost:8000/test" : "http://localhost:8000/process"
      
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "An unknown error occurred.")
      }

      if (isTestMode) {
        // Test mode - direct download
        const blob = await response.blob()
        const contentDisposition = response.headers.get("content-disposition")
        let filename = "soc-mapping-report.xlsx"
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/)
          if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1]
          }
        }

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        setFile(null)
        setIsUploading(false)
      } else {
        // Production mode - job submission
        const result = await response.json()
        setJobId(result.job_id)
        
        // Initial status
        setJobStatus({
          job_id: result.job_id,
          status: "queued",
          progress: 0,
          stage: "Initializing",
          filename: file.name,
        })
        
        // Start polling
        pollIntervalRef.current = setInterval(() => {
          pollJobStatus(result.job_id)
        }, 2000) // Poll every 2 seconds
        
        // Immediate first poll
        pollJobStatus(result.job_id)
      }
    } catch (err: any) {
      setError(err.message || "Failed to process the file. Please ensure the backend server is running.")
      setIsUploading(false)
    }
  }

  const getProgressColor = () => {
    if (!jobStatus) return "bg-blue-600"
    if (jobStatus.status === "failed") return "bg-red-600"
    if (jobStatus.status === "completed") return "bg-green-600"
    return "bg-blue-600"
  }

  const getStatusMessage = () => {
    if (!jobStatus) return "Uploading..."
    
    switch (jobStatus.status) {
      case "queued":
        return "Job queued, waiting to start..."
      case "processing":
        return jobStatus.stage || "Processing..."
      case "completed":
        return "Processing complete! Downloading..."
      case "failed":
        return "Processing failed"
      default:
        return "Processing..."
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SOC Mapper</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upload a SOC2 Type 2 report to map it against the CIS framework.
        </p>
      </div>

      <div className="glass-card p-8">
        <div className="w-full max-w-lg mx-auto">
          {!isUploading ? (
            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "flex justify-center w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 transition-colors",
                  isDragOver && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                )}
              >
                <div className="text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">PDF up to 50MB</p>
                </div>
              </div>

              {file && !isUploading && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                  <div className="flex items-center gap-3">
                    <DocumentIcon className="h-6 w-6 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <XCircleIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <XCircleIcon className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-6">
                <Button onClick={handleSubmit} disabled={!file || isUploading} className="w-full">
                  Generate Report
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Processing {file?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getStatusMessage()}
                </p>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-500", getProgressColor())}
                  style={{ width: `${jobStatus?.progress || 0}%` }}
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {jobStatus?.progress || 0}% complete
                </p>
                {jobStatus?.status === "processing" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This process can take up to 60 minutes depending on the document size.
                  </p>
                )}
              </div>

              {jobStatus?.status === "completed" && (
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Report generated successfully!</span>
                  </div>
                  {jobId && (
                    <div className="mt-2 text-center">
                      <a
                        href={`http://localhost:8000/download/${jobId}`}
                        download={jobStatus.download_filename || "soc-mapping-report.xlsx"}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Click here if download didn't start automatically
                      </a>
                    </div>
                  )}
                </div>
              )}

              {jobStatus?.status === "failed" && error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">Processing Failed</p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                      <button 
                        onClick={() => {
                          setIsUploading(false)
                          setError(null)
                          setJobStatus(null)
                          setJobId(null)
                        }}
                        className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>This will send the PDF to the backend for processing.</p>
            <p>The following parameters are hardcoded: pages 36-81, top_k=5.</p>
            {window.location.search.includes("test=true") && (
              <p className="mt-2 text-blue-600 dark:text-blue-400 font-medium">
                Test mode enabled - using mock data
              </p>
            )}
            
            {!isUploading && !showJobCheck && (
              <button
                onClick={() => setShowJobCheck(true)}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Have an existing job ID? Check status
              </button>
            )}
            
            {showJobCheck && !isUploading && (
              <div className="mt-4 space-y-2">
                <input
                  type="text"
                  value={checkJobId}
                  onChange={(e) => setCheckJobId(e.target.value)}
                  placeholder="Enter job ID"
                  className="w-full px-3 py-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (checkJobId.trim()) {
                        setIsUploading(true)
                        setError(null)
                        setJobId(checkJobId.trim())
                        
                        // Start polling
                        pollIntervalRef.current = setInterval(() => {
                          pollJobStatus(checkJobId.trim())
                        }, 2000)
                        
                        // Immediate first poll
                        pollJobStatus(checkJobId.trim())
                      }
                    }}
                    disabled={!checkJobId.trim()}
                    className="flex-1"
                  >
                    Check Status
                  </Button>
                  <button
                    onClick={() => {
                      setShowJobCheck(false)
                      setCheckJobId("")
                    }}
                    className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
