interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
}

export default function ProgressBar({ value, max = 100, className = "", showLabel = false }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const getColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500"
    if (percent >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="progress-bar flex-1">
        <div className={`progress-fill ${getColor(percentage)}`} style={{ width: `${percentage}%` }} />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}
