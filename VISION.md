# Farmer's Almanac Weather App

## Vision
A retro farmer's almanac-style weather application that combines real-time weather data with historical climate information, presented through nostalgic ASCII art interfaces for modern gardeners and weather enthusiasts.

## Tech Stack

| Topic                   | Decision                                              |
| ----------------------- | ----------------------------------------------------- |
| **Monorepo tool**       | `pnpm` workspaces                                     |
| **Frontend**            | Next.js 15 (App Router) + TypeScript                  |
| **Styling**             | Tailwind CSS + `terminal.css` helper                  |
| **Fonts**               | Google Font `VT323`, fallback `monospace`             |
| **Backend**             | Vercel/Cloudflare Edge Functions (`runtime='edge'`)   |
| **Weather API**         | NWS (no key) with OpenWeatherMap as optional fallback |
| **Almanac & ephemeris** | NOAA Climate Normals + Sunrise-Sunset.org             |
| **Cache**               | Upstash Redis (KV)                                    |
| **Testing**             | Vitest (unit) / Playwright (e2e)                      |
| **CI**                  | GitHub Actions → Preview deployments on Vercel        |
| **Lint/format**         | ESLint + Prettier                                     |
| **Commit hooks**        | Husky for pre-commit test run                         |