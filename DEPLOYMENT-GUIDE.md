# Deployment Guide for YouTube Music Clone

This guide will help you deploy your YouTube Music Clone application to various platforms.

## Prerequisites

1. Ensure you have built the application successfully:
   ```bash
   npm run build
   ```

2. Make sure your `.env.local` file contains your YouTube API key:
   ```
   YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

## Deployment Options

### 1. Deploy to Vercel (Recommended)

Vercel is the best platform for Next.js applications and offers seamless deployment with full support for API routes.

1. Sign up at [vercel.com](https://vercel.com)
2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy from the command line:
   ```bash
   vercel
   ```
4. Follow the prompts to configure your project
5. When asked for environment variables, add your `YOUTUBE_API_KEY`

### 2. Deploy to Netlify

This project is already configured for Netlify deployment with full API route support.

1. Sign up at [netlify.com](https://netlify.com)
2. Connect your GitHub repository or drag and drop your project folder
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `.next/standalone` (or follow Netlify's Next.js plugin instructions)
4. Add your environment variables in the Netlify dashboard:
   - Key: `YOUTUBE_API_KEY`
   - Value: your actual YouTube API key

### 3. Deploy to GitHub Pages (Static Hosting Only)

GitHub Pages is a free static hosting service, but it has limitations:
- **Does NOT support API routes** (server-side functionality)
- **Does NOT support server-side environment variables**

If you want to deploy to GitHub Pages, you have two options:

#### Option A: Client-Side Only Version (Limited Functionality)
1. Modify the application to use client-side API calls directly to YouTube
2. Remove all server-side API routes
3. This will limit functionality but allow static deployment

#### Option B: Use Vercel or Netlify (Recommended)
These platforms fully support Next.js applications with API routes and server-side functionality.

### 4. Self-Hosted Deployment

For self-hosted deployment, you'll need to run both the Next.js application and the YouTube Music API server.

1. Build the application:
   ```bash
   npm run build
   ```
2. Start the application:
   ```bash
   npm start
   ```
3. In a separate terminal, start the YouTube Music API server:
   ```bash
   npm run ytmusic
   ```

## Environment Variables

Make sure to set the following environment variables on your deployment platform:

- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key

## Troubleshooting

1. **API Routes Not Working**: If deploying to a static hosting service, make sure you're using a platform that supports serverless functions (Vercel, Netlify, etc.)

2. **Environment Variables**: Ensure all environment variables are correctly set in your deployment platform's dashboard.

3. **Build Errors**: Make sure all dependencies are correctly installed and your Node.js version is compatible (Node 18+ recommended).

4. **GitHub Pages Deployment**: 
   - Make sure your repository is public
   - GitHub Pages doesn't support server-side functionality
   - Consider using Vercel or Netlify for full functionality

## Support

If you encounter any issues during deployment, check the Next.js documentation or reach out to the platform's support team.