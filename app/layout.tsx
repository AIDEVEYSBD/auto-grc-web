import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import Sidebar from "@/components/Sidebar"
import Topbar from "@/components/Topbar"
import ErrorBoundary from "@/components/ErrorBoundary"
import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AutoGRC - Cybersecurity Compliance Dashboard",
  description: "Comprehensive cybersecurity compliance management platform",
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ErrorBoundary>
            <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <Topbar />
                <main className="flex-1 overflow-auto p-4 sm:p-6 relative z-10">{children}</main>
              </div>
            </div>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
