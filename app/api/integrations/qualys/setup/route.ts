import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const QUALYS_INTEGRATION_ID = "b3f4ff74-56c1-4321-b137-690b939e454a"

// Helper to filter a deep object based on a list of allowed keys (e.g., "endpoints.grade")
const filterObject = (obj: any, allowedKeys: string[]) => {
  const newObj: any = {}
  allowedKeys.forEach((keyPath) => {
    const keys = keyPath.replace(/\[\]/g, ".0").split(".") // Handle arrays
    let current = obj
    let newCurrent = newObj
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (current[key] === undefined) break
      if (i === keys.length - 1) {
        newCurrent[key] = current[key]
      } else {
        newCurrent[key] = newCurrent[key] || (keys[i + 1] === "0" ? [] : {})
        newCurrent = newCurrent[key]
        current = current[key]
      }
    }
  })
  return newObj
}

async function runAndStoreScan(hostname: string, email: string, applicationId: string, selectedFields: string[]) {
  const analyzeUrl = `https://api.ssllabs.com/api/v4/analyze?host=${hostname}&all=done&startNew=on`
  const initialResponse = await fetch(analyzeUrl, { headers: { email } })
  let result = await initialResponse.json()

  while (result.status !== "READY" && result.status !== "ERROR") {
    await new Promise((resolve) => setTimeout(resolve, 10000))
    const pollUrl = `https://api.ssllabs.com/api/v4/analyze?host=${hostname}&all=done`
    const pollResponse = await fetch(pollUrl, { headers: { email } })
    result = await pollResponse.json()
  }

  const filteredData = filterObject(result, selectedFields)

  const { error } = await supabase.from("qualys_ssl_labs_scans").insert({
    application_id: applicationId,
    hostname: hostname,
    scan_status: result.status,
    grade: result.endpoints?.[0]?.grade || null,
    scan_data: filteredData,
  })

  if (error) {
    console.error(`Failed to store scan for ${hostname}:`, error)
    throw new Error(`Database insertion failed for ${hostname}.`)
  }
}

export async function POST(request: Request) {
  try {
    const { email, selectedFields } = await request.json()

    if (!email || !Array.isArray(selectedFields) || selectedFields.length === 0) {
      return NextResponse.json({ error: "Email and selectedFields are required." }, { status: 400 })
    }

    // Fetch all applications
    const { data: applications, error: appError } = await supabase.from("applications").select("id, name") // Assuming 'name' can be used as hostname

    if (appError) throw new Error("Failed to fetch applications from database.")
    if (!applications || applications.length === 0) {
      // Still connect the integration, even if there are no apps to scan yet
    } else {
      // Run scans in parallel
      await Promise.all(applications.map((app) => runAndStoreScan(app.name, email, app.id, selectedFields)))
    }

    // Mark integration as connected
    const { error: updateError } = await supabase
      .from("integrations")
      .update({ "is-connected": true })
      .eq("id", QUALYS_INTEGRATION_ID)

    if (updateError) throw new Error("Failed to update integration status.")

    return NextResponse.json({ message: "Qualys integration setup complete." })
  } catch (error: any) {
    console.error("Qualys Setup Error:", error)
    return NextResponse.json({ error: "Internal server error during setup.", details: error.message }, { status: 500 })
  }
}
