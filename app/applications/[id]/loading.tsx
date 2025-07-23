import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Fallback skeleton for the Applications → Details page.
 * This component is rendered while the page (and its data) load.
 * By existing in this location, Next.js automatically uses it as
 * the Suspense boundary fallback for the entire `[id]` segment.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header / summary card */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>

      {/* Secondary cards grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
