'use client'

import { useState, useEffect, useRef } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Flight data interfaces based on the provided structure
interface PositionBuffer {
  recentPositionsList: Array<{
    deltaLat: number;
    deltaLon: number;
    deltaMs: number;
  }>;
}

interface Flight {
  flightid: number;
  lat: number;
  lon: number;
  track: number;
  alt: number;
  speed: number;
  icon: string;
  status: string;
  timestamp: number;
  onGround: boolean;
  callsign: string;
  source: string;
  positionBuffer: PositionBuffer;
  timestampMs: string;
}

interface FlightData {
  flightsList: Flight[];
}

const TerritoryMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Indonesia center coordinates
  const indonesiaCenter: [number, number] = [118, -2];

  // Function to create airplane icon SVG
  const createAirplaneIcon = (callsign: string, status: string) => {
    const el = document.createElement('div');
    el.className = 'flight-marker';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.cursor = 'pointer';
    
    // Color based on status
    const color = status === 'NORMAL' ? '#22c55e' : '#ef4444';
    
    el.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    `;
    
    return el;
  };

  // Function to add flight markers to map
  const addFlightMarkersToMap = (map: Map, flights: Flight[]) => {
    try {
      console.log("Adding flight markers to map");

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      flights.forEach((flight) => {
        try {
          const el = createAirplaneIcon(flight.callsign, flight.status);

          // Create popup with flight information
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="popup-content" style="min-width: 200px;">
              <h3 class="popup-title" style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
                ${flight.callsign || 'Unknown Flight'}
              </h3>
              <div style="font-size: 12px; color: #4b5563;">
                <p style="margin: 2px 0;"><strong>Flight ID:</strong> ${flight.flightid}</p>
                <p style="margin: 2px 0;"><strong>Aircraft:</strong> ${flight.icon}</p>
                <p style="margin: 2px 0;"><strong>Altitude:</strong> ${flight.alt.toLocaleString()} ft</p>
                <p style="margin: 2px 0;"><strong>Speed:</strong> ${flight.speed} kts</p>
                <p style="margin: 2px 0;"><strong>Track:</strong> ${flight.track}°</p>
                <p style="margin: 2px 0;"><strong>Status:</strong> ${flight.status}</p>
                <p style="margin: 2px 0;"><strong>Source:</strong> ${flight.source}</p>
                <p style="margin: 2px 0;"><strong>On Ground:</strong> ${flight.onGround ? 'Yes' : 'No'}</p>
                <p style="margin: 2px 0;"><strong>Coordinates:</strong> ${flight.lat.toFixed(4)}, ${flight.lon.toFixed(4)}</p>
              </div>
            </div>
          `);

          // Add marker to map
          const flightMarker = new mapboxgl.Marker(el)
            .setLngLat([flight.lon, flight.lat])
            .setPopup(popup)
            .addTo(map);
          
          markersRef.current.push(flightMarker);

          // Add label with callsign
          if (flight.callsign) {
            const label = document.createElement("div");
            label.className = "flight-label";
            label.textContent = flight.callsign;
            label.style.color = "#ffffff";
            label.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            label.style.padding = "2px 6px";
            label.style.borderRadius = "4px";
            label.style.fontSize = "10px";
            label.style.fontWeight = "bold";
            label.style.whiteSpace = "nowrap";
            label.style.pointerEvents = "none";

            const labelMarker = new mapboxgl.Marker(label, { anchor: "top" })
              .setLngLat([flight.lon, flight.lat])
              .addTo(map);
            
            markersRef.current.push(labelMarker);
          }
        } catch (error) {
          console.error(`Error adding flight marker for ${flight.callsign}:`, error);
        }
      });

      console.log(`Added ${flights.length} flight markers successfully`);
    } catch (error) {
      console.error("Error adding flight markers to map:", error);
    }
  };

  useEffect(() => {
    const fetchTokenAndInitMap = async () => {
      try {
        setIsMapLoading(true);
        
        // Fetch Mapbox token
        const response = await fetch('/api/mapbox-token');
        if (!response.ok) {
          throw new Error('Failed to fetch Mapbox token');
        }
        const { token } = await response.json();
        mapboxgl.accessToken = token;

        if (mapContainer.current) {
          // Create map
          const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: indonesiaCenter,
            zoom: 5,
            pitch: 0,
            bearing: 0,
            antialias: true,
          });

          mapRef.current = map;

          // Handle map load
          map.on('load', () => {
            console.log('Map loaded successfully');
            setIsMapLoading(false);
            fetchFlightData();
          });

          // Handle map errors
          map.on('error', (e) => {
            console.error('Mapbox error details:', {
              error: e.error,
              message: e.error?.message,
              type: e.type,
              sourceId: (e as any).sourceId,
              url: (e as any).url
            });
            const errorMessage = e.error?.message || 'Unknown map error';
            setError(`Map error: ${errorMessage}`);
            setIsMapLoading(false);
          });
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
        setIsMapLoading(false);
      }
    };

    fetchTokenAndInitMap();

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      
      // Remove map
      mapRef.current?.remove();
    };
  }, []);

  const fetchFlightData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching flight data...');
      const response = await fetch('/api/flight-radar');
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Flight data received:', data);
      
      setFlightData(data);
      setIsDrawerOpen(true);
      
      // Add markers to map
      if (mapRef.current && data.flightsList) {
        addFlightMarkersToMap(mapRef.current, data.flightsList);
      }
    } catch (error) {
      console.error("Error fetching flight data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch flight data");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshFlightData = () => {
    fetchFlightData();
  };

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

      {/* Map Container */}
      <div ref={mapContainer} className="absolute top-0 left-0 right-0 bottom-0" />
      
      {/* Flight Data Drawer */}
      {isDrawerOpen && (
        <div className="absolute top-0 left-0 w-96 h-full bg-gray-900 bg-opacity-95 text-white p-4 overflow-y-auto z-20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Flight Data</h2>
            <button 
              onClick={() => setIsDrawerOpen(false)} 
              className="text-white hover:text-gray-300 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          <button 
            onClick={refreshFlightData}
            disabled={isLoading}
            className="mb-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Flight Data'}
          </button>

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Loading flight data...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded p-3 mb-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}
          
          {flightData && flightData.flightsList && (
            <div>
              <p className="mb-4 text-green-400">
                Found {flightData.flightsList.length} flights
              </p>
              
              <div className="space-y-3">
                {flightData.flightsList.map((flight) => (
                  <div key={flight.flightid} className="bg-gray-800 rounded p-3 border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-green-400">
                        {flight.callsign || 'Unknown Flight'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        flight.status === 'NORMAL' ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {flight.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-300 space-y-1">
                      <p><span className="text-gray-400">Aircraft:</span> {flight.icon}</p>
                      <p><span className="text-gray-400">Altitude:</span> {flight.alt.toLocaleString()} ft</p>
                      <p><span className="text-gray-400">Speed:</span> {flight.speed} kts</p>
                      <p><span className="text-gray-400">Track:</span> {flight.track}°</p>
                      <p><span className="text-gray-400">Source:</span> {flight.source}</p>
                      <p><span className="text-gray-400">Coordinates:</span> {flight.lat.toFixed(4)}, {flight.lon.toFixed(4)}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (mapRef.current) {
                          mapRef.current.flyTo({
                            center: [flight.lon, flight.lat],
                            zoom: 10,
                            essential: true
                          });
                        }
                      }}
                      className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      View on Map
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TerritoryMap;
