import { NextResponse } from "next/server"

const QUALYS_API_URL = "https://api.ssllabs.com/api/v4/analyze"

// Helper function to flatten the JSON object to get all possible keys
const flattenObject = (obj: any, parentKey = "", result: { [key: string]: any } = {}) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const propName = parentKey ? `${parentKey}.${key}` : key
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], propName, result)
      } else {
        result[propName] = obj[key]
      }
    }
  }
  return result
}

async function pollForResults(host: string, email: string): Promise<any> {
  let attempts = 0
  const maxAttempts = 30 // Approx 5 minutes
  const initialPollDelay = 5000 // 5 seconds
  const subsequentPollDelay = 10000 // 10 seconds

  while (attempts < maxAttempts) {
    const url = `${QUALYS_API_URL}?host=${host}&all=done`
    const response = await fetch(url, { headers: { email } })
    const data = await response.json()

    if (data.status === "READY" || data.status === "ERROR") {
      return data
    }

    const delay = attempts === 0 ? initialPollDelay : subsequentPollDelay
    await new Promise((resolve) => setTimeout(resolve, delay))
    attempts++
  }

  throw new Error("Scan timed out after several attempts.")
}

export async function POST(request: Request) {
  const { email } = await request.json()
  const host = "autogrc.cloud" // Default host for sample scan

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  try {
    // Initiate the scan
    const initialUrl = `${QUALYS_API_URL}?host=${host}&startNew=on&all=done`
    await fetch(initialUrl, { headers: { email } })

    // Poll for the results
    const results = await pollForResults(host, email)
    const flattenedResults = flattenObject(results)
    const keys = Object.keys(flattenedResults)

    return NextResponse.json({ keys }, { status: 200 })
  } catch (error: any) {
    console.error("Qualys sample scan error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
