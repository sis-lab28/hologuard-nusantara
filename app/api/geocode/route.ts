import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json(
      {
        error: "Search query is required",
        features: [],
      },
      { status: 400 },
    )
  }

  // Use the server-side environment variable
  const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN

  if (!mapboxAccessToken) {
    console.error("Mapbox access token is missing. Please set the MAPBOX_ACCESS_TOKEN environment variable.")
    return NextResponse.json(
      {
        error: "Geocoding service configuration error",
        features: [],
      },
      { status: 500 },
    )
  }

  try {
    // Log the request (without the token for security)
    console.log(`Geocoding request for query: ${query}`)

    // Construct the Mapbox Geocoding API URL with the access token
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query,
    )}.json?access_token=${mapboxAccessToken}`

    // Make the request
    const response = await fetch(geocodeUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.error("Geocoding API responded with status:", response.status)
      const errorText = await response.text()
      console.error("Error response:", errorText)

      return NextResponse.json(
        {
          error: `Failed to fetch geocoding data: ${response.status} ${response.statusText}`,
          features: [],
        },
        { status: 200 }, // Return 200 to handle error gracefully on client
      )
    }

    const data = await response.json()
    console.log("Geocoding data received successfully")
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching geocoding data:", error)
    return NextResponse.json(
      {
        error: `Failed to fetch geocoding data: ${error instanceof Error ? error.message : String(error)}`,
        features: [],
      },
      { status: 200 }, // Return 200 to handle error gracefully on client
    )
  }
}
