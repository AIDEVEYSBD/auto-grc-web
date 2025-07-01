import { NextResponse } from "next/server"

const API_URL = "https://api.ssllabs.com/api/v3/analyze"

async function pollAnalysis(host: string) {
  let attempts = 0
  const maxAttempts = 30 // 5 minutes max polling (30 * 10s)

  while (attempts < maxAttempts) {
    const url = `${API_URL}?host=${host}&publish=off&all=done&fromCache=on&maxAge=1`
    const response = await fetch(url)

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`SSL Labs API error: ${response.status} ${text}`)
    }

    const data = await response.json()

    if (data.status === "READY") {
      return data
    }

    if (data.status === "ERROR") {
      throw new Error(`Analysis failed: ${data.statusMessage || "Unknown error"}`)
    }

    attempts++
    await new Promise((resolve) => setTimeout(resolve, 10000)) // Poll every 10 seconds
  }

  throw new Error("Analysis timed out.")
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const host = searchParams.get("host")

  if (!host) {
    return NextResponse.json({ error: "Hostname is required" }, { status: 400 })
  }

  try {
    const data = await pollAnalysis(host)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
