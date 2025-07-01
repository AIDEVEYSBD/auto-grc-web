import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, organization } = await request.json()

    if (!firstName || !lastName || !email || !organization) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    // Basic email validation to prevent common personal email services
    if (/(gmail|yahoo|hotmail|outlook)\.com$/.test(email)) {
      return NextResponse.json({ error: "Please use a corporate email address." }, { status: 400 })
    }

    const response = await fetch("https://api.ssllabs.com/api/v4/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, organization }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Qualys Registration Error:", data)
      return NextResponse.json(
        { error: "Failed to register with Qualys API", details: data },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Internal Server Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
