"use client"

import { useState, useEffect } from "react"
import { X, Info, Layers, Map, Home, ChevronDown, ChevronUp, ZoomIn, ZoomOut, RotateCcw, Compass } from "lucide-react"
import { useMap } from "../context/MapContext"

export default function InfoPanel() {
  const [isOpen, setIsOpen] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [showLayers, setShowLayers] = useState(false)
  const [cachedData, setCachedData] = useState<any>(null)

  const {
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
  } = useMap()

  // Store territory data in localStorage when it's received
  useEffect(() => {
    // Check if we have cached data in localStorage
    const storedData = localStorage.getItem("territoryData")
    if (storedData) {
      try {
        setCachedData(JSON.parse(storedData))
      } catch (e) {
        console.error("Error parsing stored territory data:", e)
      }
    }
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 left-4 z-20 bg-gray-800 bg-opacity-90 p-2 rounded-full border border-green-600 text-green-500 hover:bg-gray-700"
        aria-label="Open info panel"
      >
        <Info size={20} />
      </button>
    )
  }

  return (
    <div className="absolute bottom-4 left-4 z-20 bg-gray-800 bg-opacity-90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-md text-white border border-green-600">
      <button
        onClick={() => setIsOpen(false)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        aria-label="Close info panel"
      >
        <X size={16} />
      </button>

      <h2 className="text-xl font-bold mb-3 text-green-500">Hologuard Nusantara</h2>

      {/* Map Controls Section */}
      <div className="mb-4">
        <button
          onClick={() => setShowControls(!showControls)}
          className="flex items-center justify-between w-full px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 mb-2"
        >
          <div className="flex items-center">
            <Map className="mr-2" size={16} />
            <span>Map Controls</span>
          </div>
          <span>{showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        </button>

        {showControls && (
          <div className="pl-2 border-l-2 border-green-600 mb-3">
            {/* Navigation Controls */}
            <div className="mb-2">
              <label className="block text-sm font-medium mb-2">Navigation</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={zoomIn}
                  className="px-3 py-2 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center justify-center"
                >
                  <ZoomIn className="mr-2" size={16} />
                  <span>Zoom In</span>
                </button>
                <button
                  onClick={zoomOut}
                  className="px-3 py-2 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center justify-center"
                >
                  <ZoomOut className="mr-2" size={16} />
                  <span>Zoom Out</span>
                </button>
                <button
                  onClick={() => rotate(30)}
                  className="px-3 py-2 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center justify-center"
                >
                  <RotateCcw className="mr-2" size={16} />
                  <span>Rotate</span>
                </button>
                <button
                  onClick={resetNorth}
                  className="px-3 py-2 text-sm rounded bg-gray-700 text-gray-200 hover:bg-gray-600 flex items-center justify-center"
                >
                  <Compass className="mr-2" size={16} />
                  <span>Reset North</span>
                </button>
              </div>
            </div>

            {/* Map Style Buttons */}
            <div className="mb-2">
              <label className="block text-sm font-medium mb-2">Map Style</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Dark", value: "dark" },
                  { name: "Satellite", value: "satellite" },
                  { name: "Outdoors", value: "outdoors" },
                  { name: "Light", value: "light" },
                  { name: "Streets", value: "streets" },
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => changeMapStyle(style.value as any)}
                    className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Layers Section */}
            <div className="mb-2">
              <button
                onClick={() => setShowLayers(!showLayers)}
                className="flex items-center justify-between w-full px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                <div className="flex items-center">
                  <Layers className="mr-2" size={16} />
                  <span>Layers</span>
                </div>
                <span>{showLayers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </button>

              {showLayers && (
                <div className="mt-2 pl-2 border-l-2 border-green-600">
                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm">3D Buildings</label>
                    <button
                      onClick={() => toggle3DBuildings()}
                      className={`w-10 h-5 rounded-full ${
                        show3DBuildings ? "bg-green-600" : "bg-gray-600"
                      } relative transition-colors`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                          show3DBuildings ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm">Roads</label>
                    <button
                      onClick={() => toggleRoads()}
                      className={`w-10 h-5 rounded-full ${
                        showRoads ? "bg-green-600" : "bg-gray-600"
                      } relative transition-colors`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                          showRoads ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <label className="text-sm">Points of Interest</label>
                    <button
                      onClick={() => togglePOIs()}
                      className={`w-10 h-5 rounded-full ${
                        showPOIs ? "bg-green-600" : "bg-gray-600"
                      } relative transition-colors`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transform transition-transform ${
                          showPOIs ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reset View Button */}
            <button
              onClick={resetView}
              className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
            >
              <Home className="mr-2" size={16} />
              <span>Reset View</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
