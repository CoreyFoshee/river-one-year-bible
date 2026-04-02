# Daily Bible Reading — The River Church

A small static site that shows **daily readings** from `Assets/One Year Bible Master File.csv`, loads verse text from **API.Bible** (NIV) through a **serverless function** so your API key never ships to the browser.

## Prerequisites

- Node 20+
- [Netlify CLI](https://docs.netlify.com/cli/get-started/) (optional, for local functions + deploy)
- An [API.Bible](https://scripture.api.bible/) API key

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: set API_BIBLE_KEY (and optionally BIBLE_ID, VITE_PUBLIC_TIMEZONE)
```

`npm run build` runs `scripts/build-schedule.mjs`, which reads the CSV and writes `public/data/schedule.json`.

## Local development

**Full stack (recommended):** runs Vite and Netlify Functions together.

```bash
netlify dev
```

Open the URL Netlify prints (often `http://localhost:8888`). Set `API_BIBLE_KEY` in `.env` first.

**Frontend only** (`npm run vite` / `npm run dev`): the schedule loads, but `/api/passage` will fail unless you also run `netlify dev` or proxy to a deployed API.

## Deploy on Netlify

1. Push this folder to a Git host and connect the repo to Netlify, **or** drag-and-drop the `dist` folder after `npm run build` (functions still need a proper Netlify deploy with the repo).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables in the Netlify UI:
   - `API_BIBLE_KEY` — required
   - `BIBLE_ID` — optional; default is **NIV 2011** (`78a9f6124f344018-01` for most keys). If you previously set `BIBLE_ID` to **`de4e12af7f28f599-01` or `…-02`**, remove it or change it: those ids are **KJV** on API.Bible. The server also ignores those two ids and uses NIV so old Netlify env mistakes don’t stick.
   - `VITE_PUBLIC_TIMEZONE` — optional (default `America/Indiana/Indianapolis`)

### Custom domain

Add your domain (e.g. `readings.theriver.cc`) under **Domain management** and follow Netlify DNS instructions.

## Query string

- `?date=YYYY-MM-DD` — open a specific calendar day (useful for testing and sharing).

## Subsplash / website embed

```html
<iframe
  src="https://YOUR_SITE.netlify.app"
  title="Daily Bible Reading"
  style="width:100%;min-height:800px;border:0;"
  loading="lazy"
></iframe>
```

## Legal

- Scripture text and copyright lines come from API.Bible responses; display them as provided.
- Follow [API.Bible terms](https://scripture.api.bible/) for your key and translation.

## CSV notes

- Dates use `September` except `Sept.` in the source file; the build script normalizes that.
- `February 29` uses the same readings as February 28.
- The Psalms column typo `Pslam` on one row is corrected when building the schedule.
