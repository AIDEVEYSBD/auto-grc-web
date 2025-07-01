import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const QUALYS_ANALYZE_URL = "https://api.ssllabs.com/api/v4/analyze"

export async function POST(req: NextRequest) {
  try {
    const { email, host = "autogrc.cloud" } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email header is required" }, { status: 400 })
    }

    const resp = await fetch(`${QUALYS_ANALYZE_URL}?host=${encodeURIComponent(host)}&startNew=on&all=done`, {
      headers: { email },
    })

    const raw = await resp.text()
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      // Not valid JSON – forward the text
      return NextResponse.json({ error: raw }, { status: resp.status || 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    console.error("Qualys sample-scan route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
