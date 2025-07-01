import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import DataTable from "@/components/DataTable"
import LoadingSkeleton from "@/components/LoadingSkeleton"

interface ControlDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: Record<string, any>[]
  loading: boolean
}

export default function ControlDetailModal({ isOpen, onClose, title, data, loading }: ControlDetailModalProps) {
  const columns =
    data.length > 0
      ? Object.keys(data[0]).map((key) => ({
          key,
          label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          sortable: true,
        }))
      : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Detailed records for the selected control.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <LoadingSkeleton className="h-64" />
          ) : data.length > 0 ? (
            <DataTable columns={columns} data={data} />
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No detailed records found.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
