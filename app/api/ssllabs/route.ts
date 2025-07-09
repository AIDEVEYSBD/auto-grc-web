import { type NextRequest, NextResponse } from "next/server"
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"

type QualysStatus = "DNS" | "IN_PROGRESS" | "READY" | "ERROR"

interface Endpoint {
  ipAddress: string
  statusMessage: string
  grade: string
  gradeTrustIgnored: string
  hasWarnings: boolean
  isExceptional: boolean
  progress: number
  duration: number
  delegation: number
}

interface QualysResponse {
  host: string
  port: number
  protocol: string
  isPublic: boolean
  status: QualysStatus
  statusMessage?: string
  startTime: number
  testTime: number
  engineVersion: string
  criteriaVersion: string
  endpoints: Endpoint[]
}

const getHeaders = (email: string) => ({
  email: email,
  "Content-Type": "application/json",
})

async function pollForResults(host: string, email: string): Promise<QualysResponse> {
  const maxAttempts = 120 // 10 minutes max (5 seconds * 120)
    console.log(`Starting polling for results for ${host}`)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for ${host}`)

    const response = await fetch(`${QUALYS_API_BASE}/analyze?host=${encodeURIComponent(host)}&fromCache=on`, {
      headers: getHeaders(email),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Qualys API error: ${response.status} - ${errorText}`)
    }

    const data: QualysResponse = await response.json()
    console.log(`Status: ${data.status}, Message: ${data.statusMessage}`)

    // If there are endpoints, log their progress
    if (data.endpoints) {
      data.endpoints.forEach((endpoint, index) => {
        console.log(
          `Endpoint ${index + 1} (${endpoint.ipAddress}): ${endpoint.statusMessage} - Progress: ${endpoint.progress}%`,
        )
      })
    }

    // Check if analysis is complete
    if (data.status === "READY") {
      console.log("Analysis complete!")
      return data
    }

    if (data.status === "ERROR") {
      throw new Error(`Analysis failed: ${data.statusMessage}`)
    }

    // Wait 5 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  throw new Error("Analysis timeout - scan took longer than 10 minutes")
}

export async function POST(request: NextRequest) {
  try {
    const { host } = await request.json()

    if (!host) {
      return NextResponse.json({ error: "Host parameter is required" }, { status: 400 })
    }

    const email = "jdoe@someorganizationemail.com"
    const cleanHost = host.replace(/^https?:\/\//, "").split("/")[0]

    console.log(`Starting SSL analysis for ${cleanHost}`)

    // Start the analysis
    const startResponse = await fetch(
      `${QUALYS_API_BASE}/analyze?host=${encodeURIComponent(cleanHost)}&publish=on&startNew=on`,
      {
        headers: getHeaders(email),
      },
    )

    if (!startResponse.ok) {
      const errorData = await startResponse.json()
      console.error("Failed to start analysis:", errorData)
      throw new Error(`Failed to start analysis: ${startResponse.status} - ${JSON.stringify(errorData)}`)
    }

    const startData: QualysResponse = await startResponse.json()
    console.log(`Analysis started. Initial status: ${startData.status}`)

    // If analysis is already complete, return immediately
    if (startData.status === "READY") {
      console.log("Analysis already complete")
      return NextResponse.json(startData)
    }

    // Poll for results until ready
    const result = await pollForResults(cleanHost, email)
    return NextResponse.json(result)
  } catch (error) {
    console.error("SSL scan error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
