import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const host = searchParams.get("host")
  const startNew = searchParams.get("startNew")
  const email = searchParams.get("email")

  if (!host) {
    return NextResponse.json({ error: "Host parameter is required" }, { status: 400 })
  }

  if (!email) {
    return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
  }

  try {
    // Build the Qualys SSL Labs API URL
    const qualysUrl = new URL("https://api.ssllabs.com/api/v4/analyze")
    qualysUrl.searchParams.set("host", host)

    if (startNew === "on") {
      qualysUrl.searchParams.set("startNew", "on")
    }

    // Set all=done to get complete results when ready
    qualysUrl.searchParams.set("all", "done")

    console.log("Making request to Qualys API:", qualysUrl.toString())

    // Make the request to Qualys SSL Labs API with required headers
    const response = await fetch(qualysUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Cybersecurity Dashboard Integration/1.0",
        email: email, // Use the provided email
      },
    })

    console.log("Qualys API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Qualys API error response:", errorText)

      // Handle specific error codes according to API docs
      if (response.status === 400) {
        return NextResponse.json(
          {
            error: "Invalid parameters sent to Qualys API",
            details: errorText,
            suggestion: "Please check the hostname format",
          },
          { status: 400 },
        )
      } else if (response.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            details: "Too many requests to Qualys API",
          },
          { status: 429 },
        )
      } else if (response.status === 441) {
        return NextResponse.json(
          {
            error: "Email not registered",
            details: errorText,
            needsRegistration: true,
          },
          { status: 441 },
        )
      }

      throw new Error(`Qualys API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Qualys API response data:", JSON.stringify(data, null, 2))

    // Return the response with CORS headers
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    console.error("Qualys proxy error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch SSL analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, organization } = body

    if (!firstName || !lastName || !email || !organization) {
      return NextResponse.json({ error: "All registration fields are required" }, { status: 400 })
    }

    console.log("Registering with Qualys API:", { firstName, lastName, email, organization })

    // Make registration request to Qualys SSL Labs API
    const response = await fetch("https://api.ssllabs.com/api/v4/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Cybersecurity Dashboard Integration/1.0",
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        organization,
      }),
    })

    console.log("Qualys registration response status:", response.status)

    const text = await response.text()

    if (!response.ok) {
      // SSL Labs returns 400 when the e-mail is already registered.
      try {
        const err = JSON.parse(text)
        const alreadyReg =
          response.status === 400 &&
          Array.isArray(err?.errors) &&
          err.errors.some(
            (e: any) =>
              e.field === "email" &&
              typeof e.message === "string" &&
              e.message.toLowerCase().includes("already registered"),
          )

        if (alreadyReg) {
          console.warn("Qualys email already registered – continuing.")
          return NextResponse.json(
            { status: "already_registered", message: "Email already registered." },
            { status: 200 },
          )
        }

        // Not "already registered" – treat as real error
        return NextResponse.json({ error: "Registration failed", details: err }, { status: response.status })
      } catch {
        // Fallback for non-JSON error bodies
        return NextResponse.json({ error: "Registration failed", details: text }, { status: response.status })
      }
    }

    // Success path
    const data = JSON.parse(text || "{}")
    return NextResponse.json(data, {
      headers: { "Access-Control-Allow-Origin": "*" },
    })
  } catch (error) {
    console.error("Qualys registration proxy error:", error)
    return NextResponse.json(
      {
        error: "Failed to register with Qualys SSL Labs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
