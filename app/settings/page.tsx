"use client"

import { useState } from "react"
import { Switch } from "@headlessui/react"
import ThemeToggle from "@/components/ThemeToggle"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [emailReports, setEmailReports] = useState(false)
  const [slackIntegration, setSlackIntegration] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Configure your dashboard preferences</p>
      </div>

      {/* General Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Theme</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Switch between light and dark mode</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Push Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications for compliance alerts</p>
            </div>
            <Switch
              checked={notifications}
              onChange={setNotifications}
              className={`${
                notifications ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  notifications ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email Reports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive weekly compliance reports via email</p>
            </div>
            <Switch
              checked={emailReports}
              onChange={setEmailReports}
              className={`${
                emailReports ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  emailReports ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Integrations</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Auto Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically sync data from connected integrations
              </p>
            </div>
            <Switch
              checked={autoSync}
              onChange={setAutoSync}
              className={`${
                autoSync ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  autoSync ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Slack Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Send compliance alerts to Slack channels</p>
            </div>
            <Switch
              checked={slackIntegration}
              onChange={setSlackIntegration}
              className={`${
                slackIntegration ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  slackIntegration ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download your compliance data as CSV</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Export
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Data Retention</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configure how long to keep historical data</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
