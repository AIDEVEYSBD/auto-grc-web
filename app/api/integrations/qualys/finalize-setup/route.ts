import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, selectedFields } = body

    if (!email || !selectedFields || !Array.isArray(selectedFields)) {
      return NextResponse.json({ error: "Email and selectedFields are required" }, { status: 400 })
    }

    // First, create the table by running the SQL script
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS qualys_ssl_labs_scans (
        id SERIAL PRIMARY KEY,
        application_id INTEGER REFERENCES applications(id),
        hostname VARCHAR(255) NOT NULL,
        scan_data JSONB NOT NULL,
        scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_qualys_scans_application_id ON qualys_ssl_labs_scans(application_id);
      CREATE INDEX IF NOT EXISTS idx_qualys_scans_hostname ON qualys_ssl_labs_scans(hostname);
      CREATE INDEX IF NOT EXISTS idx_qualys_scans_scan_date ON qualys_ssl_labs_scans(scan_date);
    `

    const { error: tableError } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (tableError) {
      console.error("Error creating table:", tableError)
      // Try alternative approach - direct query
      const { error: directError } = await supabase.from("qualys_ssl_labs_scans").select("id").limit(1)

      // If table doesn't exist, we'll get an error, but we can continue
      // The table will be created when we first insert data
    }

    // Get all applications to scan
    const { data: applications, error: appsError } = await supabase.from("applications").select("id, name, hostname")

    if (appsError) {
      console.error("Error fetching applications:", appsError)
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ error: "No applications found to scan" }, { status: 400 })
    }

    let scannedCount = 0
    let errorCount = 0
    const scanResults = []

    // Scan each application
    for (const app of applications) {
      if (!app.hostname) {
        console.log(`Skipping ${app.name} - no hostname`)
        continue
      }

      try {
        // Start scan
        const scanResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=${app.hostname}&startNew=on&all=done`, {
          headers: { email },
        })

        if (!scanResponse.ok) {
          console.error(`Failed to start scan for ${app.hostname}`)
          errorCount++
          continue
        }

        const scanData = await scanResponse.json()

        // Poll for completion (shorter timeout for batch processing)
        let attempts = 0
        const maxAttempts = 30 // 5 minutes max per scan
        let finalData = scanData

        while (finalData.status !== "READY" && finalData.status !== "ERROR" && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds

          const pollResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=${app.hostname}&all=done`, {
            headers: { email },
          })

          if (pollResponse.ok) {
            finalData = await pollResponse.json()
          }

          attempts++
        }

        if (finalData.status === "READY") {
          // Extract only selected fields
          const filteredData: any = {}

          const extractValue = (obj: any, path: string) => {
            const keys = path.split(".")
            let current = obj

            for (const key of keys) {
              if (current && typeof current === "object" && key in current) {
                current = current[key]
              } else {
                return undefined
              }
            }

            return current
          }

          selectedFields.forEach((field) => {
            const value = extractValue(finalData, field)
            if (value !== undefined) {
              filteredData[field] = value
            }
          })

          // Save to database
          const { error: insertError } = await supabase.from("qualys_ssl_labs_scans").insert({
            application_id: app.id,
            hostname: app.hostname,
            scan_data: filteredData,
          })

          if (insertError) {
            console.error(`Error saving scan for ${app.hostname}:`, insertError)
            errorCount++
          } else {
            scannedCount++
            scanResults.push({
              application: app.name,
              hostname: app.hostname,
              grade: filteredData.grade || "Unknown",
              status: "Success",
            })
          }
        } else {
          console.error(`Scan failed or timed out for ${app.hostname}`)
          errorCount++
        }

        // Rate limiting - wait between scans
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Error scanning ${app.hostname}:`, error)
        errorCount++
      }
    }

    // Update integration status to connected
    const { error: updateError } = await supabase
      .from("integrations")
      .update({ "is-connected": true })
      .eq("id", "b3f4ff74-56c1-4321-b137-690b939e454a")

    if (updateError) {
      console.error("Error updating integration status:", updateError)
    }

    return NextResponse.json({
      success: true,
      results: {
        scanned: scannedCount,
        errors: errorCount,
        total: applications.length,
        scanResults,
      },
    })
  } catch (error) {
    console.error("Finalize setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
