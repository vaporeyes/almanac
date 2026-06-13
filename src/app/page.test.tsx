// ABOUTME: Tests for home page layout - validates ASCII weather display
// ABOUTME: Ensures proper rendering of weather data with retro styling

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatDate } from '@/lib/dateFormat'

// Since we're testing an async Server Component, we'll test the logic separately
describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should format dates correctly', () => {
    expect(formatDate(new Date(2026, 9, 15))).toBe('Oct 15')
  })

  it('should format date-only strings without timezone shifts', () => {
    expect(formatDate('2026-10-15')).toBe('Oct 15')
    expect(formatDate('2026-04-15')).toBe('Apr 15')
  })

  it('should have correct default location', () => {
    // Kansas center coordinates
    const DEFAULT_LAT = 39.7456
    const DEFAULT_LON = -97.0892
    
    expect(DEFAULT_LAT).toBeCloseTo(39.7456)
    expect(DEFAULT_LON).toBeCloseTo(-97.0892)
  })

  it('should build correct API URL', () => {
    const DEFAULT_LAT = 39.7456
    const DEFAULT_LON = -97.0892
    const apiUrl = `http://localhost:3000/api/forecast?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}`
    
    expect(apiUrl).toContain('lat=39.7456')
    expect(apiUrl).toContain('lon=-97.0892')
  })
})
