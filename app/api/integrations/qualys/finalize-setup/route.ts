import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { Pool } from "pg"

const QUALYS_API_URL = "https://api.ssllabs.com/api/v4/analyze"
const QUALYS_INTEGRATION_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

// Use connection pooling for database operations
const pool = new Pool({ connectionString: process.env.POSTGRES_URL })

// Helper to filter an object based on a list of keys
const filterObject = (obj: any, keys: string[]): any => {
  const filtered: { [key: string]: any } = {}
  for (const key of keys) {
    const keyParts = key.split(".")
    let current = obj
    let target = filtered
    for (let i = 0; i < keyParts.length; i++) {
      const part = keyParts[i]
      if (current[part] === undefined) break
      if (i === keyParts.length - 1) {
        target[part] = current[part]
      } else {
        target[part] = target[part] || {}
        current = current[part]
        target = target[part]
      }
    }
  }
  return filtered
}

async function pollForResults(host: string, email: string): Promise<any> {
  let attempts = 0
  const maxAttempts = 30
  const pollDelay = 10000 // 10 seconds

  while (attempts < maxAttempts) {
    const url = `${QUALYS_API_URL}?host=${host}&all=done`
    const response = await fetch(url, { headers: { email } })
    const data = await response.json()

    if (data.status === "READY" || data.status === "ERROR") {
      return data
    }
    await new Promise((resolve) => setTimeout(resolve, pollDelay))
    attempts++
  }
  return { status: "TIMEOUT", error: "Scan timed out" }
}

async function runAndStoreScan(application: { id: string; name: string }, email: string, selectedFields: string[]) {
  const client = await pool.connect()
  try {
    // Initiate scan
    const initialUrl = `${QUALYS_API_URL}?host=${application.name}&startNew=on&all=done`
    await fetch(initialUrl, { headers: { email } })

    // Poll for results
    const result = await pollForResults(application.name, email)
    const filteredData = filterObject(result, selectedFields)

    // Store results
    const query = `
      INSERT INTO qualys_ssl_labs_scans (application_id, hostname, scan_status, grade, scan_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (application_id) DO UPDATE SET
        hostname = EXCLUDED.hostname,
        scan_status = EXCLUDED.scan_status,
        grade = EXCLUDED.grade,
        scan_data = EXCLUDED.scan_data,
        updated_at = NOW();
    `
    await client.query(query, [
      application.id,
      application.name,
      result.status,
      result.endpoints?.[0]?.grade || null,
      filteredData,
    ])
  } catch (error) {
    console.error(`Failed to scan ${application.name}:`, error)
  } finally {
    client.release()
  }
}

export async function POST(request: Request) {
  const { email, selectedFields } = await request.json()

  if (!email || !selectedFields || !Array.isArray(selectedFields)) {
    return NextResponse.json({ error: "Email and selectedFields are required" }, { status: 400 })
  }

  try {
    // Fetch all applications
    const { data: applications, error: appsError } = await supabase.from("applications").select("id, name")
    if (appsError) throw appsError

    // Run scans for all applications in parallel
    await Promise.all(applications.map((app) => runAndStoreScan(app, email, selectedFields)))

    // Update the integration status
    const { error: updateError } = await supabase
      .from("integrations")
      .update({ "is-connected": true })
      .eq("id", QUALYS_INTEGRATION_ID)

    if (updateError) throw updateError

    return NextResponse.json(
      { message: "Qualys SSL Labs setup complete. Initial scans are running in the background." },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Qualys finalize setup error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
