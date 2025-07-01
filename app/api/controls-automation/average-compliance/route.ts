import { NextResponse } from "next/server"

const mockCompliance: Record<string, { compliance_percentages: Record<string, number> }> = {
  webapp1: {
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

const allControls = ["AM00104", "AM00201", "MP00105", "VM00104", "VM00106", "VM00201", "VM00401"]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const appNamesParam = searchParams.get("app_names")

  if (!appNamesParam) {
    return NextResponse.json({ detail: "app_names parameter is required" }, { status: 400 })
  }

  const appNames = appNamesParam.split(",").map((name) => name.trim().toLowerCase().replace(/\s/g, ""))

  await new Promise((resolve) => setTimeout(resolve, 1200)) // Simulate network delay

  const controlSums: Record<string, number> = {}
  const controlCounts: Record<string, number> = {}

  for (const appName of appNames) {
    const appData = mockCompliance[appName]
    if (appData) {
      for (const control of allControls) {
        const percentage = appData.compliance_percentages[control]
        if (percentage !== undefined) {
          controlSums[control] = (controlSums[control] || 0) + percentage
          controlCounts[control] = (controlCounts[control] || 0) + 1
        }
      }
    }
  }

  const averages: Record<string, number> = {}
  for (const control of allControls) {
    if (controlCounts[control] > 0) {
      averages[control] = controlSums[control] / controlCounts[control]
    } else {
      averages[control] = 0 // Or handle as null if preferred
    }
  }

  if (Object.keys(averages).length === 0) {
    return NextResponse.json({ detail: "None of the specified applications were found" }, { status: 404 })
  }

  return NextResponse.json({ average_compliance: averages })
}
