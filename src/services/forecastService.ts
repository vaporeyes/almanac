// ABOUTME: Aggregation service that combines weather and almanac data into a unified forecast
// ABOUTME: Provides complete forecast data with current conditions, hourly temps, and frost dates

import { WeatherClient, CurrentConditions, HourlyForecast } from '../lib/weatherClient'
import { AlmanacClient, AlmanacData } from '../lib/almanacClient'

export interface CompleteForecast {
  current: CurrentConditions
  forecast: {
    hourlyTemps: number[]
    dailyHigh: number
    dailyLow: number
  }
  almanac: {
    moonPhase: string
    moonIllumination: number
    sunrise: string
    sunset: string
  }
  frostDates: {
    firstFrost: string
    lastFrost: string
    daysUntilFirstFrost: number
    daysSinceLastFrost: number
  }
}

export class ForecastService {
  constructor(
    private weatherClient: WeatherClient,
    private almanacClient: AlmanacClient
  ) {}

  async getCompleteForecast(lat: number, lon: number): Promise<CompleteForecast> {
    try {
      // Fetch all data in parallel for better performance
      const [currentConditions, hourlyForecast, almanacData] = await Promise.all([
        this.fetchCurrentConditions(lat, lon),
        this.weatherClient.getHourlyForecast(lat, lon),
        this.almanacClient.getAlmanacData(lat, lon)
      ])

      return this.mergeData(currentConditions, hourlyForecast, almanacData)
    } catch (error) {
      console.error('Error fetching forecast data:', error)
      // Return partial data if some requests fail
      const hourlyForecast = await this.weatherClient.getHourlyForecast(lat, lon).catch(() => ({ temps: [60] }))
      const almanacData = await this.almanacClient.getAlmanacData(lat, lon).catch(() => this.getDefaultAlmanacData())
      
      return this.mergeData(this.getDefaultCurrentConditions(), hourlyForecast, almanacData)
    }
  }

  private async fetchCurrentConditions(lat: number, lon: number): Promise<CurrentConditions> {
    try {
      return await this.weatherClient.getCurrentConditions(lat, lon)
    } catch (error) {
      console.error('Error fetching current conditions:', error)
      return this.getDefaultCurrentConditions()
    }
  }

  private mergeData(
    current: CurrentConditions,
    forecast: HourlyForecast,
    almanac: AlmanacData
  ): CompleteForecast {
    const temps = forecast.temps
    const dailyHigh = Math.max(...temps)
    const dailyLow = Math.min(...temps)

    const { firstFrost, lastFrost } = almanac.frostDates
    const today = new Date()
    const firstFrostDate = new Date(firstFrost)
    const lastFrostDate = new Date(lastFrost)

    // Calculate days until/since frost
    const daysUntilFirstFrost = this.calculateDaysBetween(today, firstFrostDate)
    const daysSinceLastFrost = this.calculateDaysBetween(lastFrostDate, today)

    return {
      current,
      forecast: {
        hourlyTemps: temps,
        dailyHigh,
        dailyLow,
      },
      almanac: {
        moonPhase: almanac.moonPhase,
        moonIllumination: almanac.moonIllumination,
        sunrise: almanac.sunrise,
        sunset: almanac.sunset,
      },
      frostDates: {
        firstFrost,
        lastFrost,
        daysUntilFirstFrost: daysUntilFirstFrost > 0 ? daysUntilFirstFrost : 0,
        daysSinceLastFrost: daysSinceLastFrost > 0 ? daysSinceLastFrost : 0,
      },
    }
  }

  private calculateDaysBetween(date1: Date, date2: Date): number {
    const diffTime = date2.getTime() - date1.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private getDefaultCurrentConditions(): CurrentConditions {
    return {
      temperature: 0,
      description: 'Data unavailable',
      humidity: 0,
      windSpeed: 0,
      windDirection: 'N',
    }
  }

  private getDefaultAlmanacData(): AlmanacData {
    const currentYear = new Date().getFullYear()

    return {
      moonPhase: 'Unknown',
      moonIllumination: 0,
      sunrise: '6:00 AM',
      sunset: '6:00 PM',
      frostDates: {
        firstFrost: `${currentYear}-10-15`,
        lastFrost: `${currentYear}-04-15`,
      },
    }
  }
}
