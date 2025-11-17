import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const south = searchParams.get('south') || '-11';
  const west = searchParams.get('west') || '95';
  const north = searchParams.get('north') || '6';
  const east = searchParams.get('east') || '-141';

  const url = `https://flight-radar1.p.rapidapi.com/flights/v2/list-in-boundary?south=${south}&west=${west}&north=${north}&east=${east}&limit=300&dataSource=ADSB%2CMLAT%2CFLARM%2CFAA%2CSATELLITE%2CUAT%2CSPIDERTRACKS%2CAUS%2COTHER_DATA_SOURCE%2CESTIMATED&service=PASSENGER%2CCARGO%2CMILITARY_AND_GOVERNMENT%2CBUSINESS_JETS%2CGENERAL_AVIATION%2CHELICOPTERS%2CLIGHTER_THAN_AIR%2CDRONES%2COTHER_SERVICE%2CNON_CATEGORIZED%2CGLIDERS%2CGROUND_VEHICLES&trafficType=ALL&stats=true`;

  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
      'x-rapidapi-host': 'flight-radar1.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
}