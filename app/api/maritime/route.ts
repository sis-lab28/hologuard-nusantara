import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const south = parseFloat(searchParams.get('south') || '-11');
  const west = parseFloat(searchParams.get('west') || '95');
  const north = parseFloat(searchParams.get('north') || '6');
  const east = parseFloat(searchParams.get('east') || '141');

  const isValidCoordinate = (lat: number, lon: number) => {
    return lat !== 0 && lon !== 0 && 
           lat >= south && lat <= north && 
           lon >= west && lon <= east;
  };

  try {
    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
        'x-rapidapi-host': 'maritime-ships-and-ports-database.p.rapidapi.com'
      }
    };

    console.log(`Fetching vessels for Indonesia (country_iso=ID)`);
    
    const url = `https://maritime-ships-and-ports-database.p.rapidapi.com/api/v0/vessel_find?country_iso=ID&limit=300`;
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error('vessel_find failed:', response.status);
      return NextResponse.json({ 
        ships: [], 
        data: [], 
        results: [],
        stats: { total: 0, valid: 0, invalid: 0 }
      });
    }

    const result = await response.json();

    let vessels: any[] = [];
    
    if (result.data?.vessels && Array.isArray(result.data.vessels)) {
      vessels = result.data.vessels;
    } else if (result.data && Array.isArray(result.data)) {
      vessels = result.data;
    } else if (Array.isArray(result)) {
      vessels = result;
    }

    console.log(`Total vessels from API: ${vessels.length}`);

    const validVessels = vessels.filter((vessel: any) => {
      return vessel.lat !== undefined && 
             vessel.lon !== undefined && 
             isValidCoordinate(vessel.lat, vessel.lon);
    });

    console.log(`Valid vessels: ${validVessels.length}`);
    console.log(`Invalid/missing coords: ${vessels.length - validVessels.length}`);

    if (validVessels.length > 0) {
      console.log('Sample vessel:', {
        name: validVessels[0].name,
        lat: validVessels[0].lat,
        lon: validVessels[0].lon,
        mmsi: validVessels[0].mmsi
      });
    }

    return NextResponse.json({ 
      ships: validVessels,
      data: result.data || {},
      results: validVessels,
      stats: {
        total: vessels.length,
        valid: validVessels.length,
        invalid: vessels.length - validVessels.length
      }
    });

  } catch (error) {
    console.error('Maritime API error:', error);
    return NextResponse.json({ 
      ships: [], 
      data: [], 
      results: [],
      stats: { total: 0, valid: 0, invalid: 0 }
    });
  }
}