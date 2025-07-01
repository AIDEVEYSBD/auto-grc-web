import { type NextRequest, NextResponse } from "next/server"

const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"
const SAMPLE_HOST = "autogrc.cloud"

// Helper function to safely parse JSON responses
async function safeJsonParse(response: Response) {
  const contentType = response.headers.get("content-type")

  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch (error) {
      console.error("JSON parsing error:", error)
      const text = await response.text()
      console.error("Response text:", text)
      throw new Error("Invalid JSON response from API")
    }
  } else {
    const text = await response.text()
    console.error("Non-JSON response:", text)
    throw new Error("Expected JSON response but received: " + contentType)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Start a new assessment
    const startResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=${SAMPLE_HOST}&startNew=on&all=done`, {
      headers: {
        email: email,
      },
    })

    if (!startResponse.ok) {
      let errorData
      try {
        errorData = await safeJsonParse(startResponse)
      } catch (parseError) {
        return NextResponse.json(
          { error: `Failed to start scan (HTTP ${startResponse.status})` },
          { status: startResponse.status },
        )
      }

      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || errorData.message || "Failed to start scan" },
        { status: startResponse.status },
      )
    }

    const startData = await safeJsonParse(startResponse)

    // Poll for completion (with timeout)
    let attempts = 0
    const maxAttempts = 60 // 10 minutes max
    let scanData = startData

    while (scanData.status !== "READY" && scanData.status !== "ERROR" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds

      const pollResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=${SAMPLE_HOST}&all=done`, {
        headers: {
          email: email,
        },
      })

      if (pollResponse.ok) {
        try {
          scanData = await safeJsonParse(pollResponse)
        } catch (parseError) {
          console.error("Error parsing poll response:", parseError)
          // Continue with previous data
        }
      }

      attempts++
    }

    if (scanData.status === "ERROR") {
      return NextResponse.json(
        { error: "Scan failed: " + (scanData.statusMessage || "Unknown error") },
        { status: 400 },
      )
    }

    if (scanData.status !== "READY") {
      return NextResponse.json({ error: "Scan timeout - please try again" }, { status: 408 })
    }

    // Extract all possible fields from the response
    const extractFields = (obj: any, prefix = ""): string[] => {
      const fields: string[] = []

      for (const [key, value] of Object.entries(obj)) {
        const fieldName = prefix ? `${prefix}.${key}` : key

        if (value && typeof value === "object" && !Array.isArray(value)) {
          fields.push(...extractFields(value, fieldName))
        } else {
          fields.push(fieldName)
        }
      }

      return fields
    }

    const allFields = extractFields(scanData)

    // Create a categorized list of fields for better UX
    const categorizedFields = {
      basic: allFields.filter((field) =>
        ["host", "status", "grade", "startTime", "testTime"].some((basic) => field.includes(basic)),
      ),
      certificate: allFields.filter(
        (field) => field.includes("cert") || field.includes("Cert") || field.includes("issuer"),
      ),
      security: allFields.filter((field) =>
        ["vuln", "heartbleed", "poodle", "freak", "beast", "robot"].some((vuln) => field.toLowerCase().includes(vuln)),
      ),
      protocols: allFields.filter(
        (field) => field.includes("protocol") || field.includes("suite") || field.includes("cipher"),
      ),
      other: allFields.filter(
        (field) =>
          !["host", "status", "grade", "startTime", "testTime"].some((basic) => field.includes(basic)) &&
          !field.includes("cert") &&
          !field.includes("Cert") &&
          !field.includes("issuer") &&
          !["vuln", "heartbleed", "poodle", "freak", "beast", "robot"].some((vuln) =>
            field.toLowerCase().includes(vuln),
          ) &&
          !field.includes("protocol") &&
          !field.includes("suite") &&
          !field.includes("cipher"),
      ),
    }

    return NextResponse.json({
      success: true,
      sampleData: scanData,
      availableFields: categorizedFields,
    })
  } catch (error) {
    console.error("Sample scan error:", error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
