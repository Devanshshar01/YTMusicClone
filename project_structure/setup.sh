#!/bin/bash

# Setup script for YouTube Music Clone

echo "Setting up YouTube Music Clone..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    echo "# YouTube API Key" > .env.local
    echo "YOUTUBE_API_KEY=your_youtube_api_key_here" >> .env.local
    echo ""
    echo "Please update the YOUTUBE_API_KEY in .env.local with your actual YouTube API key"
fi

echo ""
echo "Setup complete!"
echo ""
echo "To run the application locally:"
echo "1. Start the development server: npm run dev"
echo "2. Start the YouTube Music API server (in a separate terminal): npm run ytmusic"
echo "3. Open your browser to http://localhost:3000"
echo ""
echo "To deploy to Netlify:"
echo "1. Push your code to a GitHub repository"
echo "2. Connect the repository to Netlify"
echo "3. Netlify will automatically use the netlify.toml configuration"
echo "   - Build command: npm run build"
echo "   - Publish directory: out"