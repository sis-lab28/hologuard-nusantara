import { NextResponse } from "next/server"

export async function GET() {
  // Get the token from the server-side environment variable
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || ""

  if (!mapboxToken) {
    console.error("MAPBOX_ACCESS_TOKEN is not set")
    return NextResponse.json({ error: "Mapbox token not available" }, { status: 500 })
  }

  // Return the token in a JSON response
  return NextResponse.json({ token: mapboxToken })
}
