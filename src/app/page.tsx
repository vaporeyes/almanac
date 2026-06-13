// ABOUTME: Home page component displaying the interactive weather almanac
// ABOUTME: Server component that fetches initial weather before client interactions

import { WeatherDashboard } from '@/components'

export const dynamic = 'force-dynamic'

// Default location, Kansas center of US
const DEFAULT_LAT = 39.7456
const DEFAULT_LON = -97.0892

async function getWeatherData() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/forecast?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}`,
      {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch weather data')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching weather:', error)
    return null
  }
}

export default async function Home() {
  const weatherData = await getWeatherData()

  return (
    <main className="min-h-screen p-3 md:p-8">
      <WeatherDashboard
        initialData={weatherData}
        initialLocation={{
          label: 'Kansas, USA',
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LON,
        }}
      />
    </main>
  )
}
