"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../context/AuthContext"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const validateEmail = (email: string) => {
    return email.endsWith("@tni.mil.id")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate email domain when login button is clicked
    if (!validateEmail(email)) {
      setError("You need to use an email with @tni.mil.id domain. Please contact administrator for access.")
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (err) {
      setError("Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#15803D] via-[#166534] to-[#16A34A] p-12 flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-6">Hologuard Nusantara</h1>
          <p className="text-white/80 text-xl mb-8">
            Military-grade digital twin platform for advanced territorial monitoring and security
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-white font-bold mb-2">Real-time Monitoring</h3>
            <p className="text-white/70">Advanced sensor integration for comprehensive situational awareness</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-white font-bold mb-2">Tactical Analysis</h3>
            <p className="text-white/70">AI-powered threat detection and response recommendation</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-white font-bold mb-2">Secure Communications</h3>
            <p className="text-white/70">End-to-end encrypted data transmission and storage</p>
          </div>
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
            <h3 className="text-white font-bold mb-2">Digital Twin</h3>
            <p className="text-white/70">
              Synchronized virtual replica of physical assets for monitoring, analysis, and optimization
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-white/60 text-sm">© 2025 Hologuard Nusantara. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Secure Access Portal</h2>
            <p className="text-gray-400">Enter your credentials to access Hologuard Nusantara</p>
          </div>

          {error && (
            <div
              className="bg-red-900/50 border border-red-800 text-red-100 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent"
                placeholder="Enter your tni.mil.id email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:border-transparent"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#16A34A] focus:ring-[#16A34A] border-gray-700 rounded bg-gray-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-[#16A34A] hover:text-[#15803D]">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#16A34A] hover:bg-[#15803D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166534] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Authenticating..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Authorized personnel only. Unauthorized access is prohibited and may result in legal action.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
