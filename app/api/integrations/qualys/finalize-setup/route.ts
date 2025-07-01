import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { performScan } from "@/lib/qualys-api"

const QUALYS_SSL_LABS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

// Helper to extract a value from a nested object using a dot-notation path
const extractValue = (obj: any, path: string) => {
  return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj)
}

export async function POST(request: NextRequest) {
  try {
    const { email, selectedFields } = (await request.json()) as {
      email?: string
      selectedFields?: string[]
    }

    if (!email || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      return NextResponse.json({ error: "Email and at least one selected field are required." }, { status: 400 })
    }

    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select("id, name, hostname")
      .not("hostname", "is", null)

    if (appsError) throw new Error(`Failed to fetch applications: ${appsError.message}`)

    if (!applications || applications.length === 0) {
      await supabase.from("integrations").update({ "is-connected": true }).eq("id", QUALYS_SSL_LABS_ID)
      return NextResponse.json(
        { success: true, message: "Setup complete. No applications with hostnames found to scan." },
        { status: 200 },
      )
    }

    const scanPromises = applications.map(async (app) => {
      try {
        if (!app.hostname) {
          return { hostname: app.name, status: "skipped", reason: "No hostname provided" }
        }
        const scanData = await performScan(app.hostname, email)

        const filteredData = selectedFields.reduce((acc: Record<string, any>, field: string) => {
          const value = extractValue(scanData, field)
          if (value !== null) {
            acc[field] = value
          }
          return acc
        }, {})

        const { error: upsertError } = await supabase.from("qualys_ssl_labs_scans").upsert(
          {
            application_id: app.id,
            hostname: app.hostname,
            scan_data: filteredData,
            grade: extractValue(scanData, "endpoints.0.grade") || null,
            scan_status: scanData.status,
          },
          { onConflict: "application_id" },
        )

        if (upsertError) throw new Error(`DB upsert failed for ${app.hostname}: ${upsertError.message}`)

        return { hostname: app.hostname, status: "success" }
      } catch (error: any) {
        console.error(`Failed to scan ${app.hostname}:`, error.message)
        return { hostname: app.hostname, status: "error", reason: error.message }
      }
    })

    const results = await Promise.all(scanPromises)

    await supabase.from("integrations").update({ "is-connected": true }).eq("id", QUALYS_SSL_LABS_ID)

    return NextResponse.json(
      {
        success: true,
        message: "Setup complete. Scans have been processed.",
        scanned: results.filter((r) => r.status === "success").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        errors: results.filter((r) => r.status === "error").length,
        results,
      },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Finalize setup error:", error)
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 })
  }
}
