// ABOUTME: Home page component displaying weather almanac with ASCII art styling
// ABOUTME: Server component that fetches and displays current weather and almanac data

import { AsciiPanel, SparkTemp } from '@/components'
import { formatDate } from '@/lib/dateFormat'

export const dynamic = 'force-dynamic'

// Default location (Kansas - center of US)
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
        }
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

  if (!weatherData) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <AsciiPanel className="max-w-2xl">
          <p className="text-center text-2xl">Weather data unavailable</p>
        </AsciiPanel>
      </div>
    )
  }

  const { current, forecast, almanac, frostDates } = weatherData
  const frostDateStr = formatDate(frostDates.firstFrost)

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Main weather panel */}
        <AsciiPanel title="TODAY" className="text-center">
          <div className="space-y-4 p-4">
            {/* Temperature */}
            <div className="text-4xl md:text-6xl">
              {current.temperature}°F ↑ / {forecast.dailyLow}°F ↓
            </div>
            
            {/* Conditions */}
            <div className="text-2xl">
              {current.description}
            </div>

            {/* Sun and Moon */}
            <div className="border-t terminal-border pt-4 mt-4 text-xl">
              Sunrise {almanac.sunrise} | ☾ {almanac.moonPhase}
            </div>

            {/* Frost dates */}
            <div className="border-t terminal-border pt-4 mt-4 text-xl">
              Next frost ≈ {frostDateStr}
            </div>
          </div>
        </AsciiPanel>

        {/* Secondary panels */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* 24hr forecast */}
          <AsciiPanel title="24HR" className="p-4">
            <div className="space-y-2">
              <div className="text-lg">Temperature Trend</div>
              <div className="text-2xl md:text-3xl overflow-x-auto break-all">
                <SparkTemp temps={forecast.hourlyTemps.slice(0, 24)} className="block" />
              </div>
              <div className="text-sm mt-2">
                High: {forecast.dailyHigh}°F | Low: {forecast.dailyLow}°F
              </div>
            </div>
          </AsciiPanel>

          {/* Almanac details */}
          <AsciiPanel title="ALMANAC" className="p-4">
            <div className="space-y-2 text-lg">
              <div>Sunrise: {almanac.sunrise}</div>
              <div>Sunset: {almanac.sunset}</div>
              <div>Moon: {almanac.moonPhase} ({almanac.moonIllumination}%)</div>
              <div className="pt-2 border-t terminal-border">
                <div>Last Frost: {formatDate(frostDates.lastFrost)}</div>
                <div>First Frost: {formatDate(frostDates.firstFrost)}</div>
              </div>
            </div>
          </AsciiPanel>
        </div>

        {/* Footer */}
        <div className="text-center text-sm opacity-50 pt-4">
          Location: Kansas, USA | Data: NWS/NOAA
        </div>
      </div>
    </div>
  )
}
