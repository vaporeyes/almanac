// ABOUTME: Tests for geocode API request validation and normalized responses
// ABOUTME: Ensures location lookup errors return clear HTTP status codes

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

vi.mock('@/lib/geocodeClient')

describe('Geocode API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if query is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/geocode')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required parameter: query')
  })

  it('should return geocoded coordinates', async () => {
    const GeocodeClient = vi.mocked(await import('@/lib/geocodeClient')).GeocodeClient
    GeocodeClient.prototype.geocode = vi.fn().mockResolvedValue({
      latitude: 34.0901,
      longitude: -118.4065,
      label: 'Beverly Hills, California 90210',
    })

    const request = new NextRequest('http://localhost:3000/api/geocode?query=90210')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      latitude: 34.0901,
      longitude: -118.4065,
      label: 'Beverly Hills, California 90210',
    })
    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=86400, stale-while-revalidate=604800')
  })

  it('should return 404 if lookup fails', async () => {
    const GeocodeClient = vi.mocked(await import('@/lib/geocodeClient')).GeocodeClient
    GeocodeClient.prototype.geocode = vi.fn().mockRejectedValue(new Error('Address was not found'))

    const request = new NextRequest('http://localhost:3000/api/geocode?query=unknown')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Failed to resolve location')
  })
})
