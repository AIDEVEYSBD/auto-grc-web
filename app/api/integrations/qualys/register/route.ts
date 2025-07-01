import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * POST /api/integrations/qualys/register
 * Handles user information for the Qualys integration.
 * The public Qualys SSL Labs API does not require formal registration,
 * but we capture user details to associate with the integration setup.
 */
export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, organization } = await request.json()

    if (!firstName || !lastName || !email || !organization) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })
    }

    // The public Qualys SSL Labs API doesn't have a registration endpoint.
    // We are simply acknowledging the user's details for our records.
    console.log(`Qualys integration setup initiated for ${email} from ${organization}.`)

    return NextResponse.json(
      {
        success: true,
        message: "User details acknowledged. Proceeding to sample scan.",
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("Qualys register route error:", err)
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
    return NextResponse.json({ error: "Internal server error.", details: errorMessage }, { status: 500 })
  }
}
