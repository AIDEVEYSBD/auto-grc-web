import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import DataTable from "./DataTable"
import type { FrameworkMapping } from "@/types"

interface MappingTableProps {
  mappings: FrameworkMapping[]
  className?: string
}

export default function MappingTable({ mappings, className = "" }: MappingTableProps) {
  // Calculate overlap percentages for chart
  const overlapData = [
    { framework: "SOC 2", overlap: 85 },
    { framework: "ISO 27001", overlap: 78 },
    { framework: "NIST", overlap: 92 },
    { framework: "PCI DSS", overlap: 65 },
  ]

  const columns = [
    {
      key: "source_control_id",
      label: "Source Control",
      sortable: true,
    },
    {
      key: "target_control_id",
      label: "Target Control",
      sortable: true,
    },
    {
      key: "mapping_score",
      label: "Mapping Score",
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <span>{value}%</span>
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className={`h-2 rounded-full ${
                value >= 80 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${value}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === "active"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          {value}
        </span>
      ),
    },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Framework Overlap Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Framework Overlap Analysis</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overlapData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="framework" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="overlap" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mapping Details Table */}
      <DataTable data={mappings} columns={columns} className="glass-card" />
    </div>
  )
}
