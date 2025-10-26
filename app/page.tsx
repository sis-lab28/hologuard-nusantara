"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "../components/Navbar"
import InfoPanel from "../components/InfoPanel"
import { useAuth } from "../context/AuthContext"
import dynamic from "next/dynamic"
import { MapProvider } from "../context/MapContext"

// Import the MapWrapper component dynamically with no SSR
// This ensures the map only renders on the client side
const MapWrapper = dynamic(() => import("./map-wrapper"), { ssr: false })

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Wrap both Map and InfoPanel with MapProvider */}
      <MapProvider>
        {/* Map */}
        <MapWrapper />

        {/* Info Panel */}
        <InfoPanel />
      </MapProvider>
    </div>
  )
}
