// ABOUTME: Tests for forecast API endpoint - validates request handling and response format
// ABOUTME: Ensures proper error handling for invalid parameters and service failures

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

vi.mock('@/services/forecastService')
vi.mock('@/lib/weatherClient')
vi.mock('@/lib/almanacClient')

describe('Forecast API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if lat or lon is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/forecast')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required parameters: lat and lon')
  })

  it('should return 400 if lat or lon is not a number', async () => {
    const request = new NextRequest('http://localhost:3000/api/forecast?lat=abc&lon=def')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid coordinates: lat and lon must be numbers')
  })

  it('should return 400 if latitude is out of range', async () => {
    const request = new NextRequest('http://localhost:3000/api/forecast?lat=91&lon=0')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid latitude: must be between -90 and 90')
  })

  it('should return 400 if longitude is out of range', async () => {
    const request = new NextRequest('http://localhost:3000/api/forecast?lat=0&lon=181')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid longitude: must be between -180 and 180')
  })

  it('should return forecast data with valid coordinates', async () => {
    const mockForecast = {
      current: {
        temperature: 72,
        description: 'Clear',
        humidity: 65,
        windSpeed: 11.5,
        windDirection: 'S',
      },
      forecast: {
        hourlyTemps: [72, 71, 70],
        dailyHigh: 72,
        dailyLow: 60,
      },
      almanac: {
        moonPhase: 'Waxing Gibbous',
        moonIllumination: 75,
        sunrise: '5:42 AM',
        sunset: '7:30 PM',
      },
      frostDates: {
        firstFrost: '2025-10-15',
        lastFrost: '2025-04-15',
        daysUntilFirstFrost: 100,
        daysSinceLastFrost: 50,
      },
    }

    const ForecastService = vi.mocked(await import('@/services/forecastService')).ForecastService
    ForecastService.prototype.getCompleteForecast = vi.fn().mockResolvedValue(mockForecast)

    const request = new NextRequest('http://localhost:3000/api/forecast?lat=39.7456&lon=-97.0892')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockForecast)
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=600')
  })

  it('should return 500 if service throws an error', async () => {
    const ForecastService = vi.mocked(await import('@/services/forecastService')).ForecastService
    ForecastService.prototype.getCompleteForecast = vi.fn().mockRejectedValue(new Error('Service error'))

    const request = new NextRequest('http://localhost:3000/api/forecast?lat=39.7456&lon=-97.0892')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch forecast data')
  })
})