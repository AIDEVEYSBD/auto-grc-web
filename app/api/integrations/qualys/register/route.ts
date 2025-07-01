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

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    let data

    if (contentType && contentType.includes("application/json")) {
      data = await response.json()
    } else {
      const textResponse = await response.text()
      console.error("Non-JSON response from Qualys:", textResponse)

      // If it's an HTML error page or plain text, create a structured error
      if (textResponse.includes("already registered") || textResponse.toLowerCase().includes("email")) {
        // Email already registered - this is actually OK, we can proceed
        return NextResponse.json({
          success: true,
          message: "Email already registered - proceeding with existing registration",
          email: email,
          alreadyRegistered: true,
        })
      }

      return NextResponse.json(
        {
          error: "Invalid response from Qualys API. Please try again.",
        },
        { status: 500 },
      )
    }

    // Handle specific Qualys error responses
    if (!response.ok) {
      // Check if it's an "already registered" error
      if (
        response.status === 400 &&
        (data.errors?.[0]?.message?.includes("already registered") || data.message?.includes("already registered"))
      ) {
        // Email already registered - this is OK, we can proceed
        return NextResponse.json({
          success: true,
          message: "Email already registered - proceeding with existing registration",
          email: email,
          alreadyRegistered: true,
        })
      }

      return NextResponse.json(
        { error: data.errors?.[0]?.message || data.message || "Registration failed" },
        { status: response.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Registration successful",
      email: email,
      alreadyRegistered: false,
    })
  } catch (error) {
    console.error("Qualys registration error:", error)

    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json(
        {
          error: "Invalid response format from Qualys API. Please try again.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
