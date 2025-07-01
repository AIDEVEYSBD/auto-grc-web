import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: Request) {
  const supabase = createClient()
  try {
    const { integrationId, user, selectedFields } = await request.json()

    if (!integrationId || !user || !selectedFields) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const config = {
      user,
      selectedFields,
    }

    const { data, error } = await supabase
      .from("integrations")
      .update({
        "is-connected": true,
        config: config,
        connected_at: new Date().toISOString(),
      })
      .eq("id", integrationId)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Connect integration error:", error)
    return NextResponse.json({ error: "Failed to connect integration." }, { status: 500 })
  }
}
