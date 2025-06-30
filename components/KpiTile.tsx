import type { KPIData } from "@/types"

interface KpiTileProps {
  data: KPIData
  className?: string
}

export default function KpiTile({ data, className = "" }: KpiTileProps) {
  const { label, value, icon: Icon, color } = data

  const getColorClasses = (color?: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
      case "purple":
        return "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
      case "green":
        return "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
      case "red":
        return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
      case "yellow":
        return "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
      default:
        return "bg-gray-50 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4 ${getColorClasses(color)}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}
