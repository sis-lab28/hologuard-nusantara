export function validateEnv() {
  const requiredEnvVars = ["MAPBOX_ACCESS_TOKEN", "WEATHER_API_KEY"]

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`)
    return false
  }

  return true
}
