# Veilo

A web and image search app that keeps returning results when an upstream search provider fails.

**Live:** https://private-search-buddy.vercel.app

## How it works

Every search runs server-side (TanStack Start server functions), so no API key ever reaches the browser.

1. **Input validation.** The query, page, time range, region and safe-search flag are validated with Zod before any provider is called (`src/lib/search.functions.ts`).
2. **Provider fallback chain** (`src/lib/search.server.ts`). Each provider is tried in order. If it throws or returns a non-2xx status, the error is logged and the next one is tried:
   1. a self-hosted **SearXNG** instance (Docker, see `searxng/`)
   2. **Brave Search API**
   3. **Serper** (Google results)
   4. **Open sources**: DuckDuckGo Instant Answers and Wikipedia, queried in parallel and de-duplicated by URL

   A provider whose key or URL is not configured is skipped.
3. **Filter translation.** Time range and region are mapped to each provider's own format, because each one handles them differently.
4. **Image search** falls back the same way: SearXNG, then Serper Images, then Openverse.
5. The response records which provider answered and how long it took. Where a provider supplies them, the UI also shows an answer box, related searches and "did you mean" suggestions.

## Stack

React, TypeScript, TanStack Start and Router, Zod, Tailwind CSS. Deployed on Vercel. Optional SearXNG runs in Docker.

## Running locally

```bash
cp .env.example .env        # add SERPER_API_KEY, BRAVE_SEARCH_API_KEY and/or SEARXNG_URL
npm install
npm run dev
```

Optional private SearXNG:

```bash
cd searxng
cp settings.example.yml settings.yml   # set a random secret_key: openssl rand -hex 32
docker compose up -d                   # then SEARXNG_URL=http://localhost:8888
```

## Security note

API keys are read only in server code via `process.env`. Never prefix them with `VITE_`: Vite inlines any `VITE_` variable into the browser bundle. An early version did this, and the key was rotated and moved server-side.

## Known limitations and next steps

- No per-request timeout yet: a provider that hangs delays the chain instead of failing over. Next: `AbortSignal.timeout()` on every fetch.
- A provider that returns HTTP 200 with zero results is treated as success. Next: treat empty results as a soft failure and fall through.
- Provider responses are type-cast, not validated at runtime. Next: Zod schemas for each provider's response, so a changed API fails loudly instead of rendering blanks.
- No automated tests yet. Next: unit tests for the filter translation and the fallback order.
