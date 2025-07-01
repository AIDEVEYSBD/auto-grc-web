"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import type { Integration } from "@/types"
import { ArrowPathIcon } from "@heroicons/react/24/outline"

interface QualysRegistrationFormProps {
  tool: Integration
  onClose: () => void
}

type Status = "idle" | "registering" | "starting_scan" | "scanning" | "completed" | "error"

interface ScanResult {
  host: string
  status: string
  endpoints: {
    ipAddress: string
    grade: string
    statusMessage: string
  }[]
}

export default function QualysRegistrationForm({ tool, onClose }: QualysRegistrationFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    organization: "",
    email: "",
    host: "",
  })
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const pollScanStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/qualys/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: formData.host, email: formData.email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details?.errors?.[0]?.message || data.error || "Polling failed")
      }

      if (data.status === "READY" || data.status === "ERROR") {
        setStatus("completed")
        setScanResult(data)
      } else {
        // Continue polling if status is DNS or IN_PROGRESS
        setScanResult(data) // update with interim status
      }
    } catch (err: any) {
      console.error("Polling error:", err)
      setStatus("error")
      setErrorMessage(err.message || "An error occurred while polling for scan status.")
    }
  }, [formData.host, formData.email])

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    if (status === "scanning") {
      intervalId = setInterval(pollScanStatus, 10000) // Poll every 10 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [status, pollScanStatus])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("registering")
    setErrorMessage("")
    setScanResult(null)

    try {
      // Step 1: Register with Qualys
      const regResponse = await fetch("/api/integrations/qualys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          organization: formData.organization,
        }),
      })

      const regData = await regResponse.json()
      if (!regResponse.ok) {
        throw new Error(regData.message || "Registration failed")
      }

      // Step 2: Start the scan
      setStatus("starting_scan")
      const scanResponse = await fetch("/api/integrations/qualys/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: formData.host,
          email: formData.email,
          startNew: true,
        }),
      })

      const scanData = await scanResponse.json()
      if (!scanResponse.ok) {
        throw new Error(scanData.details?.errors?.[0]?.message || scanData.error || "Failed to start scan")
      }

      setStatus("scanning")
      setScanResult(scanData)
    } catch (err: any) {
      console.error("Submission error:", err)
      setStatus("error")
      setErrorMessage(err.message || "An unexpected error occurred.")
    }
  }

  const renderStatus = () => {
    switch (status) {
      case "registering":
        return (
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Registering with Qualys...
          </div>
        )
      case "starting_scan":
        return (
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Initiating scan...
          </div>
        )
      case "scanning":
        return (
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-5 w-5 animate-spin" /> Scan in progress... (Status:{" "}
            {scanResult?.status || "UNKNOWN"})
          </div>
        )
      case "completed":
        return <div className="text-green-500">Scan complete!</div>
      case "error":
        return <div className="text-red-500">Error: {errorMessage}</div>
      default:
        return null
    }
  }

  const renderResults = () => {
    if (status !== "completed" || !scanResult) return null

    if (scanResult.status === "ERROR") {
      return (
        <div className="mt-4 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h4 className="font-semibold text-red-800 dark:text-red-300">Scan Error</h4>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            {scanResult.endpoints?.[0]?.statusMessage || "An unknown error occurred."}
          </p>
        </div>
      )
    }

    return (
      <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">Scan Results for {scanResult.host}</h4>
        {scanResult.endpoints.map((endpoint) => (
          <div key={endpoint.ipAddress} className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{endpoint.ipAddress}</p>
                <p className="text-xs text-gray-500">{endpoint.statusMessage}</p>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{endpoint.grade || "N/A"}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            required
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label htmlFor="organization" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Organization
        </label>
        <input
          type="text"
          name="organization"
          id="organization"
          value={formData.organization}
          onChange={handleInputChange}
          required
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="input-field"
          placeholder="No personal emails (e.g., gmail, yahoo)"
        />
      </div>
      <div>
        <label htmlFor="host" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Hostname to Scan
        </label>
        <input
          type="text"
          name="host"
          id="host"
          value={formData.host}
          onChange={handleInputChange}
          required
          className="input-field"
          placeholder="e.g., ssllabs.com"
        />
      </div>

      <div className="flex flex-col items-center justify-end gap-4 pt-4 sm:flex-row">
        <div className="h-6 text-sm flex-grow text-left">{renderStatus()}</div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={status === "scanning" || status === "registering" || status === "starting_scan"}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {status === "scanning" ? "Scanning..." : "Connect and Scan"}
        </button>
      </div>
      {renderResults()}
    </form>
  )
}
