"use client"

import useSWR from "swr"
import { supabase } from "@/lib/supabase"
import { useMemo } from "react"
import type { Integration } from "@/types"

// Fetcher function for SWR - fetches all integrations from the DB
const fetcher = async (key: string) => {
  console.log("Fetching integrations from Supabase...")
  const { data, error } = await supabase.from("integrations").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Supabase fetch error:", error)
    throw error
  }

  console.log("Fetched data:", data) // This will show you what data is being returned
  return data as Integration[]
}

export function useIntegrations() {
  const { data, error, isLoading, mutate } = useSWR("integrations", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 0, // Disable automatic refreshing
  })

  return {
    data: data || [],
    error,
    isLoading,
    mutate,
  }
}

export function useIntegrationKPIs(integrations: Integration[]) {
  return useMemo(() => {
    if (!integrations) {
      return { categories: 0, connected: 0, needAttention: 0, totalDatapoints: 0 }
    }

    const connectedIntegrations = integrations.filter((i) => i.is_connected === true)
    const disconnectedIntegrations = integrations.filter((i) => i.is_connected === false)

    const categories = new Set(connectedIntegrations.map((i) => i.category)).size
    const connected = connectedIntegrations.length
    // "Need Attention" refers to disconnected tools
    const needAttention = disconnectedIntegrations.length
    // "Data Points" refers to the count of integrations that have linked controls (linked_controls is not null)
    const totalDatapoints = integrations.filter((i) => i.linked_controls !== null).length

    return { categories, connected, needAttention, totalDatapoints }
  }, [integrations])
}
