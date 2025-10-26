import type React from "react"
import "./globals.css"
import { AuthProvider } from "../context/AuthContext"
import { validateEnv } from "../lib/env"

// Validate environment variables
validateEnv()

export const metadata = {
  title: "Hologuard Nusantara",
  description: "Hologuard Nusantara",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
