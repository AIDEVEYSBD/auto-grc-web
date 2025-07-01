"use client"

import { useState, type ChangeEvent, type DragEvent } from "react"
import { CloudArrowUpIcon, DocumentIcon, XCircleIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function SocMapperPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a file to upload.")
      return
    }

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("soc_pdf", file)
    // Hardcoded values as requested, using defaults from your server's /test endpoint
    formData.append("start_page", "36")
    formData.append("end_page", "81")
    formData.append("pattern", "\\d+\\.\\d+")
    formData.append("top_k", "5")
    formData.append("workers", "5")

    try {
      // Using the /test endpoint as it's safer and doesn't consume API tokens.
      // The backend server must be running on localhost:8000.
      const response = await fetch("http://localhost:8000/test", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "An unknown error occurred.")
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get("content-disposition")
      let filename = "soc-mapping-report.xlsx" // Default filename
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
      setFile(null) // Reset file input after successful download
    } catch (err: any) {
      setError(err.message || "Failed to process the file. Please ensure the backend server is running.")
    } finally {
      setIsUploading(false)
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
              {isUploading ? "Processing..." : "Generate Report"}
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>This will send the PDF to the backend for processing.</p>
            <p>The following parameters are hardcoded: pages 36-81, top_k=5.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
