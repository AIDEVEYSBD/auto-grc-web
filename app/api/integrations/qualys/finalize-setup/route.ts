import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"
const QUALYS_SSL_LABS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

async function safeFetch(url: string, options: RequestInit) {
  const response = await fetch(url, options)
  const responseText = await response.text()

  if (!response.ok) {
    let errorMessage = responseText
    try {
      const errorJson = JSON.parse(responseText)
      errorMessage = errorJson.errors?.[0]?.message || responseText
    } catch (e) {
      // Not JSON, use raw text
      throw new Error(errorMessage)
    }
  }

  try {
    return JSON.parse(responseText)
  } catch (e) {
    throw new Error("Received an invalid JSON response from the API.")
  }
}

// Helper to extract a value from a nested object using a dot-notation path
const extractValue = (obj: any, path: string) => {
  return path.split(".").reduce((o, k) => (o && o[k] !== "undefined" ? o[k] : null), obj)
}

export async function POST(request: NextRequest) {
  try {
    const { email, selectedFields } = await request.json()
    if (!email || !selectedFields || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      return NextResponse.json({ error: "Email and a selection of fields are required" }, { status: 400 })
    }

    // Fetch all applications with a valid hostname
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select("id, name, hostname")
      .not("hostname", "is", null)

    if (appsError) throw new Error("Failed to fetch applications: " + appsError.message)
    if (!applications || applications.length === 0) {
      return NextResponse.json({ message: "No applications with hostnames found to scan." }, { status: 200 })
    }

    const scanPromises = applications.map(async (app) => {
      try {
        // Start scan
        await safeFetch(`${QUALYS_API_BASE}/analyze?host=${app.hostname}&startNew=on&all=done`, {
          headers: { email },
        })

        // Poll for completion
        let attempts = 0
        const maxAttempts = 30 // 5 minutes max per scan
        let scanData
        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds
          scanData = await safeFetch(`${QUALYS_API_BASE}/analyze?host=${app.hostname}&all=done`, {
            headers: { email },
          })
          if (scanData.status === "READY" || scanData.status === "ERROR") break
          attempts++
        }

        if (scanData?.status !== "READY") {
          throw new Error(`Scan for ${app.hostname} did not complete in time.`)
        }

        // Extract only the selected fields
        const filteredData = selectedFields.reduce((acc: any, field: string) => {
          const value = extractValue(scanData, field)
          if (value !== null) acc[field] = value
          return acc
        }, {})

        // Save to database
        const { error: insertError } = await supabase.from("qualys_ssl_labs_scans").insert({
          application_id: app.id,
          hostname: app.hostname,
          scan_data: filteredData,
          grade: scanData.endpoints?.[0]?.grade || null,
          status: scanData.status,
        })

        if (insertError) throw new Error(`DB insert failed for ${app.hostname}: ${insertError.message}`)

        return { hostname: app.hostname, status: "success" }
      } catch (error: any) {
        console.error(`Failed to scan ${app.hostname}:`, error.message)
        return { hostname: app.hostname, status: "error", reason: error.message }
      }
    })

    const results = await Promise.all(scanPromises)

    // Update integration status to connected
    await supabase.from("integrations").update({ "is-connected": true }).eq("id", QUALYS_SSL_LABS_ID)

    return NextResponse.json({
      success: true,
      message: "Setup complete. Scans have been processed.",
      results,
    })
  } catch (error: any) {
    console.error("Finalize setup error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
