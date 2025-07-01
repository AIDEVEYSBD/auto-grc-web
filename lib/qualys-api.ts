const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"

/**
 * A wrapper around fetch to handle Qualys API's specific error formats.
 * @param url The URL to fetch.
 * @param options The request options.
 * @returns The parsed JSON response.
 */
async function safeFetch(url: string, options: RequestInit) {
  const response = await fetch(url, options)
  const responseText = await response.text()

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}: ${responseText}`
    try {
      const errorJson = JSON.parse(responseText)
      if (errorJson.errors && errorJson.errors[0]?.message) {
        errorMessage = errorJson.errors[0].message
      }
    } catch (e) {
      // Response was not JSON, use the raw text.
    }
    throw new Error(errorMessage)
  }

  try {
    return JSON.parse(responseText)
  } catch (e) {
    throw new Error("Received an invalid JSON response from the API.")
  }
}

/**
 * Performs a scan on a given host and polls for the result.
 * @param host The hostname to scan.
 * @param email The email to associate with the scan for notifications.
 * @returns The completed scan data.
 */
export async function performScan(host: string, email: string): Promise<any> {
  // Initiate a new scan
  await safeFetch(`${QUALYS_API_BASE}/analyze?host=${host}&startNew=on&all=done`, {
    method: "GET",
  })

  // Poll for completion
  let attempts = 0
  const maxAttempts = 30 // 5 minutes max (30 attempts * 10s)
  let scanData

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 10000)) // Wait 10 seconds

    scanData = await safeFetch(`${QUALYS_API_BASE}/analyze?host=${host}&all=done`, {
      method: "GET",
    })

    if (scanData.status === "READY" || scanData.status === "ERROR") {
      break
    }
    attempts++
  }

  if (scanData?.status !== "READY") {
    throw new Error(`Scan for ${host} did not complete in time or failed. Final status: ${scanData?.status}`)
  }

  return scanData
}

/**
 * Recursively gets all possible keys from a nested object in dot notation.
 * @param obj The object to parse.
 * @param prefix The current prefix for dot notation.
 * @returns An array of all possible keys.
 */
function getKeys(obj: any, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) {
    return []
  }
  return Object.keys(obj).reduce((res: string[], el: string) => {
    const currentKey = prefix ? `${prefix}.${el}` : el
    if (typeof obj[el] === "object" && obj[el] !== null) {
      return [...res, currentKey, ...getKeys(obj[el], currentKey)]
    }
    return [...res, currentKey]
  }, [])
}

/**
 * Extracts a sorted, unique list of available fields from scan data.
 * @param scanData The raw scan data from the Qualys API.
 * @returns A sorted array of unique field keys.
 */
export function getAvailableFields(scanData: any): string[] {
  const allKeys = getKeys(scanData)
  return [...new Set(allKeys)].sort()
}
