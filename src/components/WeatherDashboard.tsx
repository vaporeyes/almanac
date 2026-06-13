// ABOUTME: Client-side weather dashboard that owns location and forecast refresh state
// ABOUTME: Renders forecast panels inside the draggable Qt window shell

'use client'

import { useState } from 'react'
import type { CompleteForecast } from '@/services/forecastService'
import { formatDate } from '@/lib/dateFormat'
import { AsciiPanel } from './AsciiPanel'
import { QtWindow } from './QtWindow'
import { SparkTemp } from './SparkTemp'

interface WeatherDashboardProps {
  initialData: CompleteForecast | null
  initialLocation: LocationState
}

interface LocationState {
  label: string
  latitude: number
  longitude: number
}

interface GeocodeResponse {
  label: string
  latitude: number
  longitude: number
}

const DEFAULT_ERROR = 'Weather data unavailable'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.error || DEFAULT_ERROR)
  }

  return response.json()
}

export function WeatherDashboard({ initialData, initialLocation }: WeatherDashboardProps) {
  const [weatherData, setWeatherData] = useState<CompleteForecast | null>(initialData)
  const [location, setLocation] = useState<LocationState>(initialLocation)
  const [isLoading, setIsLoading] = useState(false)
  const [compactView, setCompactView] = useState(false)
  const [error, setError] = useState<string | null>(initialData ? null : DEFAULT_ERROR)

  async function loadForecast(nextLocation: LocationState) {
    const params = new URLSearchParams({
      lat: String(nextLocation.latitude),
      lon: String(nextLocation.longitude),
    })
    const forecast = await fetchJson<CompleteForecast>(`/api/forecast?${params.toString()}`)

    setWeatherData(forecast)
    setLocation(nextLocation)
    setError(null)
  }

  async function refresh() {
    setIsLoading(true)

    try {
      await loadForecast(location)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : DEFAULT_ERROR)
    } finally {
      setIsLoading(false)
    }
  }

  async function changeLocation(query: string) {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      throw new Error('Enter a ZIP code or address')
    }

    setIsLoading(true)

    try {
      const params = new URLSearchParams({ query: normalizedQuery })
      const geocoded = await fetchJson<GeocodeResponse>(`/api/geocode?${params.toString()}`)

      await loadForecast({
        label: geocoded.label,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const statusLeft = `Location: ${location.label}`
  const statusRight = error ? `Error: ${error}` : 'Data: NWS/NOAA'

  return (
    <QtWindow
      compactView={compactView}
      isLoading={isLoading}
      locationLabel={location.label}
      onCompactViewChange={setCompactView}
      onLocationSubmit={changeLocation}
      onRefresh={refresh}
      statusLeft={statusLeft}
      statusRight={statusRight}
      title="Farmer's Almanac Weather"
    >
      <div className={`space-y-3 p-3 md:p-4 ${isLoading ? 'opacity-70' : ''}`}>
        {weatherData ? (
          <WeatherPanels compactView={compactView} weatherData={weatherData} />
        ) : (
          <AsciiPanel>
            <p className="text-center text-lg">{error || DEFAULT_ERROR}</p>
          </AsciiPanel>
        )}
      </div>
    </QtWindow>
  )
}

function WeatherPanels({
  compactView,
  weatherData,
}: {
  compactView: boolean
  weatherData: CompleteForecast
}) {
  const { current, forecast, almanac, frostDates } = weatherData
  const frostDateStr = formatDate(frostDates.firstFrost)

  return (
    <>
      <AsciiPanel title="Today">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="qt-display p-4 text-center">
            <div className={`qt-value leading-none ${compactView ? 'text-4xl' : 'text-4xl md:text-6xl'}`}>
              {current.temperature}°F
            </div>
            <div className="mt-2 text-base md:text-lg">
              Daily low {forecast.dailyLow}°F
            </div>
            <div className="mt-4 text-xl font-semibold">
              {current.description}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="qt-display p-3">
              <div className="terminal-dim text-xs uppercase">Sunrise</div>
              <div className="qt-value text-2xl">{almanac.sunrise}</div>
            </div>
            <div className="qt-display p-3">
              <div className="terminal-dim text-xs uppercase">Moon</div>
              <div className="text-lg">{almanac.moonPhase}</div>
            </div>
            <div className="qt-display p-3">
              <div className="terminal-dim text-xs uppercase">Next frost</div>
              <div className="qt-value text-2xl">{frostDateStr}</div>
            </div>
          </div>
        </div>
      </AsciiPanel>

      {!compactView && (
        <div className="grid gap-3 md:grid-cols-2">
          <AsciiPanel title="24 Hour Forecast">
            <div className="space-y-3">
              <div className="qt-display spark-temp-chart overflow-visible p-3">
                <SparkTemp temps={forecast.hourlyTemps.slice(0, 24)} className="block text-3xl md:text-4xl" />
              </div>
              <div className="qt-row grid grid-cols-2 gap-2 pt-3 text-sm">
                <div>
                  <div className="terminal-dim">High</div>
                  <div className="qt-value text-xl">{forecast.dailyHigh}°F</div>
                </div>
                <div>
                  <div className="terminal-dim">Low</div>
                  <div className="qt-value text-xl">{forecast.dailyLow}°F</div>
                </div>
              </div>
            </div>
          </AsciiPanel>

          <AsciiPanel title="Almanac">
            <div className="space-y-2 text-sm">
              <div className="qt-display grid grid-cols-[6rem_1fr] gap-2 p-2">
                <span className="terminal-dim">Sunrise</span>
                <span>{almanac.sunrise}</span>
              </div>
              <div className="qt-display grid grid-cols-[6rem_1fr] gap-2 p-2">
                <span className="terminal-dim">Sunset</span>
                <span>{almanac.sunset}</span>
              </div>
              <div className="qt-display grid grid-cols-[6rem_1fr] gap-2 p-2">
                <span className="terminal-dim">Moon</span>
                <span>{almanac.moonPhase} ({almanac.moonIllumination}%)</span>
              </div>
              <div className="qt-row grid gap-2 pt-3 sm:grid-cols-2">
                <div>
                  <div className="terminal-dim">Last Frost</div>
                  <div>{formatDate(frostDates.lastFrost)}</div>
                </div>
                <div>
                  <div className="terminal-dim">First Frost</div>
                  <div>{formatDate(frostDates.firstFrost)}</div>
                </div>
              </div>
            </div>
          </AsciiPanel>
        </div>
      )}
    </>
  )
}
