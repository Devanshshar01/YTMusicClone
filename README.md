***

# 🎵 YouTube Music Clone - Enhanced Edition

<div align="center">







**A feature-rich, production-grade YouTube Music clone built with Next.js 15.5.4**

[Live Demo](https://yt-music-clone-lime-beta.vercel.app) · [Report Bug](https://github.com/Devanshshar01/YTMusicClone/issues) · [Request Feature](https://github.com/Devanshshar01/YTMusicClone/issues)

</div>

***

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

***

## 🌟 Overview

YouTube Music Clone is a modern, full-featured music streaming application that replicates the core functionality of YouTube Music [5]. Built with cutting-edge web technologies, it delivers a seamless listening experience across all devices with an intuitive interface and powerful playback controls [5].

### Why This Project?

This project demonstrates advanced React patterns, TypeScript implementation, state management, and API integration while providing a production-ready music streaming platform [5]. It showcases modern web development practices including responsive design, accessibility features, and performance optimization [2][3].

### Key Highlights

- **Modern Architecture**: Built on Next.js 15.5.4 with React 19.1.0 and TypeScript for type safety [5]
- **Rich User Experience**: Smooth animations, gesture controls, and keyboard shortcuts [5]
- **Production Ready**: Deployed on Vercel with full functionality and optimized performance [5]
- **Mobile First**: Responsive design with touch-optimized controls and swipe gestures [5]

***

## ✨ Features

### 🎨 User Interface

- **Modern Gradient Design** - Beautiful gradient backgrounds with glass morphism effects [5]
- **Dark/Light Mode** - Seamless theme switching with localStorage persistence [5]
- **Smooth Animations** - Hover effects, transitions, and micro-interactions throughout [5]
- **Responsive Layout** - Optimized for desktop (>1024px), tablet (768-1024px), and mobile (<768px) [5]
- **Interactive Cards** - Album art with scale effects and overlay interactions [5]

### 🎵 Music Playback

- **Full-Screen Player** - Immersive view with rotating album art and glow effects [5]
- **Advanced Queue Management** - Add, remove, reorder, and view your playback queue [5]
- **Shuffle & Repeat Modes** - Working shuffle and repeat (off/all/one) functionality [5]
- **Precision Controls** - Skip forward/backward 10 seconds, seek to any position [5]
- **Volume Control** - Adjustable volume with visual slider interface [5]
- **Auto-Play** - Seamlessly plays related songs when queue ends [5]

### 📱 Mobile Experience

- **Swipe Gestures** - Swipe left/right on player to skip tracks [5]
- **Touch Optimized** - Large touch targets and mobile-friendly controls [5]
- **Bottom Navigation** - Quick access to Home, Explore, and Library sections [5]
- **Responsive Player** - Adapts to different screen sizes and orientations [5]

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause |
| `→` / `←` | Skip forward/backward 10 seconds |
| `Shift + →` / `Shift + ←` | Next/Previous track |
| `↑` / `↓` | Volume up/down |
| `S` | Toggle shuffle |
| `R` | Cycle repeat modes |
| `L` | Like/Unlike current song |
| `F` | Toggle full-screen player |
| `M` | Toggle mini player |
| `?` | Show shortcuts help |

[5]

### 🎯 Smart Features

- **Real-Time Search** - Search suggestions as you type with filter options [5]
- **Recently Played** - Auto-tracked listening history [5]
- **Liked Songs** - Save and manage your favorite tracks [5]
- **Custom Playlists** - Create and organize personal playlists [5]
- **Share Functionality** - Share tracks via native share API or copy link [5]
- **Toast Notifications** - User-friendly feedback for all actions [5]
- **LocalStorage Persistence** - Saves preferences, playlists, and history [5]

***

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 15.5.4 |
| **Frontend** | React 19.1.0, TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Video Player** | React YouTube (YouTube IFrame API) |
| **Music API** | ytmusic-api, YouTube Data API v3 |
| **State Management** | React Hooks (useState, useEffect, useRef) |
| **Storage** | Browser LocalStorage |
| **Deployment** | Vercel |

[5]

***

## 🚀 Getting Started

### Prerequisites

Before running this project, ensure you have the following installed [2][3]:

- Node.js (v18.0 or higher)
- npm or yarn package manager
- YouTube Data API v3 key ([Get one here](https://console.cloud.google.com/apis/credentials))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Devanshshar01/YTMusicClone.git
cd YTMusicClone
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
YOUTUBE_API_KEY=your_youtube_api_key_here
```

4. **Start the development server**

```bash
npm run dev
```

5. **Start the YouTube Music API server** (in a separate terminal)

```bash
npm run ytmusic
```

6. **Open your browser**

Navigate to `http://localhost:3000` to view the application.

[5]

### Troubleshooting

If you encounter issues during setup [2]:

- Ensure your Node.js version is 18.0 or higher
- Verify your YouTube API key is valid and has the correct permissions
- Check that both development servers are running simultaneously
- Clear your browser cache and restart the application

***

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key for fetching music data | Yes |

[5]

### Customization

You can customize various aspects of the application [3]:

- **Theme Colors**: Modify `tailwind.config.js` for custom color schemes
- **API Endpoints**: Update endpoint URLs in `/api` directory
- **Player Settings**: Adjust playback settings in player components
- **Layout**: Modify responsive breakpoints in Tailwind configuration

***

## 🌐 Deployment

### Deploy to Vercel (Recommended)

Vercel provides full support for Next.js features including API routes [5][3]:

1. Sign up at [vercel.com](https://vercel.com)
2. Click "New Project" and import your GitHub repository
3. Configure environment variables:
   - Add `YOUTUBE_API_KEY` in the Environment Variables section
4. Click "Deploy"
5. Your application will be live in minutes!

### Deploy to Netlify

Netlify also supports Next.js with full API functionality [5]:

1. Sign up at [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
4. Add `YOUTUBE_API_KEY` as an environment variable
5. Deploy your application

### GitHub Pages Limitations

GitHub Pages is **not recommended** for this project as it does not support [5]:
- Server-side API routes
- Environment variables
- Dynamic server functionality

For full functionality, use Vercel or Netlify.

***

## 📱 Usage Guide

### Desktop Usage

- **Keyboard Shortcuts**: Press `?` to view all available shortcuts [5]
- **Hover Interactions**: Hover over song cards to reveal quick action buttons [5]
- **Full-Screen Mode**: Click the full-screen button for an immersive experience [5]
- **Queue Management**: Use the queue button to manage playback order [5]

### Mobile Usage

- **Swipe Controls**: Swipe left/right on the player to skip tracks [5]
- **Bottom Navigation**: Tap icons to switch between Home, Explore, and Library [5]
- **Long Press**: Long-press song cards for additional options [5]
- **Mobile Menu**: Access the sidebar via the hamburger menu (☰) [5]

### Creating Playlists

1. Navigate to the Library section
2. Click "Create Playlist"
3. Add songs by clicking the "+" icon on any track
4. Manage playlists from your Library

[5]

### Search & Discovery

- Use the search bar with real-time suggestions [5]
- Filter results by songs, videos, artists, or albums [5]
- Explore popular recommendations on the home page [5]

***

## 📁 Project Structure

```
YTMusicClone/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── search/        # Search endpoint
│   │   └── ytmusic/       # YouTube Music endpoint
│   ├── components/        # React components
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── public/                # Static assets
├── styles/                # Global styles
├── .env.local            # Environment variables (not committed)
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Project dependencies
└── README.md             # Documentation
```


***

## 🔌 API Documentation

### Search Endpoint

**Endpoint**: `/api/search`

**Method**: GET

**Query Parameters**:
- `q` (string, required): Search query
- `type` (string, optional): Filter type (song/video/artist/album)

**Response**: Returns search results with song metadata

### YouTube Music Endpoint

**Endpoint**: `/api/ytmusic`

**Method**: GET

**Description**: Fetches music-specific data from YouTube Music API

[5]

### Rate Limits

The YouTube Data API v3 has quota limits [1]:
- **Default quota**: 10,000 units per day
- **Search operation**: 100 units per request
- Monitor usage in Google Cloud Console

***

## 🤝 Contributing

Contributions are welcome and appreciated [2][3]! To contribute:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style and conventions [3]
- Write clear commit messages
- Add tests for new features when applicable
- Update documentation for significant changes
- Ensure the build passes before submitting PR

***

## 📄 License

This is a **demo project for educational purposes** [5]. All music content is streamed from YouTube and belongs to their respective copyright holders [5]. 

For choosing an appropriate license for your projects, visit [choosealicense.com](https://choosealicense.com/) [2][3].

***

## 🙏 Acknowledgments

### Contributors

- **[Devanshshar01](https://github.com/Devanshshar01)** - Lead Developer [5]
- **Cursor Agent** - Development Assistant [5]

### Technologies & Resources

- [Next.js Documentation](https://nextjs.org/docs) - Framework reference
- [React YouTube](https://www.npmjs.com/package/react-youtube) - Video player component
- [ytmusic-api](https://www.npmjs.com/package/ytmusic-api) - Music data API
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Vercel](https://vercel.com) - Deployment platform

[5]

### Inspiration

This project was inspired by YouTube Music's interface and functionality, recreated as a learning exercise to demonstrate modern web development capabilities [2][3].

***

## 📞 Contact & Support

- **Live Demo**: [yt-music-clone-lime-beta.vercel.app](https://yt-music-clone-lime-beta.vercel.app)
- **Repository**: [github.com/Devanshshar01/YTMusicClone](https://github.com/Devanshshar01/YTMusicClone)
- **Issues**: [Report a bug or request a feature](https://github.com/Devanshshar01/YTMusicClone/issues)

[5]

***

<div align="center">

**⭐ Star this repository if you find it helpful!**

Made with ❤️ by Devanshshar01

</div>

Citations:
[1] Best practices for GitHub Docs https://docs.github.com/en/contributing/writing-for-github-docs/best-practices-for-github-docs
[2] How to Write a Good README File for Your GitHub Project https://www.freecodecamp.org/news/how-to-write-a-good-readme-file/
[3] Professional README Guide | The Full-Stack Blog https://coding-boot-camp.github.io/full-stack/github/professional-readme-guide/
[4] A standard style for README files https://github.com/RichardLitt/standard-readme
[5] GitHub - Devanshshar01/YTMusicClone https://github.com/Devanshshar01/YTMusicClone
[6] Basic writing and formatting syntax https://docs.github.com/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax
[7] About the repository README file https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
[8] Build a documentation site with Next.js using Nextra https://dev.to/mayorstacks/build-a-documentation-site-with-nextjs-2b3p
[9] How to write a good README for your GitHub project? https://bulldogjob.com/readme/how-to-write-a-good-readme-for-your-github-project
[10] Next.js Documentation Website Templates https://nextjstemplates.com/docs-template
[11] The Essential README File: Elevating Your Project with a ... https://cubettech.com/resources/blog/the-essential-readme-file-elevating-your-project-with-a-comprehensive-document/
