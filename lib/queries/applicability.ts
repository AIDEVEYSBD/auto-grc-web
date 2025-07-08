import useSWR from "swr"
import { supabase } from "@/lib/supabase"
import type { ApplicabilityCategory } from "@/types"

export function useApplicabilityCategories() {
  return useSWR("applicability-categories", async () => {
    const { data, error } = await supabase
      .from("applicability_categories")
      .select("id, category_name")
      .order("category_name")

    if (error) {
      console.error("Error fetching applicability categories:", error)
      throw error
    }

    return data as ApplicabilityCategory[]
  })
}

export async function updateApplicationApplicability(applicationId: string, categoryId: string) {
  const { error } = await supabase.from("applications").update({ applicability: categoryId }).eq("id", applicationId)

  if (error) {
    console.error("Error updating application applicability:", error)
    throw error
  }
}
