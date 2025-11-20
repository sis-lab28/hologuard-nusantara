'use client'

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { 
  Flight, FlightData, Ship, ShipData,
  FlightMarker, ShipMarker, 
} from './TerritoryMap/types';
import {
  createAirplaneIcon,
  updateAirplaneIconRotation,
  createShipIcon,
  updateShipIconRotation,
    createPopupHTML,
  createShipPopupHTML,
} from './TerritoryMap/markerUtils';

const TerritoryMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const flightMarkersRef = useRef<globalThis.Map<number, FlightMarker>>(new globalThis.Map<number, FlightMarker>());
  const shipMarkersRef = useRef<globalThis.Map<number | string, ShipMarker>>(new globalThis.Map<number | string, ShipMarker>());
  const shipsStateRef = useRef<globalThis.Map<string, Ship>>(
    new globalThis.Map<string, Ship>()
  );
  const maritimeEventSourceRef = useRef<EventSource | null>(null);
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [shipData, setShipData] = useState<ShipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaritimeLoading, setIsMaritimeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [flightSearch, setFlightSearch] = useState('');
  const [shipSearch, setShipSearch] = useState('');
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const indonesiaCenter: [number, number] = [118, -2];

  const updateFlightMarkers = (map: mapboxgl.Map, flights: Flight[]) => {
    try {
      const existingFlightIds = new Set(flightMarkersRef.current.keys());
      const currentFlightIds = new Set(flights.map(f => f.flightid));

      existingFlightIds.forEach((flightId) => {
        const id = flightId as number;
        if (!currentFlightIds.has(id)) {
          const flightMarker = flightMarkersRef.current.get(id);
          if (flightMarker) {
            flightMarker.marker.remove();
            if (flightMarker.labelMarker) {
              flightMarker.labelMarker.remove();
            }
            flightMarkersRef.current.delete(id);
          }
        }
      });

      flights.forEach((flight) => {
        try {
          if (flight.lat === null || flight.lat === undefined || flight.lon === null || flight.lon === undefined) {
            console.warn('Skipping flight with invalid coordinates:', flight);
            return;
          }

          const existingMarker = flightMarkersRef.current.get(flight.flightid);

          if (existingMarker) {
            const newPosition: [number, number] = [flight.lon, flight.lat];
            
            existingMarker.marker.setLngLat(newPosition);
            
            updateAirplaneIconRotation(existingMarker.element, flight.track);
            
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(createPopupHTML(flight));
            existingMarker.marker.setPopup(popup);
            
            if (existingMarker.labelMarker) {
              existingMarker.labelMarker.setLngLat(newPosition);
            }
          } else {
            const el = createAirplaneIcon(flight.callsign, flight.status, flight.track);
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(createPopupHTML(flight));

            const flightMarker = new mapboxgl.Marker(el)
              .setLngLat([flight.lon, flight.lat])
              .setPopup(popup)
              .addTo(map);

            let labelMarker: mapboxgl.Marker | undefined;
            let labelElement: HTMLElement | undefined;

            flightMarkersRef.current.set(flight.flightid, {
              marker: flightMarker,
              labelMarker,
              element: el,
              labelElement
            });
          }
        } catch (error) {
          console.error(`Error updating flight marker for ${flight.callsign}:`, error);
        }
      });

      console.log(`Updated ${flights.length} flight markers (${flightMarkersRef.current.size} total)`);
    } catch (error) {
      console.error("Error updating flight markers:", error);
    }
  };

  const updateShipMarkers = (map: mapboxgl.Map, ships: Ship[]) => {
    try {
      const existingShipIds = new Set(shipMarkersRef.current.keys());
      const currentShipIds = new Set(ships.map(s => String(s.mmsi || s.imo || s.uuid || `${s.lat}-${s.lon}`)));

      existingShipIds.forEach((shipId) => {
        const idStr = String(shipId);
        if (!currentShipIds.has(idStr)) {
          const shipMarker = shipMarkersRef.current.get(idStr);
          if (shipMarker) {
            shipMarker.marker.remove();
            if (shipMarker.labelMarker) {
              shipMarker.labelMarker.remove();
            }
            shipMarkersRef.current.delete(idStr);
          }
        }
      });

      ships.forEach((ship) => {
        try {
          if (ship.lat === undefined || ship.lat === null || ship.lon === undefined || ship.lon === null) {
            console.warn('Ship missing coordinates:', ship);
            return;
          }

          const shipId = String(ship.uuid || ship.mmsi || ship.imo || `${ship.lat}-${ship.lon}`);
          const shipName = ship.name || ship.name_ais || 'Ship';
          const existingMarker = shipMarkersRef.current.get(shipId);

          if (existingMarker) {
            const newPosition: [number, number] = [ship.lon, ship.lat];
            existingMarker.marker.setLngLat(newPosition);
            if (ship.heading !== undefined) {
              updateShipIconRotation(existingMarker.element, ship.heading);
            }
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(createShipPopupHTML(ship));
            existingMarker.marker.setPopup(popup);
            if (existingMarker.labelMarker) {
              existingMarker.labelMarker.setLngLat(newPosition);
            }
          } else {
            const el = createShipIcon(shipName, ship.heading || 0);
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(createShipPopupHTML(ship));

            const shipMarker = new mapboxgl.Marker(el)
              .setLngLat([ship.lon, ship.lat])
              .setPopup(popup)
              .addTo(map);

            let labelMarker: mapboxgl.Marker | undefined;
            let labelElement: HTMLElement | undefined;

            shipMarkersRef.current.set(shipId, {
              marker: shipMarker,
              labelMarker,
              element: el,
              labelElement
            });
          }
        } catch (error) {
          console.error(`Error updating ship marker:`, error);
        }
      });

      console.log(`Updated ${ships.length} ship markers (${shipMarkersRef.current.size} total)`);
    } catch (error) {
      console.error("Error updating ship markers:", error);
    }
  };

  useEffect(() => {
    const fetchTokenAndInitMap = async () => {
      try {
        setIsMapLoading(true);
        
        const response = await fetch('/api/mapbox-token');
        if (!response.ok) {
          throw new Error('Failed to fetch Mapbox token');
        }
        const { token } = await response.json();
        mapboxgl.accessToken = token;

        if (mapContainer.current) {
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

          map.on('load', () => {
            console.log('Map loaded successfully');
            setIsMapLoading(false);
            map.resize();
            fetchFlightData();
          });

          map.on('style.load', () => {
            console.log('Map style loaded');
            map.resize();
          });

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
      flightMarkersRef.current.forEach((flightMarker: FlightMarker) => {
        flightMarker.marker.remove();
        if (flightMarker.labelMarker) {
          flightMarker.labelMarker.remove();
        }
      });
      flightMarkersRef.current.clear();

      shipMarkersRef.current.forEach((shipMarker: ShipMarker) => {
        shipMarker.marker.remove();
        if (shipMarker.labelMarker) {
          shipMarker.labelMarker.remove();
        }
      });
      shipMarkersRef.current.clear();

      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      mapRef.current?.remove();
    };
  }, []);

  const fetchFlightData = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      console.log('Fetching flight data...');
      const response = await fetch('/api/flight-radar');
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Flight data received:', data);
      
      const flights = data.flightsList || data.flights || data.data?.flightsList || data.data?.flights || [];
      
      if (flights.length === 0) {
        console.warn('No flights found in response:', data);
      }
      
      setFlightData({ flightsList: flights });
      setIsDrawerOpen(true);
      
      if (mapRef.current && flights.length > 0) {
        console.log(`Updating ${flights.length} flights on map`);
        updateFlightMarkers(mapRef.current, flights);
      } else if (mapRef.current) {
        console.warn('Map is ready but no flights to display');
      }
    } catch (error) {
      console.error("Error fetching flight data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch flight data");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isRealTimeEnabled || !mapRef.current) {
      if (maritimeEventSourceRef.current) {
        maritimeEventSourceRef.current.close();
        maritimeEventSourceRef.current = null;
      }
      return;
    }

    if (maritimeEventSourceRef.current) {
      return;
    }

    setIsMaritimeLoading(true);

    const params = new URLSearchParams({
      south: '-11',
      west: '95',
      north: '6',
      east: '141',
    });

    const es = new EventSource(`/api/maritime?${params.toString()}`);
    maritimeEventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (!data || data.type === 'info' || data.type === 'error') {
          return;
        }

        const messageType = data.MessageType || data.messageType;
        const meta = data.MetaData || data.Metadata || {};

        if (messageType === 'PositionReport') {
          const position = data.Message?.PositionReport || data.Message?.positionReport;
          if (!position) {
            return;
          }

          const latitude = meta.latitude ?? meta.Latitude ?? position.Latitude;
          const longitude = meta.longitude ?? meta.Longitude ?? position.Longitude;
          if (latitude == null || longitude == null) {
            return;
          }

          const mmsiValue = meta.MMSI ?? position.UserID;
          if (mmsiValue == null) {
            return;
          }

          const mmsi = String(mmsiValue);
          const shipId = mmsi;

          const existing = shipsStateRef.current.get(shipId) || {};

          const ship: Ship = {
            ...existing,
            mmsi,
            lat: latitude,
            lon: longitude,
            speed: position.Sog,
            course: position.Cog,
            heading: position.TrueHeading,
            nav_status_code: position.NavigationalStatus,
            name: existing.name || meta.ShipName || meta.Name,
            callsign: existing.callsign || meta.CallSign,
            time_utc: meta.time_utc || (existing as Ship).time_utc,
          };

          if (mmsi === '352005564') {
            console.log('AIS DEBUG MMSI 352005564 (PositionReport)', {
              raw: data,
              meta,
              position,
              mappedShip: ship,
            });
          }

          shipsStateRef.current.set(shipId, ship);

          const shipsArray = Array.from(shipsStateRef.current.values());
          const shipsWithCoords = shipsArray.filter(
            (s) => s.lat != null && s.lon != null,
          ) as Ship[];

          setShipData({ ships: shipsWithCoords });

          if (mapRef.current && shipsWithCoords.length > 0) {
            updateShipMarkers(mapRef.current, shipsWithCoords);
          }

          return;
        }

        if (messageType === 'ShipStaticData') {
          const staticMsg = data.Message?.ShipStaticData || data.Message?.shipStaticData;
          if (!staticMsg) {
            return;
          }

          const mmsiValue = meta.MMSI ?? staticMsg.UserID;
          if (mmsiValue == null) {
            return;
          }

          const mmsi = String(mmsiValue);
          const shipId = mmsi;

          const existing = shipsStateRef.current.get(shipId) || {};

          const ship: Ship = {
            ...existing,
            mmsi,
            imo: staticMsg.ImoNumber ?? existing.imo,
            callsign: staticMsg.CallSign || existing.callsign,
            name: staticMsg.Name || existing.name,
            type_code: staticMsg.Type ?? existing.type_code,
            destination: staticMsg.Destination || existing.destination,
            draught: staticMsg.MaximumStaticDraught ?? existing.draught,
          };

          if (mmsi === '352005564') {
            console.log('AIS DEBUG MMSI 352005564 (ShipStaticData)', {
              raw: data,
              meta,
              staticMsg,
              mappedShip: ship,
            });
          }

          shipsStateRef.current.set(shipId, ship);

          const shipsArray = Array.from(shipsStateRef.current.values());

          const shipsWithCoords = shipsArray.filter(
            (s) => s.lat != null && s.lon != null,
          ) as Ship[];

          setShipData({ ships: shipsWithCoords });

          if (mapRef.current && shipsWithCoords.length > 0) {
            updateShipMarkers(mapRef.current, shipsWithCoords);
          }

          return;
        }
      } catch (err) {
        console.error('Error parsing AIS SSE message:', err);
      }
    };

    es.onerror = (event) => {
      console.error('AIS SSE error event', {
        type: event.type,
        readyState: es.readyState,
      });
      setIsMaritimeLoading(false);
      es.close();
      maritimeEventSourceRef.current = null;
    };

    es.onopen = () => {
      console.log('AIS SSE connection opened');
      setIsMaritimeLoading(false);
    };

    return () => {
      if (maritimeEventSourceRef.current) {
        maritimeEventSourceRef.current.close();
        maritimeEventSourceRef.current = null;
      }
    };
  }, [isRealTimeEnabled]);

  const refreshFlightData = () => {
    fetchFlightData(false);
  };

  return (
    <div className="relative h-screen w-full">
      {/* Map Loading Indicator */}
      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-30">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-white">Initializing Map...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && !isMapLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded z-40">
          {error}
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="absolute top-0 left-0 right-0 bottom-0 w-full h-full z-10"
        style={{ minHeight: '100vh' }}
      />
      
      {/* Data Drawer */}
      {isDrawerOpen && (
        <div className="absolute top-0 left-0 w-96 h-full bg-gray-900 bg-opacity-95 text-white p-4 overflow-y-auto z-20 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Territory Data</h2>
            <button 
              onClick={() => setIsDrawerOpen(false)} 
              className="text-white hover:text-gray-300 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="mb-4 space-y-2">
            <button 
              onClick={refreshFlightData}
              disabled={isLoading || isMaritimeLoading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600"
            >
              {(isLoading || isMaritimeLoading) ? 'Refreshing...' : 'Refresh All Data'}
            </button>
            
            <button 
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`w-full px-4 py-2 rounded ${
                isRealTimeEnabled 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              {isRealTimeEnabled ? '🟢 Real-time: ON' : '⚫ Real-time: OFF'}
            </button>
          </div>

          {(isLoading || isMaritimeLoading) && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p>Loading data...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded p-3 mb-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Flights Section */}
          {flightData && flightData.flightsList && flightData.flightsList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-green-400 mb-3">
                ✈️ Flights ({flightData.flightsList.length})
              </h3>
              <input
                type="text"
                value={flightSearch}
                onChange={(e) => setFlightSearch(e.target.value)}
                placeholder="Search flights (callsign)"
                className="mb-2 w-full px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-white placeholder-gray-400"
              />
              {flightSearch && (
                <p className="text-xs text-gray-400 mb-1">
                  Showing results for: <span className="font-mono">{flightSearch}</span>
                </p>
              )}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {flightData.flightsList
                  .filter((flight) => {
                    if (!flightSearch.trim()) return true;
                    const q = flightSearch.toLowerCase();
                    return (flight.callsign || '').toLowerCase().includes(q);
                  })
                  .map((flight) => (
                  <div key={flight.flightid} className="bg-gray-800 rounded p-3 border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-green-400 text-sm">
                        {flight.callsign || 'Unknown Flight'}
                      </h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        flight.status === 'NORMAL' ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {flight.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-1">
                      <p><span className="text-gray-400">Speed:</span> {flight.speed} kts</p>
                      <p><span className="text-gray-400">Altitude:</span> {flight.alt.toLocaleString()} ft</p>
                    </div>
                    <button
                      onClick={() => {
                        if (mapRef.current) {
                          const map = mapRef.current;
                          map.flyTo({
                            center: [flight.lon, flight.lat],
                            zoom: 10,
                            essential: true
                          });

                          const handleMoveEnd = () => {
                            const markerEntry = flightMarkersRef.current.get(flight.flightid);
                            if (markerEntry?.marker) {
                              markerEntry.marker.togglePopup();
                            }
                            map.off('moveend', handleMoveEnd);
                          };

                          map.on('moveend', handleMoveEnd);
                        }
                      }}
                      className="mt-2 w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ships Section */}
          {shipData && shipData.ships && shipData.ships.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3">
                🚢 Ships ({shipData.ships.length})
              </h3>
              <input
                type="text"
                value={shipSearch}
                onChange={(e) => setShipSearch(e.target.value)}
                placeholder="Search ships (name, MMSI, IMO)"
                className="mb-2 w-full px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-white placeholder-gray-400"
              />
              {shipSearch && (
                <p className="text-xs text-gray-400 mb-1">
                  Showing results for: <span className="font-mono">{shipSearch}</span>
                </p>
              )}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {shipData.ships
                  .filter((ship) => {
                    if (!shipSearch.trim()) return true;
                    const q = shipSearch.toLowerCase();
                    const name = (ship.name || ship.name_ais || '').toLowerCase();
                    const mmsi = String(ship.mmsi || '').toLowerCase();
                    const imo = String(ship.imo || '').toLowerCase();
                    return (
                      name.includes(q) ||
                      mmsi.includes(q) ||
                      imo.includes(q)
                    );
                  })
                  .map((ship, index) => {
                  const shipId = ship.uuid || ship.mmsi || ship.imo || `ship-${index}`;
                  const shipName = ship.name || ship.name_ais || 'Unknown Ship';
                  return (
                    <div key={shipId} className="bg-gray-800 rounded p-3 border border-gray-700">
                      <h4 className="font-bold text-blue-400 text-sm mb-2">
                        {shipName}
                      </h4>
                      <div className="text-xs text-gray-300 space-y-1">
                        {(ship.type || ship.type_specific || ship.type_code !== undefined) && (
                          <p><span className="text-gray-400">Type:</span> {ship.type_specific || ship.type || ship.type_code}</p>
                        )}
                        {ship.imo && (
                          <p><span className="text-gray-400">IMO:</span> {ship.imo}</p>
                        )}
                        {ship.callsign && (
                          <p><span className="text-gray-400">Callsign:</span> {ship.callsign}</p>
                        )}
                        {ship.destination && (
                          <p><span className="text-gray-400">Destination:</span> {ship.destination}</p>
                        )}
                        {ship.speed !== undefined && (
                          <p><span className="text-gray-400">Speed:</span> {ship.speed} kts</p>
                        )}
                        {ship.course !== undefined && (
                          <p><span className="text-gray-400">Course:</span> {ship.course}°</p>
                        )}
                        {ship.heading !== undefined && (
                          <p><span className="text-gray-400">Heading:</span> {ship.heading}°</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (mapRef.current && ship.lat !== undefined && ship.lon !== undefined) {
                            const map = mapRef.current;
                            map.flyTo({
                              center: [ship.lon, ship.lat],
                              zoom: 10,
                              essential: true
                            });
                            const markerKey = String(ship.uuid || ship.mmsi || ship.imo || `${ship.lat}-${ship.lon}`);

                            const handleMoveEnd = () => {
                              const markerEntry = shipMarkersRef.current.get(markerKey as any);
                              if (markerEntry?.marker) {
                                markerEntry.marker.togglePopup();
                              }
                              map.off('moveend', handleMoveEnd);
                            };

                            map.on('moveend', handleMoveEnd);
                          }
                        }}
                        className="mt-2 w-full px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default TerritoryMap;
