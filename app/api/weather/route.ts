import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")

  if (!lat || !lon) {
    return NextResponse.json(
      {
        error: "Latitude and longitude are required",
        location: { name: "Unknown", country: "Unknown" },
        current: {
          temp_c: 25,
          condition: { text: "Weather data unavailable" },
          humidity: 50,
          wind_kph: 10,
        },
      },
      { status: 400 },
    )
  }

  // Use the server-side environment variable
  const apiKey = process.env.WEATHER_API_KEY

  if (!apiKey) {
    console.error("Weather API key is missing. Please set the WEATHER_API_KEY environment variable.")
    return NextResponse.json(
      {
        error: "Weather service configuration error",
        location: { name: "Unknown", country: "Unknown" },
        current: {
          temp_c: 25,
          condition: { text: "Weather data unavailable" },
          humidity: 50,
          wind_kph: 10,
        },
      },
      { status: 500 },
    )
  }

  try {
    // Log the request URL (without the API key for security)
    console.log(`Fetching weather data for coordinates: ${lat}, ${lon}`)

    // Construct the API URL
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`

    // Make the request with explicit headers and timeout
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error("Weather API responded with status:", response.status)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      return NextResponse.json(
        {
          error: `Failed to fetch weather data: ${response.status} ${response.statusText}`,
          location: { name: "Unknown", country: "Unknown" },
          current: {
            temp_c: 25,
            condition: { text: "Weather data unavailable" },
            humidity: 50,
            wind_kph: 10,
          },
        },
        { status: 200 },
      )
    }

    const data = await response.json()
    console.log("Weather data received successfully")
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching weather data:", error)
    return NextResponse.json(
      {
        error: `Failed to fetch weather data: ${error instanceof Error ? error.message : String(error)}`,
        location: { name: "Unknown", country: "Unknown" },
        current: {
          temp_c: 25,
          condition: { text: "Weather data unavailable" },
          humidity: 50,
          wind_kph: 10,
        },
      },
      { status: 200 },
    )
  }
}
