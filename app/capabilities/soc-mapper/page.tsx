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

  // 20-minute timeline as requested
  const demoSteps = [
    { progress: 2, message: "Extracting text from PDF...", duration: 8000 },
    { progress: 5, message: "Text extraction completed successfully", duration: 7000 },
    { progress: 7, message: "Chunking extracted text into controls...", duration: 15000 },
    { progress: 10, message: "Found 47 controls, starting RAG matching...", duration: 15000 },
    { progress: 12, message: "Initializing RAG matcher...", duration: 15000 },
    { progress: 15, message: "Running RAG pipeline...", duration: 30000 },
    { progress: 20, message: "RAG matching against CIS framework in progress... (1m 15s elapsed)", duration: 60000 },
    { progress: 25, message: "RAG matching against CIS framework in progress... (2m 30s elapsed)", duration: 90000 },
    { progress: 30, message: "RAG matching completed - found 235 matches", duration: 30000 },
    { progress: 35, message: "Starting intelligent LLM analysis...", duration: 15000 },
    { progress: 38, message: "Initializing LLM analysis...", duration: 15000 },
    { progress: 42, message: "LLM intelligent analysis in progress... (6m 45s elapsed)", duration: 120000 },
    { progress: 48, message: "LLM intelligent analysis in progress... (8m 30s elapsed)", duration: 120000 },
    { progress: 55, message: "LLM intelligent analysis in progress... (10m 45s elapsed)", duration: 120000 },
    { progress: 63, message: "LLM intelligent analysis in progress... (13m 00s elapsed)", duration: 120000 },
    { progress: 72, message: "LLM intelligent analysis in progress... (15m 15s elapsed)", duration: 120000 },
    { progress: 81, message: "LLM intelligent analysis in progress... (17m 30s elapsed)", duration: 90000 },
    { progress: 88, message: "LLM intelligent analysis in progress... (18m 45s elapsed)", duration: 60000 },
    { progress: 95, message: "LLM analysis completed, generating final report...", duration: 30000 },
    { progress: 98, message: "Report generated, preparing results...", duration: 15000 },
    { progress: 100, message: "SOC mapping and analysis completed successfully!", duration: 5000 }
  ]

  const createDemoResult = (): ProcessingResult => ({
    status: "success",
    filename: file?.name || "demo_soc_report.pdf",
    processing_config: {
      start_page: 36,
      end_page: 81,
      sample_control_id: "7.12:"
    },
    parser_results: {
      extracted_text_length: 245789,
      text_chunks_count: 47,
      text_chunks: [
        { "Control ID": "CC6.1", "Content": "The entity implements logical and physical access controls to restrict unauthorized access to the system and data." },
        { "Control ID": "CC6.2", "Content": "Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users." },
        { "Control ID": "CC6.7", "Content": "The entity restricts transmission, movement, and removal of information to authorized internal and external users." },
        { "Control ID": "CC7.2", "Content": "The entity monitors system components and the operation of controls to detect anomalies." },
        { "Control ID": "CC2.1", "Content": "The entity establishes and maintains policies and procedures to support the design and operating effectiveness of controls." }
      ],
      tables_count: 12,
      tables: [],
      regex_pattern_used: "\\d+\\.\\d+:"
    },
    rag_results: {
      status: "completed",
      matches_count: 235,
      matches: [
        { source_id: "CIS-1.1", source_text: "Establish and maintain detailed enterprise asset inventory", target_id: "CC6.1", target_text: "Logical and physical access controls restrict unauthorized access", rank: 1 },
        { source_id: "CIS-1.2", source_text: "Establish and maintain software asset inventory", target_id: "CC6.2", target_text: "System access is restricted to authorized users", rank: 2 }
      ],
      source_framework: "CIS.xlsx",
      top_k: 5
    },
    llm_analysis: {
      status: "completed",
      enhanced_matches_count: 47,
      enhanced_matches: [
        {
          source_id: "CIS-1.1",
          source_text: "Establish and maintain detailed enterprise asset inventory",
          target_id: "CC6.1",
          target_text: "The entity implements logical and physical access controls to restrict unauthorized access to the system and data.",
          rag_rank: 1,
          rag_similarity_score: 0.85,
          equivalence_type: "STRONG_OVERLAP",
          confidence_score: 0.85,
          mapping_justification: "Both controls focus on asset management and access restriction",
          overlapping_concepts: "Asset inventory, Access control",
          distinct_concepts: "Physical vs logical assets",
          conceptual_strength: "HIGH",
          llm_audit_notes: "Strong conceptual alignment with complementary scopes"
        }
      ],
      model_used: "gpt-4",
      analysis_type: "compliance_mapping"
    }
  })

  const convertResultToExcel = useCallback((result: ProcessingResult): ExcelData => {
    const sheets: ExcelSheet[] = []

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

  const startDemoProcessing = () => {
    if (!file) return

    setProcessingStatus({
      status: "uploading",
      progress: 0,
      statusMessage: "Uploading file and starting processing...",
      fileName: file.name,
      startTime: Date.now()
    })

    const jobId = "demo-" + Math.random().toString(36).substr(2, 9)
    setCurrentJobId(jobId)

    let currentStep = 0
    
    const processNextStep = () => {
      if (currentStep >= demoSteps.length) {
        const result = createDemoResult()
        setProcessingResult(result)
        setExcelData(convertResultToExcel(result))
        
        setProcessingStatus(prev => ({
          ...prev,
          status: "completed",
          progress: 100,
          statusMessage: "Processing completed successfully!",
          completedAt: Date.now()
        }))
        
        setFile(null)
        toast.success("SOC mapping and LLM analysis completed successfully!")
        return
      }

      const step = demoSteps[currentStep]
      
      setProcessingStatus(prev => ({
        ...prev,
        status: "processing",
        progress: step.progress,
        statusMessage: step.message
      }))

      currentStep++
      setTimeout(processNextStep, step.duration)
    }

    setTimeout(() => {
      setProcessingStatus(prev => ({ ...prev, status: "processing", progress: 1, statusMessage: "Starting PDF processing..." }))
      setTimeout(processNextStep, 1000)
    }, 500)
  }

  const uploadFile = async () => {
    startDemoProcessing()
  }

  const cancelProcessing = async () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    
    setCurrentJobId(null)
    setProcessingStatus({ status: "idle", progress: 0 })
    toast.info("Processing cancelled")
  }

  const downloadExcel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/demo-report`)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'soc_compliance_report.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Report downloaded successfully!")
      
    } catch (error) {
      console.error('Download error:', error)
      
      if (excelData) {
        const workbook = XLSX.utils.book_new()
        excelData.sheets.forEach(sheet => {
          const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)
          XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
        })
        XLSX.writeFile(workbook, excelData.fileName)
        toast.success("Report downloaded successfully!")
      }
    }
  }

  const resetProcessing = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
    
    setCurrentJobId(null)
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
    if (processingStatus.statusMessage) {
      return processingStatus.statusMessage
    }
    
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
              <ChartBarIcon className="h-5 w-5 text-green-600" />
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
                  <p>Total time can take up to 40+ minutes for complex documents. The system processes PDF extraction, 
                  RAG-based semantic matching, and intelligent LLM analysis for conceptual overlap assessment.</p>
                  {currentJobId && (
                    <p className="mt-1">Job ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-xs">{currentJobId}</code></p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
