// ABOUTME: Tests for WeatherClient - validates NWS API integration
// ABOUTME: Ensures weather data is properly fetched and parsed

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WeatherClient } from './weatherClient'

describe('WeatherClient', () => {
  let client: WeatherClient

  beforeEach(() => {
    client = new WeatherClient()
    vi.clearAllMocks()
  })

  it('should fetch hourly forecast and return temps array with 24 items', async () => {
    // Mock NWS API response
    const mockForecastResponse = {
      properties: {
        periods: Array.from({ length: 24 }, (_, i) => ({
          number: i + 1,
          name: `Period ${i + 1}`,
          temperature: 72 - i,
          temperatureUnit: 'F',
          startTime: new Date(Date.now() + i * 3600000).toISOString(),
          endTime: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
          isDaytime: i % 2 === 0,
          shortForecast: 'Clear',
          detailedForecast: 'Clear skies',
        })),
      },
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockForecastResponse,
    })

    const forecast = await client.getHourlyForecast(39.7456, -97.0892)
    
    expect(forecast.temps).toHaveLength(24)
    expect(forecast.temps[0]).toBe(72)
    expect(forecast.temps[23]).toBe(49)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.weather.gov/gridpoints')
    )
  })

  it('should fetch current conditions from observation station', async () => {
    // Mock station lookup response
    const mockPointsResponse = {
      properties: {
        observationStations: 'https://api.weather.gov/gridpoints/TOP/31,80/stations',
      },
    }

    // Mock stations list response
    const mockStationsResponse = {
      features: [
        {
          properties: {
            stationIdentifier: 'KTOP',
            name: 'Topeka, Forbes Field',
          },
        },
      ],
    }

    // Mock current observation response
    const mockObservationResponse = {
      properties: {
        temperature: {
          value: 22.2, // Celsius
          unitCode: 'wmoUnit:degC',
        },
        textDescription: 'Clear',
        windSpeed: {
          value: 5.14, // m/s
          unitCode: 'wmoUnit:m_s-1',
        },
        windDirection: {
          value: 180,
          unitCode: 'wmoUnit:degree_(angle)',
        },
        relativeHumidity: {
          value: 65,
          unitCode: 'wmoUnit:percent',
        },
      },
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPointsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStationsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockObservationResponse,
      })

    const current = await client.getCurrentConditions(39.7456, -97.0892)
    
    expect(current.temperature).toBe(72) // Converted to Fahrenheit
    expect(current.description).toBe('Clear')
    expect(current.humidity).toBe(65)
    expect(current.windSpeed).toBeCloseTo(11.5, 1) // Converted to mph
    expect(current.windDirection).toBe('S')
  })
})