import useSWR from "swr"

export function useSupabaseQuery<T>(key: string, query: () => Promise<{ data: T[] | null; error: any }>) {
  return useSWR(key, async () => {
    const { data, error } = await query()
    if (error) throw error
    return data || []
  })
}

export function useSupabaseSingle<T>(key: string, query: () => Promise<{ data: T | null; error: any }>) {
  return useSWR(key, async () => {
    const { data, error } = await query()
    if (error) throw error
    return data
  })
}
