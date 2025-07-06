// ABOUTME: API endpoint for almanac data including moon phase and frost dates
// ABOUTME: Returns astronomical and climate data for farming/gardening purposes

import { NextRequest, NextResponse } from 'next/server'
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

    const almanacClient = new AlmanacClient()
    const almanacData = await almanacClient.getAlmanacData(latitude, longitude)

    return NextResponse.json(almanacData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache longer for almanac data
      },
    })
  } catch (error) {
    console.error('Error in almanac endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch almanac data' },
      { status: 500 }
    )
  }
}