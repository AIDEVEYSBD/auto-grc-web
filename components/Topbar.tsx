"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { CogIcon } from "@heroicons/react/24/outline"
import ThemeToggle from "./ThemeToggle"

export default function Topbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="glass-topbar h-16 flex items-center justify-between px-4 sm:px-6 relative z-30">
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
          Cybersecurity Compliance Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        <ThemeToggle />

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/20 dark:hover:bg-slate-700/50 transition-colors"
          >
            <Image src="/user.jpg" alt="User profile" width={32} height={32} className="rounded-full object-cover" />
            <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">Profile</span>
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white/95 dark:bg-slate-800/100 backdrop-blur-md border border-white/30 dark:border-slate-700/50 shadow-xl z-40">
              <div className="py-2">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">User Profile</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Manage your account</p>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-slate-700/70 transition-colors"
                >
                  <CogIcon className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
