"use client"
import { useState, useRef, useEffect } from "react"
import { PenToolIcon as Tool, Wrench, Map, Shield, Database, Settings, User, LogOut } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const [dropdown, setDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()

  const toggleDropdown = (menu: string) => {
    setDropdown(dropdown === menu ? null : menu)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <nav className="bg-gray-900 border-b border-green-600 text-white px-6 py-3 flex justify-between items-center relative z-30">
      {/* Left: Empty space or other elements if needed */}
      <div className="flex items-center">
        {/* Removed Hologuard Nusantara text */}
        <Shield className="h-6 w-6 text-green-500 mr-2" />
      </div>

      {/* Center: Menu */}
      <div className="flex gap-8">
        {/* Tools */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => toggleDropdown("tools")} className="flex items-center gap-2 hover:text-green-500">
            <Tool className="h-5 w-5" />
            <span>Tools</span>
          </button>
          {dropdown === "tools" && (
            <div className="absolute mt-2 bg-gray-800 text-white shadow-lg rounded-lg w-64 border border-green-600">
              <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700">
                <Map className="h-4 w-4 text-green-500" />
                <span>Territory Mapping</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Security Analysis</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700">
                <Database className="h-4 w-4 text-green-500" />
                <span>Data Management</span>
              </a>
            </div>
          )}
        </div>

        {/* Utilities */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => toggleDropdown("utilities")} className="flex items-center gap-2 hover:text-green-500">
            <Wrench className="h-5 w-5" />
            <span>Utilities</span>
          </button>
          {dropdown === "utilities" && (
            <div className="absolute mt-2 bg-gray-800 text-white shadow-lg rounded-lg w-56 border border-green-600">
              <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700">
                <Settings className="h-4 w-4 text-green-500" />
                <span>System Settings</span>
              </a>
              <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700">
                <User className="h-4 w-4 text-green-500" />
                <span>User Management</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Right: Profile with Email */}
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => toggleDropdown("profile")} className="flex items-center gap-2 hover:text-green-500">
          <User className="h-5 w-5" />
          <span>{user?.email || "Profile"}</span>
        </button>
        {dropdown === "profile" && (
          <div className="absolute right-0 mt-2 bg-gray-800 text-white shadow-lg rounded-lg w-56 border border-green-600">
            <div className="px-4 py-2 border-b border-gray-700">
              <p className="text-sm text-gray-400">Signed in as</p>
              <p className="font-medium truncate">{user?.email}</p>
            </div>
            <a href="#" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700">
              <Settings className="h-4 w-4 text-green-500" />
              <span>Account Settings</span>
            </a>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-700 text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
