"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import type { Integration } from "@/types"
import { ScrollArea } from "./ui/scroll-area"

interface MarketplaceModalProps {
  isOpen: boolean
  onClose: () => void
  integrations: Integration[]
  onAddTool: (tool: Integration) => void
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

export default function MarketplaceModal({ isOpen, onClose, integrations, onAddTool }: MarketplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const marketplaceTools = useMemo(() => integrations.filter((tool) => !tool["is-connected"]), [integrations])
  const categories = useMemo(
    () => Array.from(new Set(marketplaceTools.map((tool) => tool.category))).sort(),
    [marketplaceTools],
  )

  const filteredTools = useMemo(() => {
    return marketplaceTools.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [marketplaceTools, searchTerm, selectedCategory])

  const getIconForCategory = (category: string) => categoryIcons[category] || categoryIcons["Default"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[80vh] flex flex-col z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Security Tools Marketplace
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Discover and connect security tools to enhance your compliance posture
          </p>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4 py-4 border-b">
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

        <ScrollArea className="flex-1">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-1">
              {filteredTools.map((tool) => {
                const IconComponent = getIconForCategory(tool.category)
                return (
                  <div
                    key={tool.id}
                    className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-500 flex flex-col"
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
                      {tool.description}
                    </p>
                    <Button
                      onClick={() => onAddTool(tool)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Tool
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
        </ScrollArea>

        <DialogFooter className="border-t pt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredTools.length} of {marketplaceTools.length} tools
          </span>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
