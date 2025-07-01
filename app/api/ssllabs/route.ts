import { NextResponse } from "next/server"

const API_URL = "https://api.ssllabs.com/api/v3/analyze"

async function pollAnalysis(host: string) {
  // First, trigger a new analysis
  const initialUrl = `${API_URL}?host=${host}&publish=off&startNew=on&all=done`
  await fetch(initialUrl) // We don't need the response, just to start the process

  let attempts = 0
  const maxAttempts = 30 // 5 minutes max polling (30 * 10s)

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 10000)) // Poll every 10 seconds

    const pollUrl = `${API_URL}?host=${host}&publish=off&all=done&fromCache=on`
    const response = await fetch(pollUrl)

    if (!response.ok) {
      const text = await response.text()
      console.error(`SSL Labs API error: ${response.status}`, text)
      throw new Error(`The SSL Labs API returned an error: ${response.status}. Please try again later.`)
    }

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse JSON from SSL Labs API. Response text:", responseText)
      throw new Error("Received an invalid (non-JSON) response from the SSL Labs server.")
    }

    if (data.status === "READY") {
      return data
    }

    if (data.status === "ERROR") {
      throw new Error(`Analysis failed: ${data.statusMessage || "Unknown error"}`)
    }

    attempts++
  }

  throw new Error("Analysis timed out after 5 minutes.")
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
    console.error(`[SSL LABS PROXY] Error for host ${host}:`, error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
