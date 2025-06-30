import { LinkIcon } from "@heroicons/react/24/outline"

export default function FrameworkBaselinerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Framework Baseliner</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Initiate and track framework-to-framework mapping in your GRC system
        </p>
      </div>

      <div className="glass-card p-8">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <LinkIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-lg font-medium">Framework Baseliner</p>
          <p className="text-sm mt-1">This capability is under development</p>
        </div>
      </div>
    </div>
  )
}
