import type React from "react"

export interface Application {
  id: string
  name: string
  owner_email: string
  created_at: string
  criticality: string
  "cloud-provider": string
  overall_score: number
}

export interface Framework {
  id: string
  name: string
  version: string
  created_at: string
  master: boolean
}

export interface Control {
  id: string
  framework_id: string
  ID: string
  Domain: string
  "Sub-Domain": string
  Controls: string
}

export interface ComplianceAssessment {
  id: string
  application_id: string
  control_id: string
  status: "pass" | "fail" | "partial"
  score: number
  mapped_from?: string
  source: string
  assessed_at: string
}

export interface FrameworkMapping {
  id: string
  source_control_id: string
  target_control_id: string
  mapping_score: number
  status: string
  explanation: string
  created_at: string
}

export interface Integration {
  id: string
  name: string
  category: string
  linked_controls: string | null
  is_connected: boolean
}

export interface Capability {
  id: string
  name: string
  description: string
  is_enabled: boolean
}

export interface KPIData {
  label: string
  value: number | string
  icon?: React.ComponentType<{ className?: string }>
  color?: string
}

export interface DonutData {
  name: string
  value: number
  total: number
  color: string
}
