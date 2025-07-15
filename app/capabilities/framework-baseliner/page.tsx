"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  LinkIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline"
import { useFrameworks } from "@/lib/queries/frameworks"
import LoadingSkeleton from "@/components/LoadingSkeleton"

interface Job {
  job_id: string
  status: "accepted" | "pending" | "processing" | "completed" | "failed"
  source_framework?: string
  target_framework?: string
  created_at?: string
  completed_at?: string
  mappings_count?: number
  download_url?: string
}

export default function FrameworkBaselinerPage() {
  const { data: frameworks, isLoading: frameworksLoading } = useFrameworks()

  // Form state
  const [sourceFramework, setSourceFramework] = useState("")
  const [targetFramework, setTargetFramework] = useState("")
  const [generateExcel, setGenerateExcel] = useState(true)

  // Job state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentJob, setCurrentJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Poll current job status
  useEffect(() => {
    if (
      currentJob &&
      (currentJob.status === "accepted" || currentJob.status === "pending" || currentJob.status === "processing")
    ) {
      const interval = setInterval(() => {
        pollJobStatus(currentJob.job_id)
      }, 5000) // Poll every 5 seconds

      return () => clearInterval(interval)
    }
  }, [currentJob])

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`https://framework.autogrc.cloud/jobs/${jobId}`)
      if (response.ok) {
        const jobData = await response.json()
        setCurrentJob(jobData)
      }
    } catch (error) {
      console.error("Failed to poll job status:", error)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!sourceFramework) errors.sourceFramework = "Source framework is required"
    if (!targetFramework) errors.targetFramework = "Target framework is required"
    if (sourceFramework === targetFramework)
      errors.targetFramework = "Target framework must be different from source framework"

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("source_framework_name", sourceFramework)
      formData.append("target_framework_name", targetFramework)
      formData.append("user_email", "jai@autogrc.cloud")
      formData.append("top_k", "5")
      formData.append("generate_excel", generateExcel.toString())

      const response = await fetch("https://framework.autogrc.cloud/compare", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to start mapping job: ${errorText}`)
      }

      const jobData = await response.json()
      setCurrentJob(jobData)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-6 w-6 text-emerald-500" />
      case "failed":
        return <XCircleIcon className="h-6 w-6 text-red-500" />
      case "processing":
      case "pending":
        return <ClockIcon className="h-6 w-6 text-amber-500 animate-spin" />
      default:
        return <ClockIcon className="h-6 w-6 text-slate-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
      case "failed":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
      case "processing":
      case "pending":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
      default:
        return "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20"
    }
  }

  if (frameworksLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Framework Baseliner</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Initiate and track framework-to-framework mapping in your GRC system
          </p>
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
          <LinkIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Framework Baseliner</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
          Create intelligent mappings between compliance frameworks using AI-powered analysis
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Mapping Form */}
        <div className="glass-card p-8 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Mapping</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select frameworks to compare and map</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Framework Selection */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="source-framework"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Source Framework
                </label>
                <select
                  id="source-framework"
                  value={sourceFramework}
                  onChange={(e) => setSourceFramework(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    validationErrors.sourceFramework
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <option value="">Choose your source framework</option>
                  {frameworks?.map((framework) => (
                    <option key={framework.id} value={framework.name}>
                      {framework.name} {framework.version && `(${framework.version})`}
                    </option>
                  ))}
                </select>
                {validationErrors.sourceFramework && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" />
                    {validationErrors.sourceFramework}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              <div>
                <label
                  htmlFor="target-framework"
                  className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                >
                  Target Framework
                </label>
                <select
                  id="target-framework"
                  value={targetFramework}
                  onChange={(e) => setTargetFramework(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all ${
                    validationErrors.targetFramework
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <option value="">Choose your target framework</option>
                  {frameworks?.map((framework) => (
                    <option key={framework.id} value={framework.name}>
                      {framework.name} {framework.version && `(${framework.version})`}
                    </option>
                  ))}
                </select>
                {validationErrors.targetFramework && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" />
                    {validationErrors.targetFramework}
                  </p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <ArrowDownTrayIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <label htmlFor="generate-excel" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Generate Excel Report
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Download detailed mapping results</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="generate-excel"
                  checked={generateExcel}
                  onChange={(e) => setGenerateExcel(e.target.checked)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <>
                  <ClockIcon className="h-5 w-5 animate-spin" />
                  Analyzing Frameworks...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5" />
                  Start AI Mapping
                </>
              )}
            </button>
          </form>
        </div>

        {/* Job Status */}
        {currentJob ? (
          <div className="glass-card p-8 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                {getStatusIcon(currentJob.status)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mapping Progress</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time job status and results</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Job ID</span>
                  <span className="text-sm font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-white">
                    {currentJob.job_id}
                  </span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${getStatusColor(currentJob.status)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Status</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(currentJob.status)}
                    <span className="text-sm font-bold capitalize">{currentJob.status}</span>
                  </div>
                </div>
              </div>

              {currentJob.source_framework && currentJob.target_framework && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Framework Mapping</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg text-sm font-semibold">
                        {currentJob.source_framework}
                      </span>
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg text-sm font-semibold">
                        {currentJob.target_framework}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {currentJob.mappings_count && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mappings Discovered</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {currentJob.mappings_count}
                    </p>
                  </div>
                </div>
              )}

              {currentJob.status === "completed" && currentJob.download_url && (
                <div className="pt-2">
                  <a
                    href={currentJob.download_url}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-lg hover:shadow-xl"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download Excel Report
                  </a>
                </div>
              )}

              {(currentJob.status === "processing" || currentJob.status === "pending") && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-amber-500 animate-spin" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      AI is analyzing frameworks and creating mappings. This may take up to 2 hours.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 border-l-4 border-l-gray-300">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <ClockIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium">No Active Mapping</p>
              <p className="text-sm mt-1">Start a new mapping to see progress here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
