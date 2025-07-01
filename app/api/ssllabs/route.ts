import { NextResponse } from "next/server"

const SSL_LABS_API_URL = "https://api.ssllabs.com/api/v3"

// Helper function to delay execution
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const host = searchParams.get("host")

  if (!host) {
    return NextResponse.json({ error: "Host parameter is required" }, { status: 400 })
  }

  try {
    // Initial request to start the analysis
    let analyzeUrl = `${SSL_LABS_API_URL}/analyze?host=${host}&publish=off&all=done&startNew=on`
    let response = await fetch(analyzeUrl)
    let data = await response.json()

    const maxRetries = 30 // 30 retries * 10s = 5 minutes max
    let retries = 0

    // Poll until the analysis is READY or fails
    while (data.status !== "READY" && data.status !== "ERROR" && retries < maxRetries) {
      await sleep(10000) // Wait 10 seconds between polls
      analyzeUrl = `${SSL_LABS_API_URL}/analyze?host=${host}&publish=off&all=done`
      response = await fetch(analyzeUrl)
      data = await response.json()
      retries++
    }

    if (data.status === "ERROR") {
      return NextResponse.json({ error: `SSL Labs analysis failed: ${data.statusMessage}` }, { status: 500 })
    }

    if (retries >= maxRetries) {
      return NextResponse.json({ error: "SSL Labs analysis timed out." }, { status: 504 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("SSL Labs API proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch data from SSL Labs API." }, { status: 500 })
  }
}
