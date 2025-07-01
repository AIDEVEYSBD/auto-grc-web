import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { performScan, getAvailableFields } from "@/lib/qualys-api"

/**
 * POST /api/integrations/qualys/sample-scan
 * Body: { email: string, host?: string }
 * Performs a live scan on a sample host and returns a list of available data fields.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, host = "autogrc.cloud" } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required in request body." }, { status: 400 })
    }

    const scanData = await performScan(host, email)
    const availableFields = getAvailableFields(scanData)

    return NextResponse.json(
      {
        success: true,
        scannedHost: host,
        availableFields: availableFields,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("Qualys sample-scan route error:", err)
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal server error.", details: errorMessage }, { status: 500 })
  }
}
