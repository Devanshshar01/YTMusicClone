# YouTube Music Clone

A YouTube Music clone built with Next.js 15.5.4, React, and TypeScript.

## Features

- Search for songs, albums, and artists
- Play music with a custom player
- Glass effect player UI
- Dark/light mode toggle
- Recently searched items
- Popular songs section
- Progress bar with seeking functionality
- Responsive design for all screen sizes
- Sidebar navigation like real YouTube Music

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file in the root directory with your YouTube API key:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Start the YouTube Music API server (in a separate terminal):
   ```bash
   npm run ytmusic
   ```

## Deployment Options

### Deploy to Vercel (Recommended)
Vercel provides full support for all Next.js features including API routes:
1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Set your `YOUTUBE_API_KEY` as an environment variable
4. Deploy!

### Deploy to Netlify
Netlify also supports Next.js with full API route functionality:
1. Sign up at [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
4. Set your `YOUTUBE_API_KEY` as an environment variable

### Deploy to GitHub Pages (Limited Functionality)
GitHub Pages is a free static hosting service but has limitations:
- Does NOT support API routes (server-side functionality)
- Does NOT support server-side environment variables

For full functionality, we recommend using Vercel or Netlify.

## API Endpoints

- `/api/search` - General search endpoint
- `/api/ytmusic` - YouTube Music specific endpoint

The application uses the YouTube Data API v3 and ytmusic-api for music data and playback.