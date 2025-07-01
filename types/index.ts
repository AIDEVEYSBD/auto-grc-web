import type React from "react"

export interface Integration {
  id: string
  name: string
  category: string
  description?: string
  linked_controls: string | null
  "is-connected": boolean
  created_at: string
  config?: {
    userInfo?: {
      firstName: string
      lastName: string
      workEmail: string
      organization: string
    }
    selectedFields?: string[]
    [key: string]: any // Allow other config properties
  } | null
  connected_at?: string
  updated_at?: string
}

export interface KPIData {
  label: string
  value: string | number
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined
      titleId?: string | undefined
    } & React.RefAttributes<SVGSVGElement>
  >
  color: "blue" | "green" | "yellow" | "purple"
}

export type FilterType = "all" | "connected" | "disconnected"

export interface Framework {
  id: string
  name: string
  version: string
  description?: string
  controls_count: number
  created_at: string
  updated_at: string
}

export interface Control {
  id: string
  framework_id: string
  control_id: string
  title: string
  description?: string
  category?: string
  created_at: string
}

export interface Assessment {
  id: string
  name: string
  framework_id: string
  status: "draft" | "in_progress" | "completed"
  progress: number
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  name: string
  description?: string
  owner: string
  criticality: "low" | "medium" | "high" | "critical"
  frameworks: string[]
  last_assessment: string
  compliance_score: number
  created_at: string
}

export interface Mapping {
  id: string
  source_framework: string
  target_framework: string
  source_control: string
  target_control: string
  mapping_type: "exact" | "partial" | "related"
  confidence: number
  created_at: string
}

export interface Capability {
  id: string
  name: string
  description: string
  icon: string
  status: "active" | "inactive" | "coming_soon"
  category: string
}

export interface MarketplaceTool {
  id: string
  name: string
  category: string
  description: string
  logo: string
}
