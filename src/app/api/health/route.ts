// ABOUTME: Health check endpoint for monitoring API availability
// ABOUTME: Returns { ok: true } to indicate the service is healthy

import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  return NextResponse.json({ ok: true })
}