import type { Flight, Ship } from './types';

export const createAirplaneIcon = (callsign: string, status: string, track: number = 0) => {
  const el = document.createElement('div');
  el.className = 'flight-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.cursor = 'pointer';
  el.style.transition = 'transform 0.3s ease-out';
  
  const color = status === 'NORMAL' ? '#22c55e' : '#ef4444';
  const rotation = track || 0;
  
  el.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${rotation}deg); transform-origin: center;">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  `;
  
  return el;
};

export const updateAirplaneIconRotation = (element: HTMLElement, track: number) => {
  const svg = element.querySelector('svg');
  if (svg) {
    svg.style.transform = `rotate(${track}deg)`;
    svg.style.transformOrigin = 'center';
  }
};

export const createShipIcon = (name: string, heading: number = 0) => {
  const el = document.createElement('div');
  el.className = 'ship-marker';
  el.style.width = '28px';
  el.style.height = '28px';
  el.style.cursor = 'pointer';
  el.style.transition = 'transform 0.3s ease-out';
  
  const rotation = heading || 0;
  
  el.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#3b82f6" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${rotation}deg); transform-origin: center;">
      <path d="M4 13c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-5z" fill="#3b82f6" stroke="#fff" stroke-width="1"/>
      <path d="M12 11V7c0-.6.4-1 1-1s1 .4 1 1v4m-2 0V7c0-.6-.4-1-1-1s-1 .4-1 1v4" fill="#fff" opacity="0.8"/>
      <circle cx="12" cy="15" r="1.5" fill="#fff"/>
    </svg>
  `;
  
  return el;
};

export const updateShipIconRotation = (element: HTMLElement, heading: number) => {
  const svg = element.querySelector('svg');
  if (svg) {
    svg.style.transform = `rotate(${heading}deg)`;
    svg.style.transformOrigin = 'center';
  }
};

export const createPopupHTML = (flight: Flight) => {
  return `
    <div class="popup-content" style="min-width: 200px;">
      <h3 class="popup-title" style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
        ${flight.callsign || 'Unknown Flight'}
      </h3>
      <div style="font-size: 12px; color: #4b5563;">
        <p style="margin: 2px 0;"><strong>Flight ID:</strong> ${flight.flightid || '-'}</p>
        <p style="margin: 2px 0;"><strong>Aircraft:</strong> ${flight.icon || '-'}</p>
        <p style="margin: 2px 0;"><strong>Altitude:</strong> ${flight.alt !== undefined && flight.alt !== null ? flight.alt.toLocaleString() : '-'} ft</p>
        <p style="margin: 2px 0;"><strong>Speed:</strong> ${flight.speed !== undefined && flight.speed !== null ? flight.speed : '-'} kts</p>
        <p style="margin: 2px 0;"><strong>Track:</strong> ${flight.track !== undefined && flight.track !== null ? flight.track : '-'}°</p>
        <p style="margin: 2px 0;"><strong>Status:</strong> ${flight.status || '-'}</p>
        <p style="margin: 2px 0;"><strong>Source:</strong> ${flight.source || '-'}</p>
        <p style="margin: 2px 0;"><strong>On Ground:</strong> ${flight.onGround !== undefined ? (flight.onGround ? 'Yes' : 'No') : '-'}</p>
        ${flight.lat !== null && flight.lat !== undefined && flight.lon !== null && flight.lon !== undefined ? `<p style="margin: 2px 0;"><strong>Coordinates:</strong> ${flight.lat.toFixed(4)}, ${flight.lon.toFixed(4)}</p>` : '<p style="margin: 2px 0;"><strong>Coordinates:</strong> -</p>'}
      </div>
    </div>
  `;
};

export const createShipPopupHTML = (ship: Ship) => {
  const shipName = ship.name || ship.name_ais || 'Unknown Ship';
  return `
    <div class="popup-content" style="min-width: 200px;">
      <h3 class="popup-title" style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
        🚢 ${shipName}
      </h3>
      <div style="font-size: 12px; color: #4b5563;">
        ${ship.mmsi ? `<p style="margin: 2px 0;"><strong>MMSI:</strong> ${ship.mmsi}</p>` : '<p style="margin: 2px 0;"><strong>MMSI:</strong> -</p>'}
        ${ship.imo ? `<p style="margin: 2px 0;"><strong>IMO:</strong> ${ship.imo}</p>` : '<p style="margin: 2px 0;"><strong>IMO:</strong> -</p>'}
        ${ship.callsign ? `<p style="margin: 2px 0;"><strong>Callsign:</strong> ${ship.callsign}</p>` : '<p style="margin: 2px 0;"><strong>Callsign:</strong> -</p>'}
        ${ship.type || ship.type_specific ? `<p style="margin: 2px 0;"><strong>Type:</strong> ${ship.type_specific || ship.type}</p>` : '<p style="margin: 2px 0;"><strong>Type:</strong> -</p>'}
        ${ship.speed !== undefined ? `<p style="margin: 2px 0;"><strong>Speed:</strong> ${ship.speed} kts</p>` : '<p style="margin: 2px 0;"><strong>Speed:</strong> -</p>'}
        ${ship.course !== undefined ? `<p style="margin: 2px 0;"><strong>Course:</strong> ${ship.course}°</p>` : '<p style="margin: 2px 0;"><strong>Course:</strong> -</p>'}
        ${ship.heading !== undefined ? `<p style="margin: 2px 0;"><strong>Heading:</strong> ${ship.heading}°</p>` : '<p style="margin: 2px 0;"><strong>Heading:</strong> -</p>'}
        ${ship.country_name ? `<p style="margin: 2px 0;"><strong>Country:</strong> ${ship.country_name}</p>` : '<p style="margin: 2px 0;"><strong>Country:</strong> -</p>'}
        ${ship.home_port ? `<p style="margin: 2px 0;"><strong>Home Port:</strong> ${ship.home_port}</p>` : '<p style="margin: 2px 0;"><strong>Home Port:</strong> -</p>'}
        ${ship.destination ? `<p style="margin: 2px 0;"><strong>Destination:</strong> ${ship.destination}</p>` : '<p style="margin: 2px 0;"><strong>Destination:</strong> -</p>'}
        ${ship.lat !== undefined && ship.lon !== undefined ? `<p style="margin: 2px 0;"><strong>Coordinates:</strong> ${ship.lat.toFixed(4)}, ${ship.lon.toFixed(4)}</p>` : '<p style="margin: 2px 0;"><strong>Coordinates:</strong> -</p>'}
      </div>
    </div>
  `;
};