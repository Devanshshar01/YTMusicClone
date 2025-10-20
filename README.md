# YouTube Music Clone - Enhanced Edition

A feature-rich YouTube Music clone built with Next.js 15.5.4, React, and TypeScript, with a beautiful modern UI and comprehensive music playback features.

## ✨ Key Features

### 🎨 Visual Design & UI
- **Modern Gradient Design**: Beautiful gradient backgrounds, cards with glass effects
- **Smooth Animations**: Hover effects, transitions, and micro-interactions
- **Dark/Light Mode**: Seamless theme switching with localStorage persistence
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Card Hover Effects**: Interactive album art with scale and overlay effects

### 🎵 Playback Features
- **Full-Screen Player**: Immersive now-playing view with rotating album art and glow effects
- **Queue Management**: Add, remove, view, and manage your playback queue
- **Shuffle & Repeat**: Working shuffle mode and repeat modes (off, all, one)
- **Precision Control**: Skip forward/backward 10 seconds, seek anywhere in the track
- **Progress Bar**: Click to seek, real-time progress tracking
- **Volume Control**: Adjustable volume with visual slider

### 📱 Mobile Experience
- **Swipe Gestures**: Swipe left/right on the player to skip tracks
- **Touch Optimized**: Large touch targets and mobile-friendly controls
- **Bottom Navigation**: Easy access to Home, Explore, and Library
- **Pull-to-Refresh Ready**: Smooth scrolling and optimized performance

### ⌨️ Keyboard Shortcuts
- `Space` - Play/Pause
- `→` / `←` - Skip forward/backward 10 seconds
- `Shift + →` / `Shift + ←` - Next/Previous track
- `↑` / `↓` - Volume up/down
- `S` - Toggle shuffle
- `R` - Cycle repeat modes
- `L` - Like/Unlike current song
- `F` - Toggle full-screen player
- `M` - Toggle mini player
- `?` - Show keyboard shortcuts help

### 🎯 User Features
- **Search Suggestions**: Real-time search suggestions as you type
- **Recently Played**: Auto-tracked listening history
- **Liked Songs**: Save your favorite tracks
- **Custom Playlists**: Create and manage your own playlists
- **Share Songs**: Share tracks via native share or copy link
- **Toast Notifications**: User-friendly feedback for all actions

### 🔄 Smart Features
- **Auto-Play**: Seamlessly plays related songs when your queue ends
- **LocalStorage**: Saves your preferences, playlists, and history
- **Popular Recommendations**: Discover trending music
- **Filter Results**: Filter search by songs, videos, artists, or albums

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

## 🎮 Usage Tips

### Desktop
- Use keyboard shortcuts for quick navigation (press `?` to see all shortcuts)
- Hover over song cards to see quick action buttons
- Click the full-screen button in the player for an immersive experience
- Use the queue button to manage your playback order

### Mobile
- Swipe left/right on the player to skip tracks
- Tap the bottom navigation to switch between views
- Long-press song cards for more options
- Use the mobile menu (☰) to access the sidebar

## 🛠️ Technology Stack

- **Framework**: Next.js 15.5.4 (React 19.1.0)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Video Player**: React YouTube (YouTube IFrame API)
- **Music Data**: ytmusic-api
- **State Management**: React Hooks (useState, useEffect, useRef)
- **Storage**: LocalStorage for persistence

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px
- Wide Desktop: > 1536px

## 🎨 Design Philosophy

This application follows modern design principles:
- **Minimalism**: Clean interface with focus on content
- **Consistency**: Unified design language across all views
- **Accessibility**: Keyboard navigation and ARIA labels
- **Performance**: Optimized animations and lazy loading
- **User Feedback**: Toast notifications and visual states

## API Endpoints

- `/api/search` - General search endpoint
- `/api/ytmusic` - YouTube Music specific endpoint

The application uses the YouTube Data API v3 and ytmusic-api for music data and playback.

## 📄 License

This is a demo project for educational purposes. All music content is streamed from YouTube and belongs to their respective copyright holders.