"use server"

import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

// Initialize Supabase admin client for elevated privileges (e.g., ALTER TABLE)
// In a real project, use the Service Role Key for this.
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const QUALYS_API_BASE = "https://api.ssllabs.com/api/v4"

const personalEmailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const RegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  organization: z.string().min(1, "Organization is required."),
  email: z
    .string()
    .email("Invalid email address.")
    .refine(
      (email) => !personalEmailDomains.includes(email.split("@")[1]),
      "Personal email addresses are not allowed. Please use a corporate email.",
    ),
})

interface AnalyzeResponse {
  host: string
  status: "READY" | "IN_PROGRESS" | "DNS" | "ERROR"
  endpoints?: any[]
  [key: string]: any
}

/**
 * Step 1: Registers with Qualys and fetches a sample schema.
 */
export async function registerAndFetchSchema(prevState: any, formData: FormData) {
  const validatedFields = RegistrationSchema.safeParse(Object.fromEntries(formData.entries()))

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid form data.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, firstName, lastName, organization } = validatedFields.data

  try {
    // As per docs, we first register the user.
    const registerResponse = await fetch(`${QUALYS_API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, organization }),
    })

    if (!registerResponse.ok) {
      const errorBody = await registerResponse.json()
      console.error("Qualys Registration Error:", errorBody)
      return { success: false, error: `Registration failed: ${errorBody.errors?.[0]?.message || "Unknown error"}` }
    }

    // Then, kick off a sample scan to get the response schema.
    const analyzeUrl = `${QUALYS_API_BASE}/analyze?host=autogrc.cloud&startNew=on&all=done`
    const analyzeResponse = await fetch(analyzeUrl, {
      headers: { email },
    })

    if (!analyzeResponse.ok) {
      return { success: false, error: "Failed to start sample analysis after registration." }
    }

    let data: AnalyzeResponse = await analyzeResponse.json()

    // Poll until the analysis is complete to get the full schema
    let attempts = 0
    while (data.status === "IN_PROGRESS" && attempts < 20) {
      // Timeout after ~2.5 mins
      await sleep(attempts < 5 ? 5000 : 10000)
      const pollResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=autogrc.cloud`, { headers: { email } })
      data = await pollResponse.json()
      attempts++
    }

    if (data.status !== "READY") {
      return { success: false, error: `Failed to get sample report. Status: ${data.status}` }
    }

    const keys = Object.keys(data)
    return { success: true, keys, email }
  } catch (e) {
    console.error(e)
    return { success: false, error: "An unexpected error occurred." }
  }
}

/**
 * Step 2: Customizes the DB schema and runs bulk assessments.
 */
export async function customizeSchemaAndRunAssessments({
  selectedKeys,
  email,
}: { selectedKeys: string[]; email: string }) {
  try {
    // 1. Alter Table
    for (const key of selectedKeys) {
      // Basic sanitization for column names
      const columnName = key.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
      // This is a simplified type mapping. A real implementation would be more robust.
      const columnType = "JSONB"
      await supabaseAdmin.rpc("execute_sql", {
        sql: `ALTER TABLE public.qualys_ssl_assessments ADD COLUMN IF NOT EXISTS "${columnName}" ${columnType};`,
      })
    }

    // 2. Fetch all applications
    const { data: applications, error: appError } = await supabaseAdmin.from("applications").select("id, url") // Assuming 'url' column exists

    if (appError) throw new Error(`Failed to fetch applications: ${appError.message}`)

    // 3. Run bulk assessment
    for (const app of applications as any[]) {
      if (!app.url) continue
      const hostname = new URL(app.url).hostname

      // This part is long-running and should ideally be a background job.
      // For this implementation, we run it directly.
      await processSingleAssessment(app.id, hostname, email, selectedKeys)
      await sleep(1000) // Small delay to avoid hitting rate limits immediately
    }

    // 4. Update integration status
    await supabaseAdmin
      .from("integrations")
      .update({ "is-connected": true })
      .eq("id", "b3f4ff74-56c1-4321-b137-690b939e454a")

    return { success: true }
  } catch (e: any) {
    console.error("Bulk Assessment Error:", e)
    return { success: false, error: e.message || "Failed to run bulk assessment." }
  }
}

async function processSingleAssessment(appId: string, hostname: string, email: string, selectedKeys: string[]) {
  const analyzeUrl = `${QUALYS_API_BASE}/analyze?host=${hostname}&startNew=on&all=done`
  const initialResponse = await fetch(analyzeUrl, { headers: { email } })

  if (!initialResponse.ok) {
    console.warn(`Skipping ${hostname}: Initial request failed.`)
    return
  }

  let data: AnalyzeResponse = await initialResponse.json()
  let attempts = 0
  while (data.status === "IN_PROGRESS" && attempts < 20) {
    await sleep(attempts < 5 ? 5000 : 10000)
    const pollResponse = await fetch(`${QUALYS_API_BASE}/analyze?host=${hostname}`, { headers: { email } })
    data = await pollResponse.json()
    attempts++
  }

  const assessmentData: { [key: string]: any } = {
    application_id: appId,
    hostname: hostname,
    assessment_status: data.status,
    last_scanned_at: new Date().toISOString(),
  }

  if (data.status === "READY") {
    for (const key of selectedKeys) {
      if (data.hasOwnProperty(key)) {
        const columnName = key.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()
        assessmentData[columnName] = data[key]
      }
    }
  }

  await supabaseAdmin.from("qualys_ssl_assessments").upsert(assessmentData, { onConflict: "application_id" })
}
