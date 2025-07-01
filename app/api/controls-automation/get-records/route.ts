import { NextResponse } from "next/server"

const mockRecords: Record<string, Record<string, any[]>> = {
  "b8d3a9c1-4e6f-4c8a-9f2b-1e7d9c5a3b0f": {
    // sys_id for webapp1
    AM00104: [
      { Particulars: "Total Users", Count: 200, "Last Checked": "2025-07-01" },
      { Particulars: "Users with MFA", Count: 191, "Last Checked": "2025-07-01" },
      { Particulars: "Admin Accounts", Count: 5, "Last Checked": "2025-07-01" },
    ],
    VM00104: [
      { Asset: "Server-01", Vulnerability: "CVE-2025-1234", Severity: "High", Status: "Patched" },
      { Asset: "Server-02", Vulnerability: "CVE-2025-5678", Severity: "Medium", Status: "Open" },
      { Asset: "Server-01", Vulnerability: "CVE-2025-9999", Severity: "Low", Status: "Open" },
    ],
  },
  "c9e4b0d2-5f7g-5d9b-0g3c-2f8e0d6b4c1g": {
    // sys_id for mobileapp
    AM00104: [{ Particulars: "Total Users", Count: 5000, "Last Checked": "2025-06-30" }],
    MP00105: [{ Device: "iPhone 15", "Encryption Status": "Enabled", "Policy Compliant": "Yes" }],
  },
  "d0f5c1e3-6g8h-6e0c-1h4d-3g9f1e7c5d2h": {
    // sys_id for dataplatform
    VM00201: [{ Database: "Main DWH", "Patch Level": "Up-to-date", "Last Patched": "2025-06-28" }],
  },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")
  const sys_id = searchParams.get("sys_id")

  if (!table || !sys_id) {
    return NextResponse.json({ detail: "table and sys_id are required" }, { status: 400 })
  }

  await new Promise((resolve) => setTimeout(resolve, 800)) // Simulate network delay

  const records = mockRecords[sys_id]?.[table] || []

  if (records.length === 0) {
    // Return empty records instead of 404 to allow the frontend to display "No records found"
    return NextResponse.json({ table, sys_id, records: [] })
  }

  return NextResponse.json({ table, sys_id, records })
}
