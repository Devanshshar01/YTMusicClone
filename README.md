# YouTube Music App

A minimal YouTube music search and playback app built with Next.js (App Router), TypeScript, Tailwind CSS, and Turbopack.

## Prerequisites
- Node.js 18+ (installed)
- A YouTube Data API v3 key

## Setup
1. Create your environment file from the example:
   ```bash
   cp .env.local.example .env.local
   ```
2. Set your API key in `.env.local`:
   ```bash
   YOUTUBE_API_KEY={{YOUR_YOUTUBE_DATA_API_KEY}}
   ```

## Development (with Turbopack)
```bash
npm run dev
```
Open http://localhost:3000 to use the app.

## Build
```bash
npm run build
```

## How it works
- Server route at `src/app/api/search/route.ts` proxies requests to the YouTube Data API v3 Search endpoint and returns simplified results.
- Client UI at `src/app/page.tsx` provides a search box, a results list, and an embedded YouTube player (`react-youtube`).

## Notes
- Do not commit your real `.env.local`. Use `.env.local.example` to share required variables.
- Remember to abide by YouTube API quota and terms.
