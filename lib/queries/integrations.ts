import useSWR from "swr"
import { supabase } from "@/lib/supabase"
import type { Integration } from "@/types"

// Fetcher function for SWR
const fetcher = async (key: string) => {
  const { data, error } = await supabase.from("integrations").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data as Integration[]
}

export function useIntegrations() {
  const { data, error, isLoading, mutate } = useSWR("integrations", fetcher)

  return {
    data: data || [],
    error,
    isLoading,
    mutate,
  }
}

export function useIntegrationKPIs() {
  const { data: integrations } = useIntegrations()

  if (!integrations) {
    return {
      categories: 0,
      connected: 0,
      needAttention: 0,
      totalDatapoints: 0,
    }
  }

  const categories = new Set(integrations.map((i) => i.category)).size
  const connected = integrations.filter((i) => i.status === "connected").length
  const needAttention = integrations.filter((i) => i.status === "warning" || i.status === "disconnected").length
  const totalDatapoints = integrations.reduce((sum, i) => sum + (i.datapoints || 0), 0)

  return {
    categories,
    connected,
    needAttention,
    totalDatapoints,
  }
}

export function useIntegrationsByCategory() {
  const { data: integrations } = useIntegrations()

  if (!integrations) return {}

  return integrations.reduce(
    (acc, integration) => {
      const category = integration.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(integration)
      return acc
    },
    {} as Record<string, Integration[]>,
  )
}
