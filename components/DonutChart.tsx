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

  const getBackgroundColor = (percent: number) => {
    if (percent >= 80) return "#d1fae5" // emerald-100
    if (percent >= 40) return "#fef3c7" // amber-100
    return "#fee2e2" // red-100
  }

  const chartData = [
    { value: data.value, fill: getColor(percentage) },
    { value: Math.max(data.total - data.value, 0), fill: "#f3f4f6" }, // gray-100
  ]

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.35}
              outerRadius={size * 0.48}
              startAngle={90}
              endAngle={450}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{Math.round(percentage)}%</span>
        </div>
      </div>

      {showLabel && (
        <div className="text-center mt-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">{data.name}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {data.value}/{data.total} controls
          </p>
        </div>
      )}
    </div>
  )
}
