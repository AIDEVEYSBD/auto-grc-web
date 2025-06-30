import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface DonutChartProps {
  data: {
    name: string
    value: number
    total: number
  }
  size?: number
  className?: string
  showLabel?: boolean
}

export default function DonutChart({ data, size = 80, className = "", showLabel = true }: DonutChartProps) {
  const percentage = data.total > 0 ? (data.value / data.total) * 100 : 0

  const getColor = (percent: number) => {
    if (percent >= 80) return "#059669" // emerald-600
    if (percent >= 40) return "#d97706" // amber-600
    return "#dc2626" // red-600
  }

  // Always show the full circle, even when empty
  const chartData = [
    { value: data.value || 0.1, fill: getColor(percentage) }, // Show tiny slice when 0
    { value: Math.max(data.total - (data.value || 0), 0.1), fill: "#e5e7eb" }, // gray-200
  ]

  // For completely empty charts, show full gray circle
  const emptyChartData = [{ value: 100, fill: "#e5e7eb" }]

  const displayData = data.total === 0 || (data.value === 0 && data.total > 0) ? emptyChartData : chartData

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.48}
              startAngle={90}
              endAngle={450}
              dataKey="value"
              stroke="none"
            >
              {displayData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{Math.round(percentage)}%</span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center mt-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{data.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data.value}/{data.total} controls
          </p>
        </div>
      )}
    </div>
  )
}
