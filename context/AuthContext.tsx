"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type User = {
  email: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated on initial load
    const authStatus = localStorage.getItem("isAuthenticated")
    const userEmail = localStorage.getItem("userEmail")

    if (authStatus === "true" && userEmail) {
      setIsAuthenticated(true)
      setUser({ email: userEmail })
    }
  }, [])

  const login = async (email: string, password: string) => {
    // This is a mock login - replace with actual authentication
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real app, you would validate credentials and get a token
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userEmail", email)
    setUser({ email })
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userEmail")
    setUser(null)
    setIsAuthenticated(false)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
