// ABOUTME: Tests for GeocodeClient ZIP code and address lookup normalization
// ABOUTME: Mocks external geocoding services to validate parsed coordinates

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GeocodeClient } from './geocodeClient'

describe('GeocodeClient', () => {
  let client: GeocodeClient

  beforeEach(() => {
    client = new GeocodeClient()
    vi.clearAllMocks()
  })

  it('should geocode a five digit ZIP code', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        places: [
          {
            latitude: '34.0901',
            longitude: '-118.4065',
            'place name': 'Beverly Hills',
            state: 'California',
          },
        ],
      }),
    })

    const result = await client.geocode('90210')

    expect(result).toEqual({
      latitude: 34.0901,
      longitude: -118.4065,
      label: 'Beverly Hills, California 90210',
    })
    expect(fetch).toHaveBeenCalledWith('https://api.zippopotam.us/us/90210')
  })

  it('should geocode an address with Census geocoding', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          addressMatches: [
            {
              matchedAddress: '1600 PENNSYLVANIA AVE NW, WASHINGTON, DC, 20500',
              coordinates: {
                x: -77.03535,
                y: 38.898754,
              },
            },
          ],
        },
      }),
    })

    const result = await client.geocode('1600 Pennsylvania Ave NW')

    expect(result).toEqual({
      latitude: 38.898754,
      longitude: -77.03535,
      label: '1600 PENNSYLVANIA AVE NW, WASHINGTON, DC, 20500',
    })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('geocoding.geo.census.gov/geocoder/locations/onelineaddress')
    )
  })

  it('should reject blank locations', async () => {
    await expect(client.geocode('   ')).rejects.toThrow('Location is required')
  })
})
