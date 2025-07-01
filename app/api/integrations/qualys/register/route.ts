import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { firstName, lastName, email, organization } = await request.json()

  if (!firstName || !lastName || !email || !organization) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const response = await fetch("https://api.ssllabs.com/api/v4/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, organization }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.errors?.[0]?.message || "Failed to register with Qualys" },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Qualys registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
