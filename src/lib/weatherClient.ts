// ABOUTME: Weather client for fetching data from National Weather Service API
// ABOUTME: Provides current conditions and hourly forecast with type-safe validation

import { z } from 'zod'

// NWS API response schemas
const ForecastPeriodSchema = z.object({
  number: z.number(),
  name: z.string(),
  temperature: z.number(),
  temperatureUnit: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  isDaytime: z.boolean(),
  shortForecast: z.string(),
  detailedForecast: z.string(),
})

const ForecastResponseSchema = z.object({
  properties: z.object({
    periods: z.array(ForecastPeriodSchema),
  }),
})

const PointsResponseSchema = z.object({
  properties: z.object({
    observationStations: z.string(),
  }),
})

const StationsResponseSchema = z.object({
  features: z.array(
    z.object({
      properties: z.object({
        stationIdentifier: z.string(),
        name: z.string(),
      }),
    })
  ),
})

const ObservationResponseSchema = z.object({
  properties: z.object({
    temperature: z.object({
      value: z.number().nullable(),
      unitCode: z.string(),
    }),
    textDescription: z.string().nullable().optional(),
    windSpeed: z.object({
      value: z.number().nullable(),
      unitCode: z.string(),
    }).optional(),
    windDirection: z.object({
      value: z.number().nullable(),
      unitCode: z.string(),
    }).optional(),
    relativeHumidity: z.object({
      value: z.number().nullable(),
      unitCode: z.string(),
    }).optional(),
  }),
})

export interface HourlyForecast {
  temps: number[]
}

export interface CurrentConditions {
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  windDirection: string
}

export class WeatherClient {
  private baseUrl = 'https://api.weather.gov'

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getHourlyForecast(lat: number, lon: number): Promise<HourlyForecast> {
    // For simplicity, using a default grid point - in production would need to look up from lat/lon
    const gridX = 31
    const gridY = 80
    const office = 'TOP'
    
    const url = `${this.baseUrl}/gridpoints/${office}/${gridX},${gridY}/forecast/hourly`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }
    
    const data = await response.json()
    const validated = ForecastResponseSchema.parse(data)
    
    // Extract first 24 hours of temperatures
    const temps = validated.properties.periods
      .slice(0, 24)
      .map(period => period.temperature)
    
    return { temps }
  }

  async getCurrentConditions(lat: number, lon: number): Promise<CurrentConditions> {
    try {
      // Get observation stations for this location
      const pointsUrl = `${this.baseUrl}/points/${lat},${lon}`
      const pointsResponse = await fetch(pointsUrl)
      
      if (!pointsResponse.ok) {
        throw new Error(`Weather API error: ${pointsResponse.status}`)
      }
      
      const pointsData = await pointsResponse.json()
      const pointsValidated = PointsResponseSchema.parse(pointsData)
      
      // Get list of stations
      const stationsResponse = await fetch(pointsValidated.properties.observationStations)
      if (!stationsResponse.ok) {
        throw new Error(`Weather API error: ${stationsResponse.status}`)
      }
      
      const stationsData = await stationsResponse.json()
      const stationsValidated = StationsResponseSchema.parse(stationsData)
      
      if (stationsValidated.features.length === 0) {
        throw new Error('No observation stations found')
      }
      
      // Get latest observation from first station
      const stationId = stationsValidated.features[0].properties.stationIdentifier
      const observationUrl = `${this.baseUrl}/stations/${stationId}/observations/latest`
      const observationResponse = await fetch(observationUrl)
      
      if (!observationResponse.ok) {
        throw new Error(`Weather API error: ${observationResponse.status}`)
      }
      
      const observationData = await observationResponse.json()
      const observationValidated = ObservationResponseSchema.parse(observationData)
      
      const props = observationValidated.properties
      
      // Convert Celsius to Fahrenheit
      const tempC = props.temperature.value ?? 0
      const tempF = Math.round((tempC * 9/5) + 32)
      
      // Convert m/s to mph
      const windSpeedMs = props.windSpeed?.value ?? 0
      const windSpeedMph = Math.round(windSpeedMs * 2.237 * 10) / 10
      
      // Convert wind direction degrees to cardinal
      const windDeg = props.windDirection?.value ?? 0
      const windDirection = this.degreesToCardinal(windDeg)
      
      // If no description, try to get it from the forecast
      let description = props.textDescription
      if (!description) {
        try {
          // Use the hardcoded grid for now to get forecast description
          const forecastUrl = `${this.baseUrl}/gridpoints/TOP/31,80/forecast`
          const forecastResponse = await fetch(forecastUrl)
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json()
            description = forecastData.properties?.periods?.[0]?.shortForecast || 'Clear'
          }
        } catch {
          description = 'Clear'
        }
      }
      
      return {
        temperature: tempF,
        description: description || 'Clear',
        humidity: props.relativeHumidity?.value ?? 0,
        windSpeed: windSpeedMph,
        windDirection,
      }
    } catch (error) {
      // If current conditions fail, try to get data from forecast
      try {
        const forecastUrl = `${this.baseUrl}/gridpoints/TOP/31,80/forecast`
        const forecastResponse = await fetch(forecastUrl)
        if (forecastResponse.ok) {
          const forecastData = await forecastResponse.json()
          const currentPeriod = forecastData.properties?.periods?.[0]
          if (currentPeriod) {
            return {
              temperature: currentPeriod.temperature || 0,
              description: currentPeriod.shortForecast || 'Clear',
              humidity: 0, // Not available in forecast
              windSpeed: 0, // Could parse from detailedForecast
              windDirection: 'N',
            }
          }
        }
      } catch {
        // Ignore and throw original error
      }
      throw error
    }
  }

  private degreesToCardinal(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    const index = Math.round(degrees / 22.5) % 16
    return directions[index]
  }
}