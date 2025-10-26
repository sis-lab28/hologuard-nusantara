"use client"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import type { Map } from "mapbox-gl"
import "../styles/global.css"
import { useMap } from "../context/MapContext"
import { ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"

import "mapbox-gl/dist/mapbox-gl.css"

// Define available map styles
export const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
}

export type MapStyle = keyof typeof MAP_STYLES

interface WeatherData {
  location?: {
    name?: string
    country?: string
  }
  current?: {
    temp_c?: number
    condition?: {
      text?: string
    }
    humidity?: number
    wind_kph?: number
  }
  error?: string
}

// Enhanced POI data with more detailed categories and icon information
const pointsOfInterest = [
  {
    name: "Shopping Mall",
    category: "shopping",
    coordinates: [106.9072, -6.3316],
    icon: "shopping-bag",
  },
  {
    name: "Local Restaurant",
    category: "restaurant",
    coordinates: [106.9082, -6.3306],
    icon: "utensils",
  },
  {
    name: "Mosque",
    category: "worship",
    coordinates: [106.9052, -6.3296],
    icon: "mosque",
  },
  {
    name: "Elementary School",
    category: "education",
    coordinates: [106.9062, -6.3326],
    icon: "school",
  },
  {
    name: "Bank BRI",
    category: "bank",
    coordinates: [106.9042, -6.3316],
    icon: "bank",
  },
  {
    name: "City Park",
    category: "park",
    coordinates: [106.9082, -6.3286],
    icon: "tree",
  },
  {
    name: "Gas Station",
    category: "gas",
    coordinates: [106.9092, -6.3336],
    icon: "gas-pump",
  },
  {
    name: "Basketball Court",
    category: "sport",
    coordinates: [106.9032, -6.3296],
    icon: "basketball",
  },
  {
    name: "Government Office",
    category: "landmark",
    coordinates: [106.9062, -6.3306],
    icon: "building",
  },
  {
    name: "Military Base",
    category: "military",
    coordinates: [106.9052, -6.3326],
    icon: "shield",
  },
  {
    name: "Hospital",
    category: "health",
    coordinates: [106.9072, -6.3296],
    icon: "hospital",
  },
  {
    name: "Police Station",
    category: "security",
    coordinates: [106.9042, -6.3336],
    icon: "shield-alt",
  },
  {
    name: "Apartment Complex",
    category: "residential",
    coordinates: [106.9082, -6.3326],
    icon: "building",
  },
  {
    name: "Train Station",
    category: "transportation",
    coordinates: [106.9092, -6.3306],
    icon: "train",
  },
  {
    name: "University",
    category: "education",
    coordinates: [106.9032, -6.3316],
    icon: "university",
  },
]

// Building data with specific building types
const buildings = [
  {
    name: "Office Tower A",
    category: "office",
    coordinates: [106.9067, -6.3311],
    icon: "building",
    height: 120,
  },
  {
    name: "Residential Block B",
    category: "residential",
    coordinates: [106.9057, -6.3301],
    icon: "home",
    height: 80,
  },
  {
    name: "Government Complex",
    category: "government",
    coordinates: [106.9077, -6.3321],
    icon: "landmark",
    height: 60,
  },
  {
    name: "Shopping Center",
    category: "commercial",
    coordinates: [106.9047, -6.3291],
    icon: "store",
    height: 45,
  },
  {
    name: "Hotel Grand",
    category: "hotel",
    coordinates: [106.9087, -6.3331],
    icon: "hotel",
    height: 100,
  },
]

interface Map3DProps {
  mapboxToken: string
}

const Map3D: React.FC<Map3DProps> = ({ mapboxToken }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const tokenTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { setMap, currentMapStyle } = useMap()
  const router = useRouter()
  const layersAddedRef = useRef<boolean>(false)

  // Updated center point to the provided coordinates
  const monument: [number, number] = [106.906295, -6.3306967]
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true)
  const [isTokenValid, setIsTokenValid] = useState<boolean>(false)
  const [isMapReady, setIsMapReady] = useState<boolean>(false)
  const [showDetails, setShowDetails] = useState<boolean>(false)
  const [lastSearchedCoords, setLastSearchedCoords] = useState<[number, number] | null>(null)

  const fetchWeatherData = async (lat: number, lon: number) => {
    setLastSearchedCoords([lon, lat])
    setIsLoading(true)
    setApiError(null)

    try {
      console.log(`Fetching weather data for coordinates: ${lat}, ${lon}`)

      // Add a timestamp to prevent caching issues
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&_t=${timestamp}`)

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Check if there's an error but we still got fallback data
      if (data.error) {
        console.warn("Weather API warning:", data.error)
        setApiError(data.error)
      }

      // Ensure we have a properly structured object even if some properties are missing
      const safeData: WeatherData = {
        location: {
          name: data?.location?.name || "Unknown Location",
          country: data?.location?.country || "Unknown",
        },
        current: {
          temp_c: data?.current?.temp_c || 25,
          condition: {
            text: data?.current?.condition?.text || "Data Unavailable",
          },
          humidity: data?.current?.humidity || 50,
          wind_kph: data?.current?.wind_kph || 10,
        },
        error: data?.error,
      }

      setWeatherData(safeData)
      setIsDrawerOpen(true)

      // Pre-fetch territory data and store it in localStorage
      if (data?.location?.name) {
        const locationName = data.location.name
        // Create a cache key for this location
        const cacheKey = `territory-data-${locationName.toLowerCase().trim()}`

        // Check if we already have this data in localStorage
        const cachedData = localStorage.getItem(cacheKey)
        if (!cachedData) {
          console.log(`Pre-fetching territory data for ${locationName}`)
          try {
            const territoryResponse = await fetch("/api/territory-data", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ location: locationName }),
            })

            if (territoryResponse.ok) {
              const territoryData = await territoryResponse.json()
              // Store in localStorage with the location as the key
              localStorage.setItem("territoryData", JSON.stringify(territoryData))
              localStorage.setItem("territoryLocation", locationName)
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  data: territoryData,
                  timestamp: Date.now(),
                }),
              )
              console.log(`Territory data for ${locationName} cached successfully`)
            }
          } catch (error) {
            console.error("Error pre-fetching territory data:", error)
          }
        } else {
          console.log(`Using cached territory data for ${locationName}`)
        }
      }
    } catch (error) {
      console.error("Error fetching weather data:", error)
      setApiError(error instanceof Error ? error.message : "Failed to fetch weather data")

      // Set fallback weather data with a complete structure
      setWeatherData({
        location: {
          name: "Unknown Location",
          country: "Unknown",
        },
        current: {
          temp_c: 25,
          condition: {
            text: "Data Unavailable",
          },
          humidity: 50,
          wind_kph: 10,
        },
        error: error instanceof Error ? error.message : "Failed to fetch weather data",
      })
      setIsDrawerOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get color based on category
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      restaurant: "#FF9B54",
      shopping: "#FF54A7",
      education: "#54C7FF",
      worship: "#C254FF",
      bank: "#54FF9B",
      park: "#A7FF54",
      gas: "#FF5454",
      sport: "#54FFC7",
      landmark: "#5454FF",
      military: "#8B0000",
      health: "#FF0000",
      security: "#0000FF",
      residential: "#FFA500",
      transportation: "#00FFFF",
      office: "#808080",
      government: "#800080",
      commercial: "#008000",
      hotel: "#800000",
      default: "#FFFFFF",
    }
    return colors[category] || colors.default
  }

  // Function to create SVG icon for a category
  const createSvgIcon = (iconName: string, color: string): HTMLElement => {
    const svgIcons: Record<string, string> = {
      "shopping-bag": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`,
      utensils: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M11 3H9v2h2V3zm0 4H9v2h2V7zm0 4H9v2h2v-2zm0 4H9v2h2v-2zm10-2h-8v2h8v-2zm0 4h-8v2h8v-2zM7 3H5v2h2V3zm0 4H5v2h2V7zm0 4H5v2h2v-2zm0 4H5v2h2v-2z"></path></svg>`,
      mosque: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 2L2 7v1h20V7L12 2zm-1 4a1 1 0 112 0 1 1 0 01-2 0zm9 14h-3v-6H7v6H4v-9H2v11h20V11h-2v9z"></path></svg>`,
      school: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"></path></svg>`,
      bank: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 2L2 8h20L12 2zm-9 8h2v10H3V10zm4 0h2v10H7V10zm4 0h2v10h-2V10zm4 0h2v10h-2V10zm4 0h2v10h-2V10zM2 22h20v-2H2v2z"></path></svg>`,
      tree: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 2.5L8 10h3v3H8l4 7.5 4-7.5h-3v-3h3L12 2.5z"></path></svg>`,
      "gas-pump": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33a2.5 2.5 0 002.5 2.5c.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5a2.5 2.5 0 005 0V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z"></path></svg>`,
      basketball: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><circle cx="12" cy="12" r="10" stroke="black" strokeWidth="1" fill="${color}" /></svg>`,
      building: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M19 2H9c-1.1 0-2 .9-2 2v5.5l-3.5 3.5 1.4 1.4L7 12.3V22h15v-2h-3V2zM12 4h5v16h-5V4z"></path></svg>`,
      shield: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>`,
      hospital: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path></svg>`,
      "shield-alt": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"></path></svg>`,
      home: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>`,
      train: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z"></path></svg>`,
      university: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 3L1 9l11 6 11-6-11-6zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"></path></svg>`,
      landmark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M12 1v3h3v2h-3v3h3v2h-3v3h3v2h-3v3h3v2h-3v3h8V1H12zM7 8H4c-1.1 0-2 .9-2 2v12h5V8z"></path></svg>`,
      store: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"></path></svg>`,
      hotel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="24" height="24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"></path></svg>`,
    }

    const div = document.createElement("div")
    div.className = "marker-icon"
    div.style.width = "32px"
    div.style.height = "32px"
    div.innerHTML = svgIcons[iconName] || svgIcons["building"]

    return div
  }

  // Function to add markers safely
  const addMarkersToMap = (map: Map) => {
    try {
      console.log("Adding markers to map")

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Add sensor marker
      try {
        const sensorMarker = document.createElement("div")
        sensorMarker.style.backgroundImage = "url('/motion-sensor.png')"
        sensorMarker.className = "blinking-marker"
        sensorMarker.style.width = "30px"
        sensorMarker.style.height = "30px"
        sensorMarker.style.backgroundSize = "cover"
        sensorMarker.style.borderRadius = "50%"

        const marker = new mapboxgl.Marker(sensorMarker).setLngLat(monument).addTo(map)

        marker.getElement().addEventListener("click", () => {
          fetchWeatherData(monument[1], monument[0])
        })
      } catch (error) {
        console.error("Error adding sensor marker:", error)
      }

      // Add POI markers with icons
      pointsOfInterest.forEach((poi) => {
        try {
          const color = getCategoryColor(poi.category)
          const el = createSvgIcon(poi.icon, color)

          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="popup-content">
              <h3 class="popup-title">${poi.name}</h3>
              <p class="popup-category">${poi.category}</p>
            </div>
          `)

          // Add marker to map
          const poiMarker = new mapboxgl.Marker(el).setLngLat(poi.coordinates).setPopup(popup).addTo(map)
          markersRef.current.push(poiMarker)

          // Add label
          const label = document.createElement("div")
          label.className = "poi-label"
          label.textContent = poi.name
          label.style.color = color
          label.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
          label.style.padding = "2px 5px"
          label.style.borderRadius = "3px"
          label.style.fontSize = "10px"
          label.style.whiteSpace = "nowrap"

          new mapboxgl.Marker(label, { anchor: "bottom" }).setLngLat(poi.coordinates).addTo(map)
        } catch (error) {
          console.error(`Error adding POI marker for ${poi.name}:`, error)
        }
      })

      // Add building markers with icons
      buildings.forEach((building) => {
        try {
          const color = getCategoryColor(building.category)
          const el = createSvgIcon(building.icon, color)

          // Make building icons slightly larger
          el.style.width = "36px"
          el.style.height = "36px"

          // Create popup with more detailed information
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="popup-content">
              <h3 class="popup-title">${building.name}</h3>
              <p class="popup-category">Type: ${building.category}</p>
              <p class="popup-height">Height: ${building.height}m</p>
            </div>
          `)

          // Add marker to map
          const buildingMarker = new mapboxgl.Marker(el).setLngLat(building.coordinates).setPopup(popup).addTo(map)
          markersRef.current.push(buildingMarker)

          // Add label
          const label = document.createElement("div")
          label.className = "poi-label building-label"
          label.textContent = building.name
          label.style.color = color
          label.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
          label.style.padding = "2px 5px"
          label.style.borderRadius = "3px"
          label.style.fontSize = "10px"
          label.style.whiteSpace = "nowrap"
          label.style.fontWeight = "bold"

          new mapboxgl.Marker(label, { anchor: "bottom" }).setLngLat(building.coordinates).addTo(map)
        } catch (error) {
          console.error(`Error adding building marker for ${building.name}:`, error)
        }
      })

      console.log("All markers added successfully")
    } catch (error) {
      console.error("Error adding markers to map:", error)
    }
  }

  // Function to add map layers
  const addMapLayers = (map: Map) => {
    try {
      // Check if the map style is loaded
      if (!map.isStyleLoaded()) {
        console.log("Map style is not loaded yet, waiting...")
        // Wait for the style to load before adding layers
        setTimeout(() => addMapLayers(map), 200)
        return
      }

      // Check if layers are already added
      if (layersAddedRef.current) {
        console.log("Layers already added, skipping")
        return
      }

      console.log("Adding map layers")

      // Add 3D buildings layer
      if (!map.getLayer("3d-buildings")) {
        // Check if the source exists
        if (map.getSource("composite")) {
          try {
            map.addLayer({
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": "#486581", // Dark blue-gray for buildings
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
                "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
                "fill-extrusion-opacity": 0.7,
              },
            })
            console.log("Added 3D buildings layer")
          } catch (error) {
            console.error("Error adding 3D buildings layer:", error)
          }
        } else {
          console.warn("Composite source not available for 3D buildings")
        }
      }

      // Add roads layer
      if (!map.getLayer("road-layer")) {
        // Check if the source exists
        if (map.getSource("composite")) {
          try {
            map.addLayer({
              id: "road-layer",
              type: "line",
              source: "composite",
              "source-layer": "road",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#16A34A", // Green for roads
                "line-width": ["interpolate", ["linear"], ["zoom"], 14, 1, 18, 4],
                "line-opacity": 0.8,
              },
            })
            console.log("Added road layer")
          } catch (error) {
            console.error("Error adding road layer:", error)
          }
        } else {
          console.warn("Composite source not available for roads")
        }
      }

      // Mark layers as added
      layersAddedRef.current = true
    } catch (error) {
      console.error("Error adding map layers:", error)
      // Reset the flag to try again later
      layersAddedRef.current = false
    }
  }

  useEffect(() => {
    console.log("Map3D component mounted")
    console.log("Mapbox token received:", mapboxToken ? "Token exists" : "No token")

    // Clear any existing timeout
    if (tokenTimeoutRef.current) {
      clearTimeout(tokenTimeoutRef.current)
    }

    // Function to initialize the map
    const initializeMap = () => {
      setIsMapLoading(true)
      setIsMapReady(false)
      layersAddedRef.current = false

      // Check if we have a token
      if (!mapboxToken) {
        console.error("No Mapbox token provided")
        setApiError("Mapbox token is missing. Please check your environment variables.")
        setIsMapLoading(false)
        return
      }

      // Try to use the token from props
      try {
        console.log("Setting Mapbox token")
        mapboxgl.accessToken = mapboxToken
        setIsTokenValid(true)

        console.log("Initializing map with token")
        if (mapContainerRef.current) {
          // Clean up any existing map
          if (mapRef.current) {
            mapRef.current.remove()
          }

          // Create the map with error handling
          try {
            mapRef.current = new mapboxgl.Map({
              container: mapContainerRef.current,
              style: MAP_STYLES[currentMapStyle],
              center: monument,
              zoom: 16,
              pitch: 45,
              bearing: -17.6,
              antialias: true,
              transformRequest: (url, resourceType) => {
                // Add error handling for transformRequest
                if (resourceType === "Style" && !url.includes(mapboxToken)) {
                  console.log(`Adding token to style URL: ${url}`)
                }
                return { url }
              },
            })

            const map = mapRef.current

            // Set the map in context
            setMap(map)

            // Add scale control to the bottom-right corner
            const scaleControl = new mapboxgl.ScaleControl({
              maxWidth: 100,
              unit: "metric",
            })
            map.addControl(scaleControl, "bottom-right")

            // Handle map load
            map.on("load", () => {
              console.log("Map loaded")
              setIsMapLoading(false)
              setIsMapReady(true)

              // Add title overlay
              try {
                const existingTitle = document.querySelector(".map-title")
                if (existingTitle) {
                  existingTitle.remove()
                }

                const title = document.createElement("div")
                title.className = "map-title"
                title.innerHTML = `
                  <div class="title-container">
                    <div class="title-decoration left"></div>
                    <h1>HOLOGUARD NUSANTARA</h1>
                    <div class="title-decoration right"></div>
                  </div>
                `
                document.body.appendChild(title)
              } catch (error) {
                console.error("Error adding title overlay:", error)
              }

              // Add map layers with a delay to ensure style is fully loaded
              setTimeout(() => {
                addMapLayers(map)
              }, 500)

              // Add markers after a short delay to ensure the map is fully rendered
              setTimeout(() => {
                addMarkersToMap(map)

                // Fetch initial weather data for the monument location
                fetchWeatherData(monument[1], monument[0])
              }, 1000)
            })

            // Handle style load
            map.on("style.load", () => {
              console.log("Map style loaded")
              layersAddedRef.current = false

              // Re-add layers when style changes
              if (isMapReady) {
                setTimeout(() => {
                  addMapLayers(map)
                }, 500)

                // Re-add markers after style change
                setTimeout(() => {
                  addMarkersToMap(map)
                }, 1000)
              }
            })

            // Handle map load errors
            map.on("error", (e) => {
              console.error("Mapbox error:", e)
              const errorMessage = e.error ? e.error.message || "Unknown error" : "Unknown error"
              console.error("Detailed error:", errorMessage)
              setApiError(`Map error: ${errorMessage}`)
            })
          } catch (error) {
            console.error("Error creating map instance:", error)
            setApiError(`Error creating map: ${error instanceof Error ? error.message : String(error)}`)
            setIsMapLoading(false)
          }
        }
      } catch (error) {
        console.error("Error initializing map:", error)
        setApiError(`Error initializing map: ${error instanceof Error ? error.message : String(error)}`)
        setIsMapLoading(false)
      }
    }

    // If we have a token, initialize the map
    if (mapboxToken) {
      initializeMap()
    } else {
      // Set a timeout to check for token again
      tokenTimeoutRef.current = setTimeout(() => {
        if (!mapboxToken) {
          console.error("Mapbox token not available after timeout. Map initialization failed.")
          setApiError("Mapbox token not available. Please check your environment variables.")
          setIsMapLoading(false)
        }
      }, 3000)
    }

    return () => {
      // Clean up
      if (tokenTimeoutRef.current) {
        clearTimeout(tokenTimeoutRef.current)
      }

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      // Clean up title overlay
      const title = document.querySelector(".map-title")
      if (title) {
        title.remove()
      }
    }
  }, [mapboxToken, currentMapStyle, setMap]) // Only re-run if the token or style changes

  const handleSearch = async () => {
    if (!searchQuery) return

    setIsLoading(true)
    try {
      console.log(`Searching for location: ${searchQuery}`)

      // Use our server API route instead of directly calling the Mapbox API
      const response = await fetch(`/api/geocode?query=${encodeURIComponent(searchQuery)}`)

      if (!response.ok) {
        throw new Error(`Geocoding API responded with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.features || data.features.length === 0) {
        throw new Error("No locations found for your search query")
      }

      const [lng, lat] = data.features[0].center
      const placeName = data.features[0].place_name || searchQuery

      console.log(`Location found: ${placeName} at coordinates [${lng}, ${lat}]`)
      setLastSearchedCoords([lng, lat])

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          essential: true,
          zoom: 16,
        })

        // Show a temporary marker at the searched location
        const el = document.createElement("div")
        el.className = "search-marker"
        el.style.width = "20px"
        el.style.height = "20px"
        el.style.borderRadius = "50%"
        el.style.backgroundColor = "#16A34A"
        el.style.border = "2px solid white"
        el.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)"

        const searchMarker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current)

        // Remove the marker after 5 seconds
        setTimeout(() => {
          searchMarker.remove()
        }, 5000)

        fetchWeatherData(lat, lng)
      }
    } catch (error) {
      console.error("Error fetching location data:", error)
      setApiError(error instanceof Error ? error.message : "Failed to fetch location data")

      // Show error in the drawer
      setWeatherData({
        location: {
          name: "Search Error",
          country: "Unknown",
        },
        current: {
          temp_c: 0,
          condition: {
            text: "Location data unavailable",
          },
          humidity: 0,
          wind_kph: 0,
        },
        error: error instanceof Error ? error.message : "Failed to fetch location data",
      })
      setIsDrawerOpen(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  console.log("Map3D rendering, search box should be visible", { isMapLoading, isTokenValid })

  return (
    <div className="relative h-screen">
      {/* Map Loading Indicator */}
      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-30">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-white">Initializing Map...</p>
          </div>
        </div>
      )}

      {/* Token Error Message */}
      {!isTokenValid && !isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 z-30">
          <div className="bg-gray-800 p-6 rounded-lg border border-red-500 max-w-md text-center">
            <h2 className="text-xl font-bold text-red-500 mb-4">Map Initialization Failed</h2>
            <p className="text-white mb-4">
              {apiError || "Unable to initialize the map. The Mapbox access token may be invalid or missing."}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Please check your environment variables and ensure that the Mapbox token is properly set.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="absolute top-20 left-4 p-2 bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded shadow-md z-50 border-2 border-green-500">
        <input
          type="text"
          placeholder="Search target operation area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border border-green-600 rounded p-2 w-64 text-white bg-gray-900"
        />
        <button
          onClick={handleSearch}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={isLoading || !isTokenValid}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Floating Drawer - Adjusted width and added close button */}
      <div
        className={`absolute right-0 top-16 h-full w-72 bg-gray-800 bg-opacity-90 backdrop-blur-sm p-4 z-20 transform ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 text-white border-l border-green-600`}
      >
        <button
          onClick={() => setIsDrawerOpen(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 text-green-500">Territory Information</h2>
        {isLoading ? (
          <p>Loading territory information...</p>
        ) : weatherData ? (
          <div>
            {apiError && (
              <div className="mb-4 p-2 bg-red-900 bg-opacity-50 rounded text-red-100 text-sm">
                <p>{apiError}</p>
                <button
                  onClick={() => fetchWeatherData(monument[1], monument[0])}
                  className="mt-2 px-2 py-1 bg-red-700 text-white rounded text-xs"
                >
                  Retry
                </button>
              </div>
            )}
            <p>
              <strong>Location:</strong> {weatherData.location?.name || "Unknown"},{" "}
              {weatherData.location?.country || "Unknown"}
            </p>
            <p>
              <strong>Temperature:</strong> {weatherData.current?.temp_c || 0}°C
            </p>
            <p>
              <strong>Condition:</strong> {weatherData.current?.condition?.text || "Unknown"}
            </p>
            <p>
              <strong>Humidity:</strong> {weatherData.current?.humidity || 0}%
            </p>
            <p>
              <strong>Wind Speed:</strong> {weatherData.current?.wind_kph || 0} kph
            </p>

            {/* Tactical Information Section */}
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h3 className="text-md font-bold mb-3 text-green-500">Tactical Information</h3>
              <div className="space-y-2">
                <p>
                  <strong>Visibility:</strong> 8.5 km
                </p>
                <p>
                  <strong>Terrain Type:</strong> Urban
                </p>
                <p>
                  <strong>Population Density:</strong> High
                </p>
                <p>
                  <strong>Security Level:</strong> <span className="text-yellow-500">Medium</span>
                </p>
                <p>
                  <strong>Operational Status:</strong> <span className="text-green-500">Active</span>
                </p>
              </div>

              {/* See Details Button */}
              <button
                onClick={() => {
                  if (lastSearchedCoords) {
                    const locationName = weatherData?.location?.name || searchQuery || "Unknown Location"

                    // Create a cache key for this location
                    const cacheKey = `territory-data-${locationName.toLowerCase().trim()}`

                    // Check if we already have data for this location in localStorage
                    const cachedData = localStorage.getItem(cacheKey)
                    if (!cachedData) {
                      // If we don't have cached data, pre-fetch it now before navigation
                      console.log(`Pre-fetching territory data for ${locationName} before navigation`)
                      fetch("/api/territory-data", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ location: locationName }),
                      })
                        .then((response) => {
                          if (response.ok) {
                            return response.json()
                          }
                          throw new Error("Failed to pre-fetch territory data")
                        })
                        .then((data) => {
                          // Store in localStorage with the location as the key
                          localStorage.setItem(
                            cacheKey,
                            JSON.stringify({
                              data: data,
                              timestamp: Date.now(),
                            }),
                          )
                          console.log(`Territory data for ${locationName} cached successfully`)

                          // Now navigate to the territory mapping page
                          router.push(
                            `/territory-mapping?lat=${lastSearchedCoords[1]}&lng=${lastSearchedCoords[0]}&name=${encodeURIComponent(locationName)}`,
                          )
                        })
                        .catch((error) => {
                          console.error("Error pre-fetching territory data:", error)
                          // Navigate anyway, the territory page will handle the error
                          router.push(
                            `/territory-mapping?lat=${lastSearchedCoords[1]}&lng=${lastSearchedCoords[0]}&name=${encodeURIComponent(locationName)}`,
                          )
                        })
                    } else {
                      // If we already have cached data, just navigate
                      console.log(`Using cached territory data for ${locationName}`)
                      router.push(
                        `/territory-mapping?lat=${lastSearchedCoords[1]}&lng=${lastSearchedCoords[0]}&name=${encodeURIComponent(locationName)}`,
                      )
                    }
                  } else {
                    router.push(`/territory-mapping?lat=${monument[1]}&lng=${monument[0]}&name=Default%20Location`)
                  }
                }}
                className="mt-4 w-full flex items-center justify-between px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                <span>See Territory Mapping</span>
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
        ) : (
          <p>Click on a location to view territory information</p>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute top-0 left-0 w-full h-full z-10" />
    </div>
  )
}

export default Map3D
