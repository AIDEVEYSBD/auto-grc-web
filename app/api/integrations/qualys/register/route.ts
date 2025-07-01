import { type NextRequest, NextResponse } from "next/server"

const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, organization } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !organization) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate email format and domain restrictions
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check for restricted email domains
    const restrictedDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
    const emailDomain = email.split("@")[1].toLowerCase()
    if (restrictedDomains.includes(emailDomain)) {
      return NextResponse.json(
        { error: "Personal email addresses are not allowed. Please use your organization email." },
        { status: 400 },
      )
    }

    // Register with Qualys SSL Labs API
    const response = await fetch(`${QUALYS_API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        organization,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.errors?.[0]?.message || "Registration failed" },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      email: email, // Return email for use in subsequent requests
    })
  } catch (error) {
    console.error("Qualys registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
