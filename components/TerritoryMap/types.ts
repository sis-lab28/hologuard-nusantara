export interface PositionBuffer {
  recentPositionsList: Array<{
    deltaLat: number;
    deltaLon: number;
    deltaMs: number;
  }>;
}

export interface Flight {
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

export interface FlightData {
  flightsList: Flight[];
}

export interface Ship {
  uuid?: string;
  mmsi?: string | number;
  imo?: string | number;
  name?: string;
  name_ais?: string;
  lat?: number;
  lon?: number;
  course?: number;
  speed?: number;
  heading?: number;
  type?: string;
  type_specific?: string;
  country_name?: string;
  country_iso?: string;
  callsign?: string;
  home_port?: string | null;
  destination?: string;
}

export interface ShipData {
  ships?: Ship[];
  data?: Ship[];
  results?: Ship[];
}

export interface FlightMarker {
  marker: mapboxgl.Marker;
  labelMarker?: mapboxgl.Marker;
  element: HTMLElement;
  labelElement?: HTMLElement;
}

export interface ShipMarker {
  marker: mapboxgl.Marker;
  labelMarker?: mapboxgl.Marker;
  element: HTMLElement;
  labelElement?: HTMLElement;
}

