import type React from "react"

export interface Integration {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "error"
  description?: string
  last_sync?: string
  config?: Record<string, any>
  category: string
  "is-connected": boolean
  endpoint?: string | null
}

export interface KPIData {
  label: string
  value: string | number
  icon?: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined
      titleId?: string | undefined
    } & React.RefAttributes<SVGSVGElement>
  >
  color?: "blue" | "green" | "yellow" | "purple" | "red"
}

export type FilterType = "all" | "connected" | "disconnected"

export interface Framework {
  id: string
  name: string
  description?: string
  version?: string
  status?: string
  controls_count?: number
  created_at: string
  updated_at: string
}

export interface Control {
  id: string
  framework_id: string
  ID: string // This is the control_id field in the database
  title: string
  description?: string
  Domain?: string
  category?: string
}

export interface ComplianceAssessment {
  id: string
  application_id: string
  control_id: string
  status: string
  score: number
  mapped_from: string
  source: string
  assessed_at: string
  explanation?: string
}

export interface Assessment {
  id: string
  name: string
  framework_id: string
  application_id: string
  status: string
  score?: number
  progress?: number
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  name: string
  description?: string
  owner_email: string
  criticality: string
  "cloud-provider": string
  overall_score: number
  applicability?: string | null
  created_at: string
}

export interface Mapping {
  id: string
  source_framework_id: string
  target_framework_id: string
  source_control_id: string
  target_control_id: string
  mapping_type: string
  confidence?: number
  created_at?: string
}

export interface FrameworkMapping {
  id: string
  source_control_id: string
  target_control_id: string
  source_framework_id: string
  target_framework_id: string
  mapping_type: string
  confidence?: number
  created_at?: string
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

export interface ApplicabilityCategory {
  id: string
  category_name: string
}
