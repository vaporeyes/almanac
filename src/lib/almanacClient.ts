// ABOUTME: Almanac client for historical climate data and astronomical information
// ABOUTME: Integrates NOAA frost dates and Sunrise-Sunset API for moon phases

import { z } from 'zod'
import noaaData from '../data/noaa_normals.json'

const SunriseSunsetResponseSchema = z.object({
  results: z.object({
    sunrise: z.string(),
    sunset: z.string(),
    moon_phase: z.number(),
    moon_illumination: z.number(),
  }),
  status: z.string(),
})

export interface FrostDates {
  firstFrost: string
  lastFrost: string
}

export interface AlmanacData {
  moonPhase: string
  moonIllumination: number
  sunrise: string
  sunset: string
  frostDates: FrostDates
}

export class AlmanacClient {
  private sunriseSunsetUrl = 'https://api.sunrise-sunset.org/json'

  async getFrostDates(lat: number, lon: number): Promise<FrostDates> {
    // Find nearest location in our data
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`
    const frostData = noaaData.frost_dates[key as keyof typeof noaaData.frost_dates]
    
    if (!frostData) {
      // Default to Kansas (center of US) if location not found
      const defaultData = noaaData.frost_dates['39.7456,-97.0892']
      return this.formatFrostDates(defaultData)
    }
    
    return this.formatFrostDates(frostData)
  }

  async getAlmanacData(lat: number, lon: number): Promise<AlmanacData> {
    const frostDates = await this.getFrostDates(lat, lon)
    
    // Fetch sun/moon data
    const url = `${this.sunriseSunsetUrl}?lat=${lat}&lng=${lon}&formatted=0&date=today`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Sunrise-Sunset API error: ${response.status}`)
    }
    
    const data = await response.json()
    const validated = SunriseSunsetResponseSchema.parse(data)
    
    return {
      moonPhase: this.getMoonPhaseName(validated.results.moon_phase),
      moonIllumination: Math.round(validated.results.moon_illumination * 100),
      sunrise: this.formatTime(validated.results.sunrise),
      sunset: this.formatTime(validated.results.sunset),
      frostDates,
    }
  }

  private formatFrostDates(data: { first_frost: string; last_frost: string }): FrostDates {
    const currentYear = new Date().getFullYear()
    const [firstMonth, firstDay] = data.first_frost.split('-').map(Number)
    const [lastMonth, lastDay] = data.last_frost.split('-').map(Number)
    
    return {
      firstFrost: `${currentYear}-${String(firstMonth).padStart(2, '0')}-${String(firstDay).padStart(2, '0')}`,
      lastFrost: `${currentYear}-${String(lastMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }

  private getMoonPhaseName(phase: number): string {
    const phases = [
      { max: 0.0625, name: 'New Moon' },
      { max: 0.1875, name: 'Waxing Crescent' },
      { max: 0.3125, name: 'First Quarter' },
      { max: 0.4375, name: 'Waxing Gibbous' },
      { max: 0.5625, name: 'Full Moon' },
      { max: 0.6875, name: 'Waning Gibbous' },
      { max: 0.8125, name: 'Last Quarter' },
      { max: 0.9375, name: 'Waning Crescent' },
      { max: 1.0, name: 'New Moon' },
    ]
    
    return phases.find(p => phase <= p.max)?.name || 'Unknown'
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`
  }
}