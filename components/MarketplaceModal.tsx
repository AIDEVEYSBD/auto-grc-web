"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Plus,
  Shield,
  Eye,
  Lock,
  Zap,
  Database,
  Cloud,
  Network,
  Bug,
  FileText,
  AlertTriangle,
  Settings,
  Monitor,
  Key,
  Wifi,
  Server,
  Activity,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Integration } from "@/types"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  integrations: Integration[]
  onRefresh?: () => void
}

interface EndpointModalProps {
  isOpen: boolean
  onClose: () => void
  tool: Integration | null
  onSave: (endpoint: string) => void
  isProcessing: boolean
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  SIEM: Shield,
  EDR: Eye,
  "Endpoint Protection": Lock,
  "Vulnerability Management": Bug,
  "Identity Management": Key,
  "Network Security": Network,
  "Cloud Security": Cloud,
  "Data Protection": Database,
  Compliance: FileText,
  "Threat Intelligence": AlertTriangle,
  "Security Orchestration": Settings,
  Monitoring: Monitor,
  Firewall: Wifi,
  Infrastructure: Server,
  Analytics: Activity,
  Default: Zap,
}

function EndpointModal({ isOpen, onClose, tool, onSave, isProcessing }: EndpointModalProps) {
  const [endpoint, setEndpoint] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (endpoint.trim()) {
      onSave(endpoint.trim())
      setEndpoint("")
    }
  }

  const handleClose = () => {
    setEndpoint("")
    onClose()
  }

  if (!tool) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {tool.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Endpoint URL
            </label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://api.example.com/webhook"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              required
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the API endpoint URL for this tool integration
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" disabled={!endpoint.trim() || isProcessing}>
              {isProcessing ? "Connecting..." : "Connect Tool"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function MarketplaceModal({ isOpen, onClose, integrations, onRefresh }: MarketplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Integration | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter to show only disconnected tools (marketplace tools)
  const marketplaceTools = integrations.filter((tool) => !tool["is-connected"])

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(marketplaceTools.map((tool) => tool.category)))
    return uniqueCategories.sort()
  }, [marketplaceTools])

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return marketplaceTools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [marketplaceTools, searchTerm, selectedCategory])

  const handleAddTool = (tool: Integration) => {
    setSelectedTool(tool)
    setIsEndpointModalOpen(true)
  }

  const handleSaveEndpoint = async (endpoint: string) => {
    if (!selectedTool) return

    setIsProcessing(true)

    try {
      console.log("Attempting to connect tool:", {
        id: selectedTool.id,
        name: selectedTool.name,
        endpoint: endpoint,
      })

      // Check if the tool exists in the database first
      const { data: existingTool, error: fetchError } = await supabase
        .from("integrations")
        .select("*")
        .eq("id", selectedTool.id)
        .single()

      if (fetchError) {
        console.error("Error fetching tool:", fetchError)
        throw new Error(`Tool not found in database: ${fetchError.message}`)
      }

      console.log("Found existing tool:", existingTool)

      // Update the tool
      const { data, error } = await supabase
        .from("integrations")
        .update({
          "is-connected": true,
          endpoint: endpoint,
          last_sync: new Date().toISOString(),
        })
        .eq("id", selectedTool.id)
        .select()

      if (error) {
        console.error("Supabase update error:", error)
        throw new Error(`Database update failed: ${error.message}`)
      }

      console.log("Successfully updated tool:", data)

      // Close modals and refresh data
      setIsEndpointModalOpen(false)
      setSelectedTool(null)

      if (onRefresh) {
        console.log("Refreshing data...")
        onRefresh()
      }

      // Show success feedback
      alert(`Successfully connected ${selectedTool.name}!`)
    } catch (error) {
      console.error(`Failed to connect tool ${selectedTool.name}:`, error)

      // More detailed error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`Failed to connect tool "${selectedTool.name}": ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseEndpointModal = () => {
    setIsEndpointModalOpen(false)
    setSelectedTool(null)
  }

  const getIconForCategory = (category: string) => {
    const IconComponent = categoryIcons[category] || categoryIcons["Default"]
    return IconComponent
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Security Tools Marketplace</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Discover and connect security tools to enhance your compliance posture
            </p>
          </DialogHeader>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tools Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredTools.map((tool) => {
                  const IconComponent = getIconForCategory(tool.category)
                  return (
                    <div
                      key={tool.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {tool.category}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {tool.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{tool.description}</p>
                      )}

                      <Button onClick={() => handleAddTool(tool)} className="w-full" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tool
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tools found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No marketplace tools available at the moment"}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {filteredTools.length} of {marketplaceTools.length} tools
            </span>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EndpointModal
        isOpen={isEndpointModalOpen}
        onClose={handleCloseEndpointModal}
        tool={selectedTool}
        onSave={handleSaveEndpoint}
        isProcessing={isProcessing}
      />
    </>
  )
}
