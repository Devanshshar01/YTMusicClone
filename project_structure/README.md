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

## Deployment to Netlify

This project is configured for deployment to Netlify with the following settings:

- Build command: `npm run build`
- Publish directory: `out`

The project uses the Netlify Next.js plugin for optimal deployment.

## API Endpoints

- `/api/search` - General search endpoint
- `/api/ytmusic` - YouTube Music specific endpoint

The application uses the YouTube Data API v3 and ytmusic-api for music data and playback.