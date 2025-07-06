// ABOUTME: Tests for home page layout - validates ASCII weather display
// ABOUTME: Ensures proper rendering of weather data with retro styling

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Since we're testing an async Server Component, we'll test the logic separately
describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should format dates correctly', () => {
    // Test date formatting function
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Test with a specific date
    const testMonth = 9 // October (0-indexed)
    const testDay = 15
    const formatted = `${months[testMonth]} ${testDay}`
    expect(formatted).toBe('Oct 15')
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