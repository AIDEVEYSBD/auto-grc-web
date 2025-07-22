"use client"

import type React from "react"

import { useState, useCallback } from "react"
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

interface ProcessingStatus {
  status: "idle" | "uploading" | "processing" | "completed" | "failed"
  progress: number
  fileName?: string
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
const API_BASE_URL = "http://localhost:8000"

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

  const convertResultToExcel = useCallback((result: ProcessingResult): ExcelData => {
    const sheets: ExcelSheet[] = []

    // Sheet 1: RAG Mapping Results
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

    // Sheet 2: Extracted SOC Controls
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

    // Sheet 3: Processing Summary
    const summaryData = [
      ["Metric", "Value"],
      ["Filename", result.filename],
      ["Pages Processed", `${result.processing_config.start_page} - ${result.processing_config.end_page}`],
      ["Regex Pattern", result.processing_config.sample_control_id],
      ["Extracted Text Length", result.parser_results.extracted_text_length],
      ["Text Chunks Found", result.parser_results.text_chunks_count],
      ["Tables Found", result.parser_results.tables_count],
      ["RAG Status", result.rag_results.status],
      ["Total Matches", result.rag_results.matches_count],
      ["Source Framework", result.rag_results.source_framework || "N/A"],
      ["Top K Matches", result.rag_results.top_k || "N/A"]
    ]

    sheets.push({
      name: "Processing Summary",
      data: summaryData
    })

    return {
      sheets,
      fileName: result.filename.replace(".pdf", "_soc_mapping.xlsx")
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

  const uploadFile = async () => {
    if (!file) return

    setProcessingStatus({
      status: "uploading",
      progress: 10,
      fileName: file.name,
      startTime: Date.now()
    })

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Simulate progress during upload
      setProcessingStatus(prev => ({ ...prev, status: "processing", progress: 30 }))

      const response = await fetch(`${API_BASE_URL}/upload-soc-report`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Upload failed" }))
        throw new Error(errorData.detail || "Upload failed")
      }

      setProcessingStatus(prev => ({ ...prev, progress: 70 }))

      const result: ProcessingResult = await response.json()
      
      setProcessingStatus(prev => ({ 
        ...prev, 
        status: "completed", 
        progress: 100,
        completedAt: Date.now()
      }))

      setProcessingResult(result)
      
      // Convert result to Excel format
      const excelData = convertResultToExcel(result)
      setExcelData(excelData)
      
      setFile(null)
      
      if (result.rag_results.status === "completed") {
        toast.success("SOC mapping completed successfully!")
      } else {
        toast.warning(`Processing completed but RAG matching: ${result.rag_results.status}`)
      }

    } catch (error) {
      console.error("Upload error:", error)
      setProcessingStatus(prev => ({
        ...prev,
        status: "failed",
        error: error instanceof Error ? error.message : "Upload failed"
      }))
      toast.error("Failed to upload SOC report")
    }
  }

  const downloadExcel = () => {
    if (!excelData) return

    // Create workbook
    const workbook = XLSX.utils.book_new()
    
    excelData.sheets.forEach(sheet => {
      const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    })

    // Download
    XLSX.writeFile(workbook, excelData.fileName)
  }

  const resetProcessing = () => {
    setProcessingStatus({ status: "idle", progress: 0 })
    setProcessingResult(null)
    setExcelData(null)
    setShowResultModal(false)
  }

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
    switch (processingStatus.status) {
      case "uploading":
        return "Uploading SOC report..."
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
        <p className="text-gray-600 dark:text-gray-400 mt-1">Map SOC2 Type2 reports against CIS framework</p>
      </div>

      {processingStatus.status === "idle" ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
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
                    <p className="font-medium text-purple-900 dark:text-purple-100">Tables Found</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {processingResult.parser_results.tables_count}
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
                    Download Excel
                  </Button>
                  <Button variant="outline" onClick={resetProcessing}>
                    Start New Mapping
                  </Button>
                </div>
              </div>
            )}

            {processingStatus.status === "failed" && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetProcessing}>
                  Try Again
                </Button>
              </div>
            )}

            {(processingStatus.status === "uploading" || processingStatus.status === "processing") && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>• Extracting controls from SOC report (pages 36-81)</p>
                <p>• Generating regex patterns for chunking</p>
                <p>• Running RAG matching against CIS framework</p>
                <p>• Processing completed synchronously</p>
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
