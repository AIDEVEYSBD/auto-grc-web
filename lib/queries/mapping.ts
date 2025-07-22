import { supabase } from "@/lib/supabase"
import type { FrameworkMapping } from "@/types"

export async function saveFrameworkMappings(
  editedMappings: FrameworkMapping[],
  existingMappings: FrameworkMapping[]
): Promise<{ success: boolean }> {
  const newMappings = editedMappings.filter(
    (em) => !existingMappings.some(
      (ex) => ex.source_control_id === em.source_control_id &&
              ex.target_control_id === em.target_control_id
    )
  )

  const updatedMappings = editedMappings.filter(
    (em) => existingMappings.some(
      (ex) => ex.source_control_id === em.source_control_id &&
              ex.target_control_id === em.target_control_id &&
              ex.id === em.id &&
              (
                em.mapping_score !== ex.mapping_score ||
                em.status !== ex.status ||
                em.explanation !== ex.explanation
              )
    )
  )

  const deletedMappings = existingMappings.filter(
    (ex) => !editedMappings.some(
      (em) => em.source_control_id === ex.source_control_id &&
              em.target_control_id === ex.target_control_id
    )
  )

  // Insert new
  if (newMappings.length > 0) {
    const insertData = newMappings.map((m) => ({
        id: crypto.randomUUID(),
  source_control_id: m.source_control_id,
  target_control_id: m.target_control_id,
  mapping_score: m.mapping_score,
  status: m.status,
  explanation: m.explanation,
    }))
    const { error } = await supabase.from("framework_mappings").insert(insertData)
    if (error) throw error
  }

  // Update existing
  for (const mapping of updatedMappings) {
    const { error } = await supabase
      .from("framework_mappings")
      .update({
        mapping_score: mapping.mapping_score,
        status: mapping.status,
        explanation: mapping.explanation,
      })
      .eq("id", mapping.id)

    if (error) throw error
  }

  // Delete removed
  if (deletedMappings.length > 0) {
    const idsToDelete = deletedMappings.map((m) => m.id)
    const { error } = await supabase
      .from("framework_mappings")
      .delete()
      .in("id", idsToDelete)

    if (error) throw error
  }

  return { success: true }
}
