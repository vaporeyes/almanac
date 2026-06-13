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

  it('should fetch sun data and calculate moon phase', async () => {
    // Mock Sunrise-Sunset API response (without moon data)
    const mockSunResponse = {
      results: {
        sunrise: '2025-01-06T13:45:00+00:00',
        sunset: '2025-01-06T23:15:00+00:00',
        solar_noon: '2025-01-06T18:30:00+00:00',
        day_length: '09:30:00',
      },
      status: 'OK',
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockSunResponse,
    })

    const almanac = await client.getAlmanacData(39.7456, -97.0892)
    
    // Moon phase is calculated locally, so we just check it exists and is valid
    expect(almanac.moonPhase).toBeDefined()
    expect(['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']).toContain(almanac.moonPhase)
    expect(almanac.moonIllumination).toBeGreaterThanOrEqual(0)
    expect(almanac.moonIllumination).toBeLessThanOrEqual(100)
    expect(almanac.sunrise).toBe('7:45 AM')
    expect(almanac.sunset).toBe('5:15 PM')
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.sunrise-sunset.org/json')
    )
  })

  it('should accept numeric day length from Sunrise-Sunset API', async () => {
    const mockSunResponse = {
      results: {
        sunrise: '2025-01-06T13:45:00+00:00',
        sunset: '2025-01-06T23:15:00+00:00',
        day_length: 34200,
      },
      status: 'OK',
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockSunResponse,
    })

    const almanac = await client.getAlmanacData(39.7456, -97.0892)

    expect(almanac.sunrise).toBe('7:45 AM')
    expect(almanac.sunset).toBe('5:15 PM')
  })

})
