// ABOUTME: Test for health endpoint - ensures API is responding correctly
// ABOUTME: Tests GET /api/health returns { ok: true } response

import { describe, it, expect } from 'vitest'
import { GET } from './health/route'

describe('Health Endpoint', () => {
  it('should return { ok: true } for GET /api/health', async () => {
    const response = await GET()
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual({ ok: true })
  })
})