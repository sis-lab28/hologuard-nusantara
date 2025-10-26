"use client"

import { useEffect, useState } from "react"
import Map3D from "../components/Map3D"

export default function MapWrapper() {
  const [token, setToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMapboxToken() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/mapbox-token")

        if (!response.ok) {
          throw new Error(`Failed to fetch Mapbox token: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        if (!data.token) {
          throw new Error("No token received from server")
        }

        console.log("Mapbox token is available")
        setToken(data.token)
      } catch (err) {
        console.error("Error fetching Mapbox token:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch Mapbox token")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMapboxToken()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-6 bg-gray-800 rounded-lg border border-red-500 max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Map Initialization Failed</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading map resources...</p>
        </div>
      </div>
    )
  }

  return <Map3D mapboxToken={token} />
}
