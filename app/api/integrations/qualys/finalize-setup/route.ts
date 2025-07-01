import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"
const QUALYS_SSL_LABS_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, selectedFields } = body

    if (!email || !selectedFields || selectedFields.length === 0) {
      return NextResponse.json({ error: "Email and selected fields are required" }, { status: 400 })
    }

    const supabase = createClient()

    // 1. Create the table by executing the SQL script
    const { error: tableError } = await supabase.rpc("exec_sql", {
      sql_query: `
        -- Create table for storing Qualys SSL Labs scan results
        CREATE TABLE IF NOT EXISTS qualys_ssl_labs_scans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
            hostname VARCHAR(255) NOT NULL,
            scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            scan_data JSONB NOT NULL,
            grade VARCHAR(10),
            status VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_qualys_scans_application_id ON qualys_ssl_labs_scans(application_id);
        CREATE INDEX IF NOT EXISTS idx_qualys_scans_hostname ON qualys_ssl_labs_scans(hostname);
        CREATE INDEX IF NOT EXISTS idx_qualys_scans_scan_date ON qualys_ssl_labs_scans(scan_date);
        CREATE INDEX IF NOT EXISTS idx_qualys_scans_grade ON qualys_ssl_labs_scans(grade);
      `,
    })

    if (tableError) {
      console.error("Table creation error:", tableError)
      // Continue anyway - table might already exist
    }

    // 2. Fetch all applications
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select("id, name, hostname")
      .not("hostname", "is", null)

    if (appsError) {
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
    }

    // 3. Scan each application
    const scanResults = []
    const errors = []

    for (const app of applications || []) {
      try {
        // Start scan
        const startResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=${app.hostname}&startNew=on&all=done`, {
          headers: {
            email: email,
          },
        })

        if (!startResponse.ok) {
          errors.push(`Failed to start scan for ${app.hostname}`)
          continue
        }

        const startData = await startResponse.json()

        // Poll for completion (shorter timeout for bulk scans)
        let attempts = 0
        const maxAttempts = 30 // 5 minutes max per scan
        let scanData = startData

        while (scanData.status !== "READY" && scanData.status !== "ERROR" && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds

          const pollResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=${app.hostname}&all=done`, {
            headers: {
              email: email,
            },
          })

          if (pollResponse.ok) {
            scanData = await pollResponse.json()
          }

          attempts++
        }

        if (scanData.status === "READY") {
          // Extract only selected fields
          const filteredData: any = {}

          const extractValue = (obj: any, path: string): any => {
            const keys = path.split(".")
            let current = obj

            for (const key of keys) {
              if (current && typeof current === "object" && key in current) {
                current = current[key]
              } else {
                return null
              }
            }

            return current
          }

          selectedFields.forEach((field: string) => {
            const value = extractValue(scanData, field)
            if (value !== null) {
              filteredData[field] = value
            }
          })

          // Get grade from endpoints if available
          const grade = scanData.endpoints?.[0]?.grade || null

          // Save to database
          const { error: insertError } = await supabase.from("qualys_ssl_labs_scans").insert({
            application_id: app.id,
            hostname: app.hostname,
            scan_data: filteredData,
            grade: grade,
            status: scanData.status,
          })

          if (insertError) {
            errors.push(`Failed to save scan for ${app.hostname}: ${insertError.message}`)
          } else {
            scanResults.push({
              hostname: app.hostname,
              grade: grade,
              status: "success",
            })
          }
        } else {
          errors.push(`Scan timeout for ${app.hostname}`)
        }

        // Rate limiting - wait between scans
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        errors.push(`Error scanning ${app.hostname}: ${error}`)
      }
    }

    // 4. Update integration status
    const { error: updateError } = await supabase
      .from("integrations")
      .update({ "is-connected": true })
      .eq("id", QUALYS_SSL_LABS_ID)

    if (updateError) {
      console.error("Failed to update integration status:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
      results: {
        scanned: scanResults.length,
        errors: errors.length,
        details: scanResults,
        errorMessages: errors,
      },
    })
  } catch (error) {
    console.error("Finalize setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
