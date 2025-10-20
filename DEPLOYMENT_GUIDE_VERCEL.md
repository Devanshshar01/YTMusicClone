# Vercel Deployment Guide

This guide will help you deploy your YouTube Music Clone to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Git repository connected to Vercel
3. Environment variables configured

## Environment Variables Required

You need to set these in your Vercel project settings:

### Required:
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key
  - Get it from: https://console.cloud.google.com/apis/credentials

### Optional:
- `YTMUSIC_COOKIES` - YouTube Music cookies for better results (optional)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel will auto-detect Next.js
4. Add environment variables in Settings → Environment Variables
5. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 3: Deploy via Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Every push to main branch auto-deploys

## Configuration Files

- `vercel.json` - Vercel configuration (already included)
- `.vercelignore` - Files to exclude from deployment (already included)
- `next.config.ts` - Next.js configuration

## Build Settings

Vercel automatically detects these from `package.json`:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## Troubleshooting

### Error: "No Output Directory named 'build' found"

**Solution**: This error is now fixed with the included `vercel.json`. Vercel will use `.next` directory automatically.

### Error: "Module not found" or "Cannot find package"

**Solution**: 
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install`
3. Redeploy

### API Routes Not Working

**Solution**: Make sure your environment variables are set in Vercel dashboard under Settings → Environment Variables

### Build Timeout

**Solution**: 
- Check your API usage limits
- Ensure all dependencies are in `package.json`
- Contact Vercel support to increase build timeout

## Performance Tips

1. **Enable Edge Functions** for faster API responses
2. **Use ISR (Incremental Static Regeneration)** for popular pages
3. **Configure Caching** headers for static assets
4. **Enable Image Optimization** (already configured in `next.config.ts`)

## Monitoring

After deployment, monitor your app at:
- Vercel Dashboard: https://vercel.com/dashboard
- Analytics: Available in Vercel dashboard
- Logs: Real-time logs in deployment details

## Custom Domain

To add a custom domain:
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as shown
4. Wait for DNS propagation (can take up to 48 hours)

## Automatic Deployments

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches
- **Pull Requests**: Every PR gets a unique preview URL

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Support: https://vercel.com/support
