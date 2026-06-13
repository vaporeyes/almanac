// ABOUTME: Geocoding client for resolving user-entered ZIP codes and addresses
// ABOUTME: Normalizes external geocoder responses into latitude and longitude

import { z } from 'zod'

const ZIP_CODE_PATTERN = /^\d{5}$/

const ZipPlaceSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
  'place name': z.string(),
  state: z.string(),
})

const ZipResponseSchema = z.object({
  places: z.array(ZipPlaceSchema).min(1),
})

const CensusResponseSchema = z.object({
  result: z.object({
    addressMatches: z.array(
      z.object({
        matchedAddress: z.string(),
        coordinates: z.object({
          x: z.number(),
          y: z.number(),
        }),
      })
    ),
  }),
})

export interface GeocodeResult {
  latitude: number
  longitude: number
  label: string
}

export class GeocodeClient {
  async geocode(query: string): Promise<GeocodeResult> {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
      throw new Error('Location is required')
    }

    if (ZIP_CODE_PATTERN.test(normalizedQuery)) {
      return this.geocodeZipCode(normalizedQuery)
    }

    return this.geocodeAddress(normalizedQuery)
  }

  private async geocodeZipCode(zipCode: string): Promise<GeocodeResult> {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`)

    if (!response.ok) {
      throw new Error('ZIP code was not found')
    }

    const data = ZipResponseSchema.parse(await response.json())
    const place = data.places[0]

    return {
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      label: `${place['place name']}, ${place.state} ${zipCode}`,
    }
  }

  private async geocodeAddress(address: string): Promise<GeocodeResult> {
    const params = new URLSearchParams({
      address,
      benchmark: 'Public_AR_Current',
      format: 'json',
    })
    const response = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error('Address lookup failed')
    }

    const data = CensusResponseSchema.parse(await response.json())
    const match = data.result.addressMatches[0]

    if (!match) {
      throw new Error('Address was not found')
    }

    return {
      latitude: match.coordinates.y,
      longitude: match.coordinates.x,
      label: match.matchedAddress,
    }
  }
}
