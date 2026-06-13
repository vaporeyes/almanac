// ABOUTME: Tests for ForecastService - validates aggregation of weather and almanac data
// ABOUTME: Ensures the service properly combines current conditions, forecast, and frost dates

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ForecastService } from './forecastService'
import { WeatherClient } from '../lib/weatherClient'
import { AlmanacClient } from '../lib/almanacClient'

vi.mock('../lib/weatherClient')
vi.mock('../lib/almanacClient')

describe('ForecastService', () => {
  let service: ForecastService
  let mockWeatherClient: WeatherClient
  let mockAlmanacClient: AlmanacClient

  beforeEach(() => {
    mockWeatherClient = new WeatherClient()
    mockAlmanacClient = new AlmanacClient()
    service = new ForecastService(mockWeatherClient, mockAlmanacClient)
    vi.clearAllMocks()
  })

  it('should return merged object with current, forecast, and frostDates', async () => {
    // Mock weather client responses
    vi.mocked(mockWeatherClient.getCurrentConditions).mockResolvedValue({
      temperature: 72,
      description: 'Clear',
      humidity: 65,
      windSpeed: 11.5,
      windDirection: 'S',
    })

    vi.mocked(mockWeatherClient.getHourlyForecast).mockResolvedValue({
      temps: Array.from({ length: 24 }, (_, i) => 72 - i),
    })

    // Mock almanac client responses
    vi.mocked(mockAlmanacClient.getAlmanacData).mockResolvedValue({
      moonPhase: 'Waxing Gibbous',
      moonIllumination: 75,
      sunrise: '5:42 AM',
      sunset: '7:30 PM',
      frostDates: {
        firstFrost: '2025-10-15',
        lastFrost: '2025-04-15',
      },
    })

    const result = await service.getCompleteForecast(39.7456, -97.0892)

    expect(result).toEqual({
      current: {
        temperature: 72,
        description: 'Clear',
        humidity: 65,
        windSpeed: 11.5,
        windDirection: 'S',
      },
      forecast: {
        hourlyTemps: expect.arrayContaining([72, 71, 70]),
        dailyHigh: 72,
        dailyLow: 49,
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
        daysUntilFirstFrost: expect.any(Number),
        daysSinceLastFrost: expect.any(Number),
      },
    })

    expect(mockWeatherClient.getCurrentConditions).toHaveBeenCalledWith(39.7456, -97.0892)
    expect(mockWeatherClient.getHourlyForecast).toHaveBeenCalledWith(39.7456, -97.0892)
    expect(mockAlmanacClient.getAlmanacData).toHaveBeenCalledWith(39.7456, -97.0892)
  })

  it('should calculate days until/since frost dates correctly', async () => {
    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)
    const lastMonth = new Date(today)
    lastMonth.setMonth(today.getMonth() - 1)

    vi.mocked(mockWeatherClient.getCurrentConditions).mockResolvedValue({
      temperature: 72,
      description: 'Clear',
      humidity: 65,
      windSpeed: 11.5,
      windDirection: 'S',
    })

    vi.mocked(mockWeatherClient.getHourlyForecast).mockResolvedValue({
      temps: [72],
    })

    vi.mocked(mockAlmanacClient.getAlmanacData).mockResolvedValue({
      moonPhase: 'Full Moon',
      moonIllumination: 100,
      sunrise: '6:00 AM',
      sunset: '6:00 PM',
      frostDates: {
        firstFrost: nextMonth.toISOString().split('T')[0],
        lastFrost: lastMonth.toISOString().split('T')[0],
      },
    })

    const result = await service.getCompleteForecast(39.7456, -97.0892)

    expect(result.frostDates.daysUntilFirstFrost).toBeGreaterThan(25)
    expect(result.frostDates.daysUntilFirstFrost).toBeLessThan(35)
    expect(result.frostDates.daysSinceLastFrost).toBeGreaterThan(25)
    expect(result.frostDates.daysSinceLastFrost).toBeLessThan(35)
  })

  it('should report zero days until frost when the frost date is in the past', async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    vi.mocked(mockWeatherClient.getCurrentConditions).mockResolvedValue({
      temperature: 72,
      description: 'Clear',
      humidity: 65,
      windSpeed: 11.5,
      windDirection: 'S',
    })

    vi.mocked(mockWeatherClient.getHourlyForecast).mockResolvedValue({
      temps: [72],
    })

    vi.mocked(mockAlmanacClient.getAlmanacData).mockResolvedValue({
      moonPhase: 'Full Moon',
      moonIllumination: 100,
      sunrise: '6:00 AM',
      sunset: '6:00 PM',
      frostDates: {
        firstFrost: yesterday.toISOString().split('T')[0],
        lastFrost: yesterday.toISOString().split('T')[0],
      },
    })

    const result = await service.getCompleteForecast(39.7456, -97.0892)

    expect(result.frostDates.daysUntilFirstFrost).toBe(0)
    expect(result.frostDates.daysSinceLastFrost).toBeGreaterThan(0)
  })

  it('should handle errors gracefully with fallback data', async () => {
    vi.mocked(mockWeatherClient.getCurrentConditions).mockRejectedValue(
      new Error('Weather API error')
    )

    vi.mocked(mockWeatherClient.getHourlyForecast).mockResolvedValue({
      temps: [60],
    })

    vi.mocked(mockAlmanacClient.getAlmanacData).mockResolvedValue({
      moonPhase: 'Unknown',
      moonIllumination: 0,
      sunrise: '6:00 AM',
      sunset: '6:00 PM',
      frostDates: {
        firstFrost: '2025-10-15',
        lastFrost: '2025-04-15',
      },
    })

    const result = await service.getCompleteForecast(39.7456, -97.0892)

    expect(result.current).toEqual({
      temperature: 0,
      description: 'Data unavailable',
      humidity: 0,
      windSpeed: 0,
      windDirection: 'N',
    })
    expect(result.forecast.hourlyTemps).toEqual([60])
  })
})
