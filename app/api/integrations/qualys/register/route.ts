import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const QUALYS_REGISTER_URL = "https://api.ssllabs.com/api/v4/register"

// Helper that always gives us a parsed JSON object OR undefined + raw text.
async function parseQualysResponse(resp: Response) {
  const text = await resp.text()
  try {
    return { json: JSON.parse(text) as unknown, text }
  } catch {
    return { json: undefined, text }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, organization } = await req.json()

    if (!firstName || !lastName || !email || !organization) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const qualysResp = await fetch(QUALYS_REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, organization }),
    })

    const { json, text } = await parseQualysResponse(qualysResp)

    // Qualys sometimes returns plain-text errors like “An error occurred …”
    const alreadyRegistered =
      text.toLowerCase().includes("already registered") ||
      (json && typeof json === "object" && "message" in json && String(json.message).includes("already registered"))

    if (alreadyRegistered) {
      // Treat this as a successful “idempotent” registration.
      return NextResponse.json(
        { success: true, message: "Email already registered. Proceeding.", alreadyRegistered: true },
        { status: 200 },
      )
    }

    if (!qualysResp.ok) {
      const friendly =
        (json && (json as any).errors?.[0]?.message) || (json && (json as any).message) || text || "Registration failed"
      return NextResponse.json({ error: friendly }, { status: qualysResp.status })
    }

    // Success & JSON payload
    return NextResponse.json(
      {
        success: true,
        message: (json as any)?.message ?? "Registration successful",
        alreadyRegistered: false,
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("Qualys registration route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
