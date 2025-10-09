#!/bin/bash

# YouTube Music Clone Deployment Script

echo "🚀 Starting YouTube Music Clone Deployment Process"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root directory."
  exit 1
fi

echo "✅ Found project files"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if build succeeds
echo "🏗️ Building the application..."
if npm run build; then
  echo "✅ Build successful"
else
  echo "❌ Build failed. Please check the error messages above."
  exit 1
fi

echo "🎉 Application built successfully!"

echo "📋 Deployment Options:"
echo "   1. Vercel (RECOMMENDED - Full functionality):"
echo "      - Sign up at vercel.com"
echo "      - Install Vercel CLI: npm install -g vercel"
echo "      - Run: vercel"
echo "      - Add your YOUTUBE_API_KEY as an environment variable"
echo ""
echo "   2. Netlify (Full functionality):"
echo "      - Sign up at netlify.com"
echo "      - Connect your GitHub repository"
echo "      - Set build command to: npm run build"
echo "      - Add your YOUTUBE_API_KEY as an environment variable"
echo ""
echo "   3. GitHub Pages (LIMITED - Static hosting only):"
echo "      - Does NOT support API routes or server-side functionality"
echo "      - For full functionality, use Vercel or Netlify"

echo "🔐 IMPORTANT: You must have a YouTube Data API v3 key for the application to work!"
echo "📖 Check DEPLOYMENT-GUIDE.md for detailed instructions."