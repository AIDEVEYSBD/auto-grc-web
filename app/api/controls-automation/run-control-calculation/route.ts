import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { app_name, control_id } = body

  if (!app_name || !control_id) {
    return NextResponse.json({ detail: "app_name and control_id are required" }, { status: 400 })
  }

  // Simulate a longer process for calculation
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Simulate a possible failure
  if (Math.random() > 0.8) {
    return NextResponse.json(
      { status: "error", message: "Calculation failed due to an unexpected error." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    status: "success",
    message: `Calculation for ${control_id} on ${app_name} completed.`,
    inserted: [
      {
        sys_id: "b8d3a9c1-4e6f-4c8a-9f2b-1e7d9c5a3b0f",
        Particulars: "Total assets scanned",
        Count: "150",
        Timestamp: new Date().toISOString(),
      },
      {
        sys_id: "b8d3a9c1-4e6f-4c8a-9f2b-1e7d9c5a3b0f",
        Particulars: "New vulnerabilities found",
        Count: "3",
        Timestamp: new Date().toISOString(),
      },
    ],
  })
}
