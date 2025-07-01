import { createClient } from "@supabase/supabase-js"
import type {
  Application,
  Framework,
  Control,
  ComplianceAssessment,
  FrameworkMapping,
  Integration,
  Capability,
} from "@/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Type-safe database interface
export type Database = {
  public: {
    Tables: {
      applications: {
        Row: Application
      }
      frameworks: {
        Row: Framework
      }
      controls: {
        Row: Control
      }
      compliance_assessment: {
        Row: ComplianceAssessment
      }
      framework_mappings: {
        Row: FrameworkMapping
      }
      integrations: {
        Row: Integration
      }
      capabilities: {
        Row: Capability
      }
    }
  }
}

// Connection health check
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("frameworks").select("count").limit(1)
    if (error) throw error
    return true
  } catch (error) {
    console.error("Supabase connection error:", error)
    return false
  }
}

// Re-export createClient so it can be imported from "@/lib/supabase"
export { createClient }
