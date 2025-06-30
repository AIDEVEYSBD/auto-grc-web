"use client"

import { useTheme } from "next-themes"
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg glass-card hover:bg-white/90 dark:hover:bg-slate-800/90 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  )
}
