# 🎵 YT Music Clone - Complete Setup Guide

A modern, feature-rich YouTube Music clone with Supabase authentication, PWA support, and advanced playback features.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (specified in `.nvmrc`)
- npm or yarn
- Supabase account (free tier available)
- YouTube Data API key (free tier available)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Run development server
npm run dev
```

## 🔐 Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# Optional: YouTube Music API cookies
YTMUSIC_COOKIES="optional-cookie-string"
```

### Getting Your API Keys

#### 1. Supabase Setup

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

#### 2. Run Supabase Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the SQL in `supabase/migrations/20251024181553_create_auth_tables.sql` in the Supabase SQL editor.

#### 3. YouTube Data API v3

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable "YouTube Data API v3"
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key → `YOUTUBE_API_KEY`
6. (Optional) Restrict the key to YouTube Data API v3

⚠️ **Note**: Free tier has 10,000 units/day quota. Each search costs ~100 units.

#### 4. NextAuth Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET`.

## 🗄️ Database Schema

The app uses Supabase with the following tables:

- **users**: User profiles (synced with Supabase Auth)
- **accounts**: OAuth provider accounts
- **sessions**: NextAuth sessions
- **verification_tokens**: Email verification

Row Level Security (RLS) is enabled on all tables.

## ✨ Features

### Authentication
- ✅ Email/password signup and login
- ✅ Supabase Auth integration
- ✅ Session management with NextAuth
- ✅ Protected routes

### Music Playback
- ✅ YouTube player integration
- ✅ Queue management (add, remove, clear)
- ✅ Shuffle and repeat modes
- ✅ Volume control with mute
- ✅ Seek forward/backward
- ✅ Progress tracking
- ✅ Full-screen mode

### Search & Discovery
- ✅ YouTube Music API integration
- ✅ YouTube Data API fallback
- ✅ Search suggestions
- ✅ Related songs
- ✅ Popular recommendations

### User Experience
- ✅ Dark/Light mode toggle
- ✅ Keyboard shortcuts (press `?` to view)
- ✅ Media session integration (lock screen controls)
- ✅ Toast notifications
- ✅ Responsive design
- ✅ Mobile gestures (swipe to skip)
- ✅ PWA support (installable)

### Advanced Features
- ✅ Lyrics display (with fallback)
- ✅ Recently played history
- ✅ Liked songs collection
- ✅ Custom playlists
- ✅ Share functionality
- ✅ LocalStorage persistence

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `→` | Seek forward 5s |
| `←` | Seek backward 5s |
| `↑` | Volume up |
| `↓` | Volume down |
| `N` | Next track |
| `P` | Previous track |
| `S` | Toggle shuffle |
| `R` | Cycle repeat |
| `L` | Like song |
| `F` | Full screen |
| `Q` | Toggle queue |
| `?` | Show shortcuts |

## 📱 PWA Installation

The app is installable as a Progressive Web App:

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or go to Settings → Install app

Features when installed:
- Standalone window
- App icon on home screen
- Offline support (coming soon)
- Media controls on lock screen
- Background playback

## 🔧 Development

### Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run standalone YT Music API server
npm run ytmusic
```

### Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication
│   │   ├── lyrics/    # Lyrics fetching
│   │   ├── search/    # YouTube search
│   │   └── ytmusic/   # YT Music API
│   ├── login/         # Login page
│   ├── signup/        # Signup page
│   └── page.tsx       # Main player
├── components/
│   ├── KeyboardShortcutsModal.tsx
│   ├── ShareButton.tsx
│   ├── SessionProvider.tsx
│   ├── Toast.tsx
│   └── UserMenu.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   ├── useLocalStorage.ts
│   ├── useMediaSession.ts
│   └── useToast.ts
├── lib/
│   ├── apiClient.ts      # API utilities
│   ├── auth.ts           # NextAuth config
│   ├── lyricsUtils.ts    # Lyrics fetching
│   ├── supabase.ts       # Client-side Supabase
│   ├── supabaseServer.ts # Server-side Supabase
│   └── ytmusicUtils.ts   # YT Music utilities
└── types/
    └── music.ts          # Type definitions
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)
- `YOUTUBE_API_KEY`

## 🐛 Troubleshooting

### Build Errors

**Error: Missing environment variables**
- Ensure all required vars are in `.env.local`
- Restart dev server after adding vars

**Error: Cannot find module '@supabase/supabase-js'**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors about 'node10' moduleResolution**
- Already fixed in `tsconfig.json` to use `bundler`

### Runtime Issues

**Supabase Auth errors**
- Verify your Supabase URL and keys
- Check that migrations have been run
- Ensure service role key is set (server-side only)

**YouTube API quota exceeded**
- Free tier: 10,000 units/day
- Each search: ~100 units
- Consider caching results
- Use YT Music API as fallback (no quota)

**Media not playing**
- Check browser console for errors
- Verify video ID is valid
- Some videos may be region-restricted

## 📊 Recent Fixes Applied

### ✅ Fixed Issues

1. **Supabase Client Error Handling**
   - Added proper env validation with descriptive errors
   - Created separate server-side client with service role

2. **Authentication System**
   - Migrated from bcrypt to Supabase Auth
   - Fixed signup to use Supabase's built-in auth
   - Improved session handling

3. **Package Version Conflicts**
   - Downgraded TailwindCSS from v4 alpha to v3 stable
   - Fixed PostCSS config for compatibility
   - Updated tsconfig moduleResolution

4. **Lyrics API**
   - Replaced `AbortSignal.timeout` with `AbortController`
   - Better error handling and fallbacks
   - Improved timeout messaging

5. **Project Structure**
   - Removed duplicate `flat_structure/` and `project_structure/` folders
   - Cleaned up clutter

6. **Environment Configuration**
   - Updated `.env.example` with all required variables
   - Added detailed documentation
   - Included YouTube API key requirement

### 🆕 New Features Added

1. **PWA Support**
   - Added `manifest.json`
   - Mobile app meta tags
   - Installable as standalone app

2. **Media Session API**
   - Lock screen controls
   - `useMediaSession` hook
   - Background playback support

3. **Keyboard Shortcuts Modal**
   - Visual shortcut reference
   - Categorized commands
   - Press `?` to view

4. **Toast Notifications**
   - Reusable Toast component
   - Multiple types (success, error, info, warning)
   - Auto-dismiss

5. **Share Functionality**
   - Native Web Share API
   - Clipboard fallback
   - ShareButton component

## 📝 License

MIT License - feel free to use for learning and personal projects.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Support

For issues and questions:
- Check this guide first
- Search existing GitHub issues
- Create a new issue with details

---

**Happy listening! 🎵**
