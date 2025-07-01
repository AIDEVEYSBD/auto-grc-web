import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { host, email, startNew } = await request.json()

    if (!host || !email) {
      return NextResponse.json({ error: "Host and email are required" }, { status: 400 })
    }

    const params = new URLSearchParams({
      host,
      all: "done",
    })

    if (startNew) {
      params.set("startNew", "on")
    }

    const analyzeUrl = `https://api.ssllabs.com/api/v4/analyze?${params.toString()}`

    const response = await fetch(analyzeUrl, {
      method: "GET",
      headers: {
        email: email,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Qualys Analyze Error:", data)
      // Pass the status from Qualys API back to the client
      return NextResponse.json(
        { error: "Failed to analyze host with Qualys API", details: data },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Internal Server Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
