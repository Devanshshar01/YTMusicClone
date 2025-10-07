# YouTube Music Clone

This is a YouTube Music clone built with Next.js 15.5.4, React, and TypeScript.

## Files Included

1. `package.json` - Project dependencies and scripts
2. `tsconfig.json` - TypeScript configuration
3. `next.config.ts` - Next.js configuration
4. `eslint.config.mjs` - ESLint configuration
5. `postcss.config.mjs` - PostCSS configuration
6. `jsconfig.json` - JavaScript configuration
7. `ytmusic-server.mjs` - YouTube Music API server script
8. `main_page.tsx` - Main application page with UI and player
9. `layout.tsx` - Application layout
10. `globals.css` - Global styles and CSS
11. `api_search_route.ts` - API search endpoint
12. `api_ytmusic_route.ts` - YouTube Music API endpoint

## Setup Instructions

1. Create a new Next.js project:
   ```bash
   npx create-next-app@latest yt-music-app
   cd yt-music-app
   ```

2. Replace the default files with the provided files:
   - Copy `package.json` and run `npm install`
   - Copy the configuration files (`tsconfig.json`, `next.config.ts`, etc.)
   - Create the `src/app` directory structure and copy the source files
   - Create the `src/app/api` directory structure and copy the API route files
   - Copy the `scripts` directory and its contents

3. Install additional dependencies:
   ```bash
   npm install react-youtube ytmusic-api axios
   npm install --save-dev @types/react-youtube
   ```

4. Create a `.env.local` file in the root directory with your YouTube API key:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Start the YouTube Music API server (in a separate terminal):
   ```bash
   npm run ytmusic
   ```

3. Open your browser to http://localhost:3000

## Features

- Search for songs, albums, and artists
- Play music with a custom player
- Glass effect player UI
- Dark/light mode toggle
- Recently searched items
- Popular songs section
- Progress bar with seeking functionality
- Responsive design for all screen sizes

## API Endpoints

- `/api/search` - General search endpoint
- `/api/ytmusic` - YouTube Music specific endpoint

The application uses the YouTube Data API v3 and ytmusic-api for music data and playback.