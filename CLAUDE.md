# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Almanac is a retro farmer's almanac-style weather application that combines real-time weather data with historical climate information, presented through nostalgic ASCII art interfaces. It uses the National Weather Service (NWS) API and NOAA climate data to provide gardeners and weather enthusiasts with comprehensive weather information.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development server with Turbopack
pnpm dev

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run specific test file
pnpm test src/lib/weatherClient.test.ts

# Lint code
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **UI**: React 19 with Server Components
- **Styling**: Tailwind CSS v4 with custom ASCII theme
- **Testing**: Vitest with React Testing Library
- **Package Manager**: pnpm with workspaces

### Key Architectural Decisions

1. **Edge Runtime**: All API routes use `export const runtime = 'edge'` for optimal performance
2. **Data Validation**: Zod schemas validate all external API responses
3. **No API Keys**: Uses free NWS API (no authentication required)
4. **ASCII Theme**: Custom retro terminal aesthetic with VT323 font and CRT-style effects
5. **TDD Approach**: All components and services have comprehensive test coverage

### Directory Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API routes (all edge runtime)
│   │   ├── health/      # System health check
│   │   ├── weather/     # Current weather endpoint
│   │   ├── forecast/    # Complete forecast with almanac data
│   │   └── almanac/     # Historical climate and moon phases
│   ├── page.tsx         # Home page with weather display
│   └── layout.tsx       # Root layout with font config
├── components/          # Reusable UI components
│   ├── AsciiPanel.tsx   # Retro ASCII-styled container
│   └── SparkTemp.tsx    # ASCII sparkline temperature display
├── lib/                 # Core business logic
│   ├── weatherClient.ts # NWS API integration
│   └── almanacClient.ts # NOAA data and moon calculations
├── services/            # Service layer
│   └── forecastService.ts # Aggregates weather + almanac
├── data/                # Static data files
│   └── noaa_normals.json # Historical climate normals
└── test/                # Test configuration
    └── setup.ts         # Vitest global setup
```

### Data Flow

1. **Weather Data**: `WeatherClient` → NWS API → Grid coordinates → Forecast data
2. **Almanac Data**: `AlmanacClient` → NOAA normals + Moon phase calculations
3. **Aggregation**: `ForecastService` combines both data sources
4. **API Routes**: Edge functions serve data with proper caching headers
5. **UI Components**: Server components render ASCII-styled weather displays

### Testing Patterns

- All files have corresponding `.test.ts` files
- Use `vitest` with `happy-dom` for fast DOM testing
- Test setup includes `@testing-library/jest-dom` matchers
- API routes tested with `NextRequest` mocking
- Services tested with mock clients using Vitest's `vi.fn()`

### Code Conventions

1. **File Headers**: All files must start with `ABOUTME:` comments explaining purpose
2. **Type Safety**: Use Zod schemas for all external data validation
3. **Error Handling**: Return proper HTTP status codes with descriptive error messages
4. **Edge Runtime**: All API routes must specify `export const runtime = 'edge'`
5. **Imports**: Use `@/` alias for src directory imports

### External APIs

- **NWS API**: `https://api.weather.gov` (no key required)
  - Grid endpoint: `/points/{lat},{lon}`
  - Forecast: `/gridpoints/{office}/{gridX},{gridY}/forecast`
  - Current: `/gridpoints/{office}/{gridX},{gridY}/stations`
- **NOAA Climate Normals**: Static data in `src/data/noaa_normals.json`
- **Moon Phases**: Calculated locally using astronomy algorithms

### Current Limitations

- Weather grid coordinates are currently hardcoded (Kansas City area)
- Limited NOAA location data (only major cities)
- No caching layer implemented yet (planned: Upstash Redis)
- No user location detection or settings persistence