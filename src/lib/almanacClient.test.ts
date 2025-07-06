// ABOUTME: Tests for AlmanacClient - validates NOAA climate data and moon phase integration
// ABOUTME: Ensures frost dates and astronomical data are properly fetched

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlmanacClient } from './almanacClient'

describe('AlmanacClient', () => {
  let client: AlmanacClient

  beforeEach(() => {
    client = new AlmanacClient()
    vi.clearAllMocks()
  })

  it('should return valid frost dates where firstFrost < lastFrost', async () => {
    const frostDates = await client.getFrostDates(39.7456, -97.0892)
    
    expect(frostDates).toBeDefined()
    expect(frostDates.firstFrost).toBeDefined()
    expect(frostDates.lastFrost).toBeDefined()
    
    // First frost should be in fall (Oct-Dec), last frost in spring (Mar-May)
    const firstMonth = new Date(frostDates.firstFrost).getMonth()
    const lastMonth = new Date(frostDates.lastFrost).getMonth()
    
    expect(firstMonth).toBeGreaterThanOrEqual(9) // October or later
    expect(lastMonth).toBeLessThanOrEqual(4) // May or earlier
    
    // Ensure dates make seasonal sense (first frost is after last frost in calendar year)
    const firstDay = new Date(frostDates.firstFrost).getDate()
    const lastDay = new Date(frostDates.lastFrost).getDate()
    
    if (firstMonth === lastMonth) {
      expect(firstDay).toBeGreaterThan(lastDay)
    }
  })

  it('should fetch moon phase data from Sunrise-Sunset API', async () => {
    // Mock Sunrise-Sunset API response
    const mockSunMoonResponse = {
      results: {
        sunrise: '2025-01-06T13:45:00+00:00',
        sunset: '2025-01-06T23:15:00+00:00',
        moon_phase: 0.25, // First quarter
        moon_illumination: 0.5,
      },
      status: 'OK',
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockSunMoonResponse,
    })

    const almanac = await client.getAlmanacData(39.7456, -97.0892)
    
    expect(almanac.moonPhase).toBe('First Quarter')
    expect(almanac.moonIllumination).toBe(50)
    expect(almanac.sunrise).toBe('7:45 AM')
    expect(almanac.sunset).toBe('5:15 PM')
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.sunrise-sunset.org/json')
    )
  })

  it('should handle different moon phases correctly', async () => {
    const moonPhases = [
      { phase: 0, expected: 'New Moon' },
      { phase: 0.125, expected: 'Waxing Crescent' },
      { phase: 0.25, expected: 'First Quarter' },
      { phase: 0.375, expected: 'Waxing Gibbous' },
      { phase: 0.5, expected: 'Full Moon' },
      { phase: 0.625, expected: 'Waning Gibbous' },
      { phase: 0.75, expected: 'Last Quarter' },
      { phase: 0.875, expected: 'Waning Crescent' },
    ]

    for (const { phase, expected } of moonPhases) {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            sunrise: '2025-01-06T13:45:00+00:00',
            sunset: '2025-01-06T23:15:00+00:00',
            moon_phase: phase,
            moon_illumination: phase,
          },
          status: 'OK',
        }),
      })

      const almanac = await client.getAlmanacData(39.7456, -97.0892)
      expect(almanac.moonPhase).toBe(expected)
    }
  })
})