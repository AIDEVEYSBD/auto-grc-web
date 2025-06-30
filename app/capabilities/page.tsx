"use client"

import Link from "next/link"
import { PlayIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline"

export default function CapabilitiesPage() {
  const capabilities = [
    {
      id: "framework-baseliner",
      name: "Framework Baseliner",
      description:
        "Allows users to initiate and track framework-to-framework mapping in your GRC system. Streamline compliance by establishing baseline mappings between different regulatory frameworks and standards.",
      href: "/capabilities/framework-baseliner",
      icon: "🔗",
      color: "blue",
    },
    {
      id: "soc-mapper",
      name: "SOC Mapper",
      description:
        "Maps SOC2 Type2 report against selected framework. Automatically analyze your SOC2 compliance reports and map findings to your chosen compliance framework for comprehensive coverage analysis.",
      href: "/capabilities/soc-mapper",
      icon: "📊",
      color: "emerald",
    },
    {
      id: "controls-automation",
      name: "Controls Automation",
      description:
        "Automatically assesses certain controls of the Master Framework for various applications and stores their details. Reduce manual effort by automating control assessments across your application portfolio.",
      href: "/capabilities/controls-automation",
      icon: "⚡",
      color: "purple",
    },
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          text: "text-blue-600 dark:text-blue-400",
          button: "bg-blue-600 hover:bg-blue-700",
        }
      case "emerald":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-900/20",
          text: "text-emerald-600 dark:text-emerald-400",
          button: "bg-emerald-600 hover:bg-emerald-700",
        }
      case "purple":
        return {
          bg: "bg-purple-50 dark:bg-purple-900/20",
          text: "text-purple-600 dark:text-purple-400",
          button: "bg-purple-600 hover:bg-purple-700",
        }
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800/20",
          text: "text-gray-600 dark:text-gray-400",
          button: "bg-gray-600 hover:bg-gray-700",
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capabilities</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Launch and manage your security capabilities</p>
      </div>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {capabilities.map((capability) => {
          const colors = getColorClasses(capability.color)
          return (
            <div key={capability.id} className="glass-card p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                  <span className="text-2xl">{capability.icon}</span>
                </div>
                <Link
                  href={capability.href}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Open in new tab"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400" />
                </Link>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{capability.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{capability.description}</p>
              </div>

              <Link
                href={capability.href}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${colors.button} text-white text-sm font-medium rounded-lg transition-colors`}
              >
                <PlayIcon className="h-4 w-4" />
                Launch
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
