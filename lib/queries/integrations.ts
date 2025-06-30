import { supabase } from "../supabase"
import { useSupabaseQuery } from "../swr-client"
import type { Integration } from "@/types"

export function useIntegrations() {
  return useSupabaseQuery<Integration>("integrations", () =>
    supabase.from("integrations").select("*").order("name", { ascending: true }),
  )
}

export function useIntegrationKPIs() {
  const { data: integrations } = useIntegrations()

  const categories = new Set(integrations?.map((i) => i.category)).size || 0
  const connected = integrations?.filter((i) => i.status === "connected").length || 0
  const needAttention = integrations?.filter((i) => i.status !== "connected").length || 0
  const totalDatapoints = integrations?.reduce((sum, i) => sum + i.datapoints, 0) || 0

  return {
    categories,
    connected,
    needAttention,
    totalDatapoints,
  }
}

export function useIntegrationsByCategory() {
  const { data: integrations } = useIntegrations()

  const grouped =
    integrations?.reduce(
      (acc, integration) => {
        if (!acc[integration.category]) {
          acc[integration.category] = []
        }
        acc[integration.category].push(integration)
        return acc
      },
      {} as Record<string, Integration[]>,
    ) || {}

  return grouped
}
