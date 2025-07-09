"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, DocumentTextIcon } from "@heroicons/react/24/outline"
import type { Framework } from "@/types"

interface FrameworkCardProps {
  framework: Framework
  onClick?: (framework: Framework) => void
}

export default function FrameworkCard({ framework, onClick }: FrameworkCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(framework)
    }
  }

  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] glass-card"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {framework.name}
          </CardTitle>
          <Badge variant={framework.status === "active" ? "default" : "secondary"} className="ml-2 shrink-0">
            {framework.status || "active"}
          </Badge>
        </div>
        {framework.version && <p className="text-sm text-gray-600 dark:text-gray-400">Version {framework.version}</p>}
      </CardHeader>
      <CardContent className="pt-0">
        {framework.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{framework.description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <DocumentTextIcon className="h-4 w-4" />
            <span>{framework.controls_count || 0} controls</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{new Date(framework.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
