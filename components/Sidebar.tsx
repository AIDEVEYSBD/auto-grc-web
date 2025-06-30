"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  HomeIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  PuzzlePieceIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline"

const navigation = [
  { name: "Overview", href: "/", icon: HomeIcon },
  { name: "Frameworks", href: "/frameworks", icon: DocumentTextIcon },
  { name: "Applications", href: "/applications", icon: ComputerDesktopIcon },
  { name: "Integrations", href: "/integrations", icon: PuzzlePieceIcon },
  { name: "Capabilities", href: "/capabilities", icon: ChartBarIcon },
  { name: "Settings", href: "/settings", icon: CogIcon },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()

  // Auto-hide functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const sidebarWidth = collapsed ? 64 : 256
      if (e.clientX <= 20 && collapsed) {
        setIsHovered(true)
      } else if (e.clientX > sidebarWidth + 20) {
        setIsHovered(false)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => document.removeEventListener("mousemove", handleMouseMove)
  }, [collapsed])

  const shouldExpand = !collapsed || isHovered

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 glass-sidebar transition-all duration-300 ease-in-out
        ${shouldExpand ? "w-64" : "w-16"}
        lg:relative lg:translate-x-0
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full flex-col">
        {/* Header with Logo and Collapse Button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/20 dark:border-slate-700/30">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/AutoGRC.png" alt="AutoGRC" width={32} height={32} className="flex-shrink-0" />
            {shouldExpand && <span className="text-xl font-bold text-gray-900 dark:text-white truncate">AutoGRC</span>}
          </div>

          {/* Collapse Button - moved to top */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/50 transition-colors flex-shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-slate-700/50"
                  }
                `}
                title={!shouldExpand ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {shouldExpand && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
