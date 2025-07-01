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
    // --- Initial request to start the analysis ---
    let analyzeUrl = `${SSL_LABS_API_URL}/analyze?host=${host}&publish=off&all=done&startNew=on`
    let response = await fetch(analyzeUrl)

    // **FIX**: Handle non-JSON responses from the external API
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`SSL Labs API initial request failed with status ${response.status}: ${errorText}`)
      return NextResponse.json({ error: `SSL Labs API error: ${errorText}` }, { status: response.status })
    }

    let data = await response.json()

    const maxRetries = 30 // 30 retries * 10s = 5 minutes max
    let retries = 0

    // --- Poll until the analysis is READY or fails ---
    while (data.status !== "READY" && data.status !== "ERROR" && retries < maxRetries) {
      await sleep(10000) // Wait 10 seconds between polls
      analyzeUrl = `${SSL_LABS_API_URL}/analyze?host=${host}&publish=off&all=done`
      response = await fetch(analyzeUrl)

      // **FIX**: Handle non-JSON responses during polling
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`SSL Labs API polling request failed with status ${response.status}: ${errorText}`)
        return NextResponse.json({ error: `SSL Labs API polling error: ${errorText}` }, { status: response.status })
      }

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
  } catch (error: any) {
    console.error("SSL Labs API proxy error:", error)
    // Catch JSON parsing errors or other unexpected issues
    const errorMessage = error.message || "An unexpected error occurred."
    return NextResponse.json({ error: `Failed to fetch data from SSL Labs API. ${errorMessage}` }, { status: 500 })
  }
}
