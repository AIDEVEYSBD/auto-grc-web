"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, DocumentTextIcon } from "@heroicons/react/24/outline"
import FrameworkCard from "@/components/FrameworkCard"
import UploadFrameworkModal from "@/components/UploadFrameworkModal"
import FrameworkControlsModal from "@/components/FrameworkControlsModal"
import LoadingSkeleton from "@/components/LoadingSkeleton"
import { supabase } from "@/lib/supabase"
import type { Framework } from "@/types"

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isControlsModalOpen, setIsControlsModalOpen] = useState(false)
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null)

  useEffect(() => {
    fetchFrameworks()
  }, [])

  const fetchFrameworks = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("frameworks")
        .select(`
          *,
          controls(count)
        `)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Process the data to include controls count
      const processedFrameworks =
        data?.map((framework) => ({
          ...framework,
          controls_count: framework.controls?.[0]?.count || 0,
        })) || []

      setFrameworks(processedFrameworks)
    } catch (err: any) {
      console.error("Error fetching frameworks:", err)
      setError(err.message || "Failed to fetch frameworks")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFrameworkClick = (framework: Framework) => {
    setSelectedFramework(framework)
    setIsControlsModalOpen(true)
  }

  const handleUploadSuccess = () => {
    fetchFrameworks()
    setIsUploadModalOpen(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Frameworks</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your compliance frameworks and standards</p>
          </div>
          <LoadingSkeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Frameworks</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your compliance frameworks and standards</p>
          </div>
        </div>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={fetchFrameworks} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Frameworks</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your compliance frameworks and standards</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Upload Framework
        </Button>
      </div>

      {frameworks.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700">
          <CardContent className="p-12">
            <div className="text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No frameworks found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by uploading your first compliance framework
              </p>
              <Button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2">
                <PlusIcon className="h-4 w-4" />
                Upload Framework
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworks.map((framework) => (
            <FrameworkCard key={framework.id} framework={framework} onClick={handleFrameworkClick} />
          ))}
        </div>
      )}

      <UploadFrameworkModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <FrameworkControlsModal
        isOpen={isControlsModalOpen}
        onClose={() => setIsControlsModalOpen(false)}
        framework={selectedFramework}
      />
    </div>
  )
}
