import { NextResponse } from "next/server"

// Helper to flatten the JSON object to get all possible keys
const getObjectKeys = (obj: any, prefix = ""): string[] => {
  return Object.keys(obj).reduce((res, el) => {
    const key = prefix ? `${prefix}.${el}` : el
    if (typeof obj[el] === "object" && obj[el] !== null && !Array.isArray(obj[el])) {
      return [...res, ...getObjectKeys(obj[el], key)]
    }
    // If it's an array of objects, take keys from the first element
    if (Array.isArray(obj[el]) && obj[el].length > 0 && typeof obj[el][0] === "object") {
      return [...res, ...getObjectKeys(obj[el][0], `${key}[]`)]
    }
    return [...res, key]
  }, [] as string[])
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required for sample scan" }, { status: 400 })
    }

    const host = "autogrc.cloud"
    const analyzeUrl = `https://api.ssllabs.com/api/v4/analyze?host=${host}&all=done&startNew=on`

    const response = await fetch(analyzeUrl, { headers: { email } })
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch sample scan", details: data }, { status: response.status })
    }

    // Poll until ready
    let result = data
    while (result.status !== "READY" && result.status !== "ERROR") {
      await new Promise((resolve) => setTimeout(resolve, 10000)) // wait 10s
      const pollUrl = `https://api.ssllabs.com/api/v4/analyze?host=${host}&all=done`
      const pollResponse = await fetch(pollUrl, { headers: { email } })
      result = await pollResponse.json()
    }

    if (result.status === "ERROR") {
      return NextResponse.json({ error: "Sample scan resulted in an error", details: result }, { status: 500 })
    }

    const availableFields = Array.from(new Set(getObjectKeys(result))).sort()

    return NextResponse.json({ availableFields })
  } catch (error) {
    console.error("Internal Server Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
