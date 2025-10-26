"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Map } from "mapbox-gl"
import { MAP_STYLES } from "../components/Map3D"

type MapContextType = {
  map: Map | null
  setMap: (map: Map) => void
  zoomIn: () => void
  zoomOut: () => void
  rotate: (degrees?: number) => void
  resetNorth: () => void
  resetView: () => void
  changeMapStyle: (style: keyof typeof MAP_STYLES) => void
  toggle3DBuildings: (visible?: boolean) => void
  toggleRoads: (visible?: boolean) => void
  togglePOIs: (visible?: boolean) => void
  show3DBuildings: boolean
  showRoads: boolean
  showPOIs: boolean
  currentMapStyle: keyof typeof MAP_STYLES
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map | null>(null)
  const [show3DBuildings, setShow3DBuildings] = useState(true)
  const [showRoads, setShowRoads] = useState(true)
  const [showPOIs, setShowPOIs] = useState(true)
  const [currentMapStyle, setCurrentMapStyle] = useState<keyof typeof MAP_STYLES>("dark")

  const zoomIn = () => {
    if (map) {
      map.zoomIn()
    }
  }

  const zoomOut = () => {
    if (map) {
      map.zoomOut()
    }
  }

  const rotate = (degrees = 30) => {
    if (map) {
      const currentBearing = map.getBearing()
      map.easeTo({ bearing: currentBearing + degrees })
    }
  }

  const resetNorth = () => {
    if (map) {
      map.easeTo({ bearing: 0 })
    }
  }

  const resetView = () => {
    if (map) {
      // Default center coordinates
      const defaultCenter: [number, number] = [106.906295, -6.3306967]
      map.easeTo({
        center: defaultCenter,
        zoom: 16,
        pitch: 45,
        bearing: -17.6,
        duration: 1500,
      })
    }
  }

  const changeMapStyle = (style: keyof typeof MAP_STYLES) => {
    if (map && MAP_STYLES[style]) {
      map.setStyle(MAP_STYLES[style])
      setCurrentMapStyle(style)
    }
  }

  const toggle3DBuildings = (visible?: boolean) => {
    if (map) {
      const newVisibility = visible !== undefined ? visible : !show3DBuildings
      const buildingLayer = map.getLayer("3d-buildings")

      if (buildingLayer) {
        map.setLayoutProperty("3d-buildings", "visibility", newVisibility ? "visible" : "none")
      }
      setShow3DBuildings(newVisibility)
    }
  }

  const toggleRoads = (visible?: boolean) => {
    if (map) {
      const newVisibility = visible !== undefined ? visible : !showRoads
      const roadLayer = map.getLayer("road-layer")

      if (roadLayer) {
        map.setLayoutProperty("road-layer", "visibility", newVisibility ? "visible" : "none")
      }
      setShowRoads(newVisibility)
    }
  }

  const togglePOIs = (visible?: boolean) => {
    if (map) {
      const newVisibility = visible !== undefined ? visible : !showPOIs

      // Get all markers and toggle their visibility
      const markers = document.querySelectorAll(".marker-icon")
      markers.forEach((marker) => {
        ;(marker as HTMLElement).style.display = newVisibility ? "block" : "none"
      })

      // Get all labels and toggle their visibility
      const labels = document.querySelectorAll(".poi-label, .building-label")
      labels.forEach((label) => {
        ;(label as HTMLElement).style.display = newVisibility ? "block" : "none"
      })

      setShowPOIs(newVisibility)
    }
  }

  return (
    <MapContext.Provider
      value={{
        map,
        setMap,
        zoomIn,
        zoomOut,
        rotate,
        resetNorth,
        resetView,
        changeMapStyle,
        toggle3DBuildings,
        toggleRoads,
        togglePOIs,
        show3DBuildings,
        showRoads,
        showPOIs,
        currentMapStyle,
      }}
    >
      {children}
    </MapContext.Provider>
  )
}

export function useMap() {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error("useMap must be used within a MapProvider")
  }
  return context
}
