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
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
      case "purple":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
      case "green":
        return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
      case "red":
        return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
      case "yellow":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(color)}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
