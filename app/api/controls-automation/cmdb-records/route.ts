import { NextResponse } from "next/server"

const mockData: Record<string, { sys_id: string; records: any[] }> = {
  webapp1: {
    sys_id: "b8d3a9c1-4e6f-4c8a-9f2b-1e7d9c5a3b0f",
    records: [
      {
        name: "WebApp1",
        owner: "Team Alpha",
        status: "Production",
        os: "Linux",
        ip_address: "192.168.1.10",
      },
      {
        name: "WebApp1-DB",
        owner: "Team Alpha",
        status: "Production",
        os: "Linux",
        ip_address: "192.168.1.11",
      },
    ],
  },
  mobileapp: {
    sys_id: "c9e4b0d2-5f7g-5d9b-0g3c-2f8e0d6b4c1g",
    records: [
      {
        name: "MobileApp",
        owner: "Team Bravo",
        status: "Production",
        os: "iOS/Android",
        api_endpoint: "api.mobileapp.com",
      },
    ],
  },
  dataplatform: {
    sys_id: "d0f5c1e3-6g8h-6e0c-1h4d-3g9f1e7c5d2h",
    records: [
      { name: "Data Ingestion", owner: "Team Charlie", status: "Production", type: "Service" },
      { name: "Data Warehouse", owner: "Team Charlie", status: "Production", type: "Database" },
      { name: "BI Tool", owner: "Team Charlie", status: "Production", type: "Application" },
    ],
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

  if (mockData[appName]) {
    return NextResponse.json(mockData[appName])
  } else {
    return NextResponse.json({ detail: "Application not found" }, { status: 404 })
  }
}
