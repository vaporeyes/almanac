// ABOUTME: API endpoint for complete forecast data including weather and almanac
// ABOUTME: Accepts lat/lon query parameters and returns aggregated forecast data

import { NextRequest, NextResponse } from 'next/server'
import { ForecastService } from '@/services/forecastService'
import { WeatherClient } from '@/lib/weatherClient'
import { AlmanacClient } from '@/lib/almanacClient'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat and lon' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates: lat and lon must be numbers' },
        { status: 400 }
      )
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude: must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude: must be between -180 and 180' },
        { status: 400 }
      )
    }

    const weatherClient = new WeatherClient()
    const almanacClient = new AlmanacClient()
    const forecastService = new ForecastService(weatherClient, almanacClient)

    const forecast = await forecastService.getCompleteForecast(latitude, longitude)

    return NextResponse.json(forecast, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in forecast endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forecast data' },
      { status: 500 }
    )
  }
}