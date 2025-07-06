Below is a self-contained **Prompt Plan** you can hand to a developer **or** use verbatim with an LLM “build-agent.”
It walks through the entire weather + Farmer’s-Almanac app in **discrete, test-driven stages**.
Everything is framed as:

* **User Story** (business value)
* **Red → Green** (write failing test, then implement)
* **Artifacts** (files / commands the step should touch)

Feel free to copy-paste each block one-at-a-time into your agent; every step is purposely small and independent.

---

## Global Conventions

| Topic                   | Decision                                              |
| ----------------------- | ----------------------------------------------------- |
| **Monorepo tool**       | `pnpm` workspaces                                     |
| **Frontend**            | Next.js 15 (App Router) + TypeScript                  |
| **Styling**             | Tailwind CSS +                                        |
| `terminal.css` helper   |                                                       |
| **Fonts**               | Google Font `VT323`, fallback `monospace`             |
| **Backend**             | Vercel/Cloudflare Edge Functions (`runtime='edge'`)   |
| **Weather API**         | NWS (no key) with OpenWeatherMap as optional fallback |
| **Almanac & ephemeris** | NOAA Climate Normals + Sunrise-Sunset.org             |
| **Cache**               | Upstash Redis (KV)                                    |
| **Testing**             | Vitest (unit) / Playwright (e2e)                      |
| **CI**                  | GitHub Actions → Preview deployments on Vercel        |
| **Lint/format**         | ESLint + Prettier                                     |
| **Commit hooks**        | Husky for pre-commit test run                         |

---

## Prompt Plan (TDD roadmap)

> **Step 0 – Vision Check**
> *“As a stakeholder I want a one-sentence elevator pitch.”*
> **Action:** Write `VISION.md` containing the pitch + tech stack table above. No tests.

---

### 1. Repo & CI Skeleton

**User Story**
“As a dev I want the repo to run `pnpm test` on every push so we have a red/green dashboard.”

| Task      | What to do                                                                                  |
| --------- | ------------------------------------------------------------------------------------------- |
| **Red**   | Add `api/health.test.ts` → expect `GET /api/health` to return `{ ok: true }` (404 for now). |
| **Green** | Implement minimal edge function that returns the JSON.                                      |
| **CI**    | Add `.github/workflows/ci.yml` that runs `pnpm install && pnpm test`.                       |

---

### 2. Weather Client

**User Story**
“As a gardener I need current conditions for a given lat/lon.”

| Phase         | Details                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------- |
| **Red**       | In `lib/weatherClient.test.ts` mock-fetch NWS endpoint, expect temps array length === 24. |
| **Green**     | Build `WeatherClient` with simple fetch + schema validation via `zod`.                    |
| **Artifacts** | `lib/weatherClient.ts`, vitest mock, `.env.example` with NWS gridID override.             |

---

### 3. Almanac Client

**User Story**
“As a gardener I need historical frost dates & moon phase for the same location.”

\| Red | `lib/almanacClient.test.ts` expects `firstFrost < lastFrost` (dummy 0 values). |
\| Green | Implement client:

* NOAA Climate Normals CSV cached in `/data/noaa_normals.json`.
* Call Sunrise-Sunset.org for moon phase. |
  \| Cache | Wrap each fetch in KV LRU (expires 24 h). |

---

### 4. Aggregation Service

Combines Weather + Almanac for UI.

\| Red | `services/forecastService.test.ts` expects merged object `{ current, forecast, frostDates }`. |
\| Green | Implement composition layer; ensure it calls caches. |

---

### 5. Cron Warm-up

**User Story**
“I want the first page load to be instant.”

\| Red | e2e Playwright test measures `/` responseTime < 800 ms (will fail cold). |
\| Green | Add `vercel.json` or CF Cron to hit `/api/prewarm` every 10 min. |

---

### 6. ASCII UI Components

| Component      | Test First                                           |
| -------------- | ---------------------------------------------------- |
| `<AsciiPanel>` | Snapshot test: renders double-border + FIGlet title. |
| `<SparkTemp>`  | Snapshot small unicode sparkline given `[72,71,…]`.  |

Use `figlet.js`, `ascii-charts`, and Tailwind utilities (`font-vt323`, `border-double`, `leading-tight`).

---

### 7. Home Page Layout

**Red**
Playwright test: visiting `/` shows “TODAY” FIGlet header and today’s max/min temps.

**Green**
Server Component fetches from `forecastService` and plugs into `<AsciiPanel>` blocks:

```
┌──────────── TODAY ────────────┐
│  82°F ↑ / 68°F ↓              │
├───────────────────────────────┤
│  Sunrise 05:42  ☾ Waxing Gibb │
├───────────────────────────────┤
│  Next frost ≈ Nov 10          │
└───────────────────────────────┘
```

---

### 8. Retro Theme Polish

* Add `globals.css` dark CRT theme (`bg-black text-green-400` + scan-line pseudo-el).
* Accessibility test: axe rule violations = 0.
* Favicon: 16×16 ASCII art 🌱.

---

### 9. PWA & Offline

**Red**
Playwright (offline emulation) still sees cached panel.

**Green**
`next-pwa` with Workbox routes:

* `CacheFirst` for almanac endpoints
* `NetworkFirst` for weather → fallback to last successful response in KV.

---

### 10. Deployment & Smoke Test

* Merge to `main` → GitHub Action deploys to Vercel.
* Playwright smoke on preview URL: 200 status & FIGlet banner present.

---

## How to Use This Plan with an LLM Agent

1. **Feed one step at a time** – wait for the agent to return PR-ready code + passing tests.
2. **Review snapshot outputs** to make sure ASCII art stays readable.
3. **Iterate**: once green, move to the next numbered step.
4. **Guardrails**: Each commit must leave `pnpm test` and `pnpm lint` green.

---

### Extension Ideas (post-MVP)

* ⚙ **User settings page** – choose location & units; store in localStorage.
* 📨 **Email digest** – daily ASCII forecast via AWS SES.
* 🎛 **E-ink dashboard mode** – auto-rotate view every minute for 7″ Waveshare display.
