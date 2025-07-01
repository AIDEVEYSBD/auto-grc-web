import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { integrationId, config } = body

    if (!integrationId || !config) {
      return NextResponse.json({ error: "Missing integrationId or config" }, { status: 400 })
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
      console.error("Supabase update error:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Failed to connect integration:", error)
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 })
  }
}
