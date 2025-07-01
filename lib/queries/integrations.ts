"use client"

import useSWR from "swr"
import { supabase } from "@/lib/supabase"
import { useMemo } from "react"
import type { Integration } from "@/types"

// Fetcher function for SWR - fetches all integrations from the DB
const fetcher = async (key: string) => {
  const { data, error } = await supabase.from("integrations").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Supabase fetch error:", error)
    throw error
  }
  return data as Integration[]
}

export function useIntegrations() {
  const { data, error, isLoading, mutate } = useSWR("integrations", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
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
    if (!integrations || integrations.length === 0) {
      return { categories: 0, connected: 0, needAttention: 0, totalDatapoints: 0 }
    }

    const connectedIntegrations = integrations.filter((i) => i["is-connected"] === true)
    const disconnectedIntegrations = integrations.filter((i) => i["is-connected"] === false)

    const categories = new Set(connectedIntegrations.map((i) => i.category)).size
    const connected = connectedIntegrations.length
    const needAttention = disconnectedIntegrations.length
    const totalDatapoints = integrations.filter((i) => i.linked_controls !== null).length

    return { categories, connected, needAttention, totalDatapoints }
  }, [integrations])
}
