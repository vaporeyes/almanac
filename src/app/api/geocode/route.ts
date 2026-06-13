// ABOUTME: API endpoint for resolving user-entered locations to coordinates
// ABOUTME: Accepts ZIP codes or addresses and returns a normalized location result

import { NextRequest, NextResponse } from 'next/server'
import { GeocodeClient } from '@/lib/geocodeClient'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('query')?.trim()

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required parameter: query' },
        { status: 400 }
      )
    }

    const geocodeClient = new GeocodeClient()
    const location = await geocodeClient.geocode(query)

    return NextResponse.json(location, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    })
  } catch (error) {
    console.error('Error in geocode endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to resolve location' },
      { status: 404 }
    )
  }
}
