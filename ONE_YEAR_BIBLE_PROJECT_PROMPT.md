# Cursor / AI prompt — One Year Bible daily reader

Copy everything **below the line** into a new chat when you scaffold this project.

---

## Project goal

Build a **small production web app** that:

1. Shows **today’s Bible readings** from a **CSV schedule** (one row per calendar day; columns will include passage references or enough data to request them).
2. Fetches verse text from **API.Bible** (Scripture API at api.bible / scripture.api.bible), targeting the **NIV** translation **if** available for our API key—otherwise surface a clear error and fallback instructions.
3. Keeps the **API key server-side only** (Next.js Route Handlers, serverless functions, or equivalent)—never expose the key in client-side bundles.
4. Renders a **clean, mobile-friendly** reading page with required **copyright / attribution** per API.Bible response and terms of use.
5. Is **embeddable** on a **Subsplash** church website (theriver.cc) via **iframe**, and works as a standalone URL (HTTPS).

## Non-goals

- Do not store or redistribute full Bible text in a database long-term unless compliant with API terms; prefer fetching from API or caching per their rules.
- Do not commit real API keys or `.env` with secrets.

## Tech preferences

- **Framework:** Next.js (App Router) or similar with easy API routes—pick what keeps the codebase minimal.
- **Styling:** Simple CSS or Tailwind; must be readable on phones (Subsplash iframe).
- **Timezone:** Configurable env var for “today” (e.g. `America/Indiana/Indianapolis` for Marion area)—document default.

## CSV handling

- Assume I will add a file like `data/readings.csv` or import at build time.
- Parse references into API.Bible’s expected **passage ID format** for the chosen `bibleId` (document where to find bible IDs in API.Bible docs).
- Support **query param** `?date=YYYY-MM-DD` for testing and sharing a specific day; default to “today” in the configured timezone.

## API integration

- Use HTTP with `api-key` header (or as documented) from **server-side only**.
- Handle rate limits and errors gracefully (user-facing message, retry not required for v1).
- Respect **500 consecutive verses** (or current API limit)—split requests if needed.

## Deployment

- Document **Vercel** (or Netlify) deploy steps, env vars, and custom domain (e.g. readings.theriver.cc).
- Include example **iframe** snippet for Subsplash Custom HTML.

## Deliverables

1. `README.md` with setup, env vars, CSV format example, deploy, legal reminder.
2. `.env.example` with placeholder keys.
3. Working local dev and production build.

## Subsplash embed (target)

```html
<iframe
  src="https://REPLACE_WITH_YOUR_DEPLOYED_URL"
  title="One Year Bible"
  style="width:100%;min-height:800px;border:0;"
  loading="lazy"
></iframe>
```

Start by scaffolding the repo, then implement the schedule loader, API proxy route, and UI page.
