import { NextResponse } from "next/server"

const mockCompliance: Record<string, { sys_id: string; compliance_percentages: Record<string, number> }> = {
  webapp1: {
    sys_id: "b8d3a9c1-4e6f-4c8a-9f2b-1e7d9c5a3b0f",
    compliance_percentages: {
      AM00104: 95.5,
      AM00201: 100,
      MP00105: 80.0,
      VM00104: 75.2,
      VM00106: 88.9,
      VM00201: 92.0,
      VM00401: 100,
    },
  },
  mobileapp: {
    sys_id: "c9e4b0d2-5f7g-5d9b-0g3c-2f8e0d6b4c1g",
    compliance_percentages: {
      AM00104: 85.0,
      AM00201: 90.0,
      MP00105: 70.0,
      VM00104: 65.0,
      VM00106: 72.5,
      VM00201: 88.0,
      VM00401: 95.0,
    },
  },
  dataplatform: {
    sys_id: "d0f5c1e3-6g8h-6e0c-1h4d-3g9f1e7c5d2h",
    compliance_percentages: {
      AM00104: 98,
      AM00201: 99,
      MP00105: 95,
      VM00104: 91,
      VM00106: 93,
      VM00201: 97,
      VM00401: 100,
    },
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appName = searchParams.get("appName")?.toLowerCase().replace(/\s/g, "")

  if (!appName) {
    return NextResponse.json({ detail: "Application name is required" }, { status: 400 })
  }

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (mockCompliance[appName]) {
    return NextResponse.json(mockCompliance[appName])
  } else {
    return NextResponse.json({ detail: "Application not found" }, { status: 404 })
  }
}
