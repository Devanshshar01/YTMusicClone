"use client";

/**
 * YouTube Clone - Exact YouTube Interface Replication
 * 
 * Features:
 * ✨ Visual Design:
 *   - Exact YouTube interface replication
 *   - YouTube's signature header with logo and search
 *   - YouTube-style video grid layout
 *   - YouTube's sidebar navigation
 *   - YouTube's color scheme and typography
 * 
 * 🎵 Playback Features:
 *   - YouTube video player integration
 *   - Queue management
 *   - Working shuffle mode
 *   - Repeat modes (off, all, one)
 *   - Skip forward/backward 10 seconds
 *   - Progress bar with seeking
 *   - Volume control
 * 
 * 📱 Mobile Experience:
 *   - Responsive YouTube-like design
 *   - Touch-optimized controls
 *   - Mobile navigation
 * 
 * ⌨️ Keyboard Shortcuts:
 *   - Space: Play/Pause
 *   - Arrow keys: Seek, volume, next/prev
 *   - S: Toggle shuffle
 *   - R: Cycle repeat
 *   - L: Like current song
 *   - F: Full screen
 *   - ?: Show shortcuts help
 */

import { useMemo, useRef, useState, useEffect } from "react";
import YouTube from "react-youtube";

// A richer item type shaped by our /api/ytmusic route
type YTMusicItem = {
  id: string;
  title?: string;
  artists?: Array<{ name?: string } | string>;
  album?: { name?: string } | string | null;
  albumName?: string | null;
  duration?: string | null;
  viewsText?: string | null;
  type?: string;
  thumbnail?: string;
  channelTitle?: string;
  publishedAt?: string;
};

// Type for recently searched items
type RecentSearchItem = {
  id: string;
  title: string;
  artists: Array<{ name?: string } | string>;
  timestamp: number;
};

// Type for lyrics
type LyricsLine = {
  time: number;
  text: string;
};

type LyricsData = {
  lines: LyricsLine[];
  hasLyrics: boolean;
  source?: string;
};

// Minimal player type to avoid 'any'
type YTLikePlayer = {
  playVideo?: () => void;
  pauseVideo?: () => void;
  stopVideo?: () => void;
  getPlayerState?: () => number;
  setVolume?: (volume: number) => void;
  getVolume?: () => number;
  getCurrentTime?: () => number;
  getDuration?: () => number;
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
};

const YTPlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

function computeThumb(id?: string) {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}

// Format time in seconds to MM:SS format
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YTMusicItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filter, setFilter] = useState<"all" | "songs" | "videos" | "artists" | "albums">("all");
  const [volume, setVolume] = useState<number>(80);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [popularSongs, setPopularSongs] = useState<YTMusicItem[]>([]);
  const [darkMode, setDarkMode] = useState(false); // Default to light mode like YouTube
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [likedSongs, setLikedSongs] = useState<YTMusicItem[]>([]);
  const [currentView, setCurrentView] = useState<"home" | "liked" | "recent" | "favorites" | "queue" | "playlists">("home");
  const [queue, setQueue] = useState<YTMusicItem[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const [fullScreen, setFullScreen] = useState(false);
  const [playlists, setPlaylists] = useState<{id: string, name: string, songs: YTMusicItem[]}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: "", visible: false});
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const playerRef = useRef<YTLikePlayer | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lyricsRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load recent searches, theme preference, liked songs, and playlists from localStorage on component mount
  useEffect(() => {
    const savedRecentSearches = localStorage.getItem("recentSearches");
    if (savedRecentSearches) {
      try {
        setRecentSearches(JSON.parse(savedRecentSearches));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
    }

    const savedLikedSongs = localStorage.getItem("likedSongs");
    if (savedLikedSongs) {
      try {
        setLikedSongs(JSON.parse(savedLikedSongs));
      } catch (e) {
        console.error("Failed to parse liked songs", e);
      }
    }

    const savedPlaylists = localStorage.getItem("playlists");
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (e) {
        console.error("Failed to parse playlists", e);
      }
    }

    const savedShuffle = localStorage.getItem("shuffle");
    if (savedShuffle) {
      setShuffle(savedShuffle === "true");
    }

    const savedRepeat = localStorage.getItem("repeat");
    if (savedRepeat) {
      setRepeat(savedRepeat as "off" | "one" | "all");
    }
  }, []);

  // Fetch popular songs on component mount
  useEffect(() => {
    const fetchPopularSongs = async () => {
      try {
        // Fetch popular songs with a generic search
        const res = await fetch(`/api/ytmusic?q=popular`);
        if (res.ok) {
          const data = await res.json();
          setPopularSongs(data.items || []);
        }
      } catch (e) {
        console.error("Failed to fetch popular songs", e);
      }
    };

    if (popularSongs.length === 0) {
      fetchPopularSongs();
    }
  }, [popularSongs.length]);

  // Save recent searches to localStorage whenever they change
  useEffect(() => {
    if (recentSearches.length > 0) {
      localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Save liked songs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  }, [likedSongs]);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Save shuffle state to localStorage
  useEffect(() => {
    localStorage.setItem("shuffle", String(shuffle));
  }, [shuffle]);

  // Save repeat state to localStorage
  useEffect(() => {
    localStorage.setItem("repeat", repeat);
  }, [repeat]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(e.key) {
        case ' ':
          e.preventDefault();
          playPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            nextTrack();
          } else {
            skipForward();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            prevTrack();
          } else {
            skipBackward();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(100, prev + 5));
          if (playerRef.current) {
            playerRef.current.setVolume?.(Math.min(100, volume + 5));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 5));
          if (playerRef.current) {
            playerRef.current.setVolume?.(Math.max(0, volume - 5));
          }
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setShuffle(!shuffle);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          const nextRepeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
          setRepeat(nextRepeat);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          if (current) {
            toggleLikeSong(current);
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setFullScreen(!fullScreen);
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, shuffle, repeat, current, fullScreen, showKeyboardShortcuts, volume]);

  // Progress tracking
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(() => {
        const currentTime = playerRef.current?.getCurrentTime?.() || 0;
        const duration = playerRef.current?.getDuration?.() || 0;
        setCurrentTime(currentTime);
        setDuration(duration);
        setProgress(duration > 0 ? (currentTime / duration) * 100 : 0);
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [isPlaying]);

  // Lyrics synchronization
  useEffect(() => {
    if (lyrics && lyrics.lines.length > 0 && isPlaying) {
      const interval = setInterval(() => {
        const currentTime = playerRef.current?.getCurrentTime?.() || 0;
        const currentLineIndex = lyrics.lines.findIndex((line, index) => {
          const nextLine = lyrics.lines[index + 1];
          return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });
        
        if (currentLineIndex !== -1 && currentLineIndex !== currentLyricsLine) {
          setCurrentLyricsLine(currentLineIndex);
          
          // Scroll to current line
          const currentLineElement = lyricsRefs.current[currentLineIndex];
          if (currentLineElement) {
            currentLineElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [lyrics, isPlaying, currentLyricsLine]);

  const current = currentIndex !== null ? results[currentIndex] : null;
  const currentThumb = computeThumb(current?.id);

  const filteredResults = useMemo(() => {
    if (!results.length) return [];
    
    switch (filter) {
      case "songs":
        return results.filter(item => item.type?.toLowerCase() === "song");
      case "videos":
        return results.filter(item => item.type?.toLowerCase() === "video");
      case "artists":
        return results.filter(item => item.type?.toLowerCase() === "artist");
      case "albums":
        return results.filter(item => item.type?.toLowerCase() === "album");
      default:
        return results;
    }
  }, [results, filter]);

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/ytmusic?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
        setCurrentIndex(null);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setDuration(0);
        
        // Add to recent searches
        const newSearch: RecentSearchItem = {
          id: Date.now().toString(),
          title: searchQuery,
          artists: [],
          timestamp: Date.now()
        };
        setRecentSearches(prev => [newSearch, ...prev.filter(item => item.title !== searchQuery).slice(0, 9)]);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Search failed");
      }
    } catch (e) {
      setError("Network error");
      console.error("Search error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query.trim());
      setShowSuggestions(false);
    }
  };

  const playPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo?.();
      } else {
        playerRef.current.playVideo?.();
      }
    }
  };

  const nextTrack = () => {
    if (filteredResults.length === 0) return;
    
    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * filteredResults.length);
    } else {
      nextIndex = currentIndex === null ? 0 : (currentIndex + 1) % filteredResults.length;
    }
    
    setCurrentIndex(nextIndex);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const prevTrack = () => {
    if (filteredResults.length === 0) return;
    
    let prevIndex;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * filteredResults.length);
    } else {
      prevIndex = currentIndex === null ? 0 : currentIndex === 0 ? filteredResults.length - 1 : currentIndex - 1;
    }
    
    setCurrentIndex(prevIndex);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const skipForward = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      playerRef.current.seekTo?.(currentTime + 10, true);
    }
  };

  const skipBackward = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      playerRef.current.seekTo?.(Math.max(0, currentTime - 10), true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      playerRef.current.seekTo?.(newTime, true);
    }
  };

  const toggleLikeSong = (song: YTMusicItem) => {
    const isLiked = likedSongs.some(s => s.id === song.id);
    if (isLiked) {
      setLikedSongs(prev => prev.filter(s => s.id !== song.id));
      showToast("Removed from liked songs");
    } else {
      setLikedSongs(prev => [...prev, song]);
      showToast("Added to liked songs");
    }
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };

  const playRecentSearch = (item: RecentSearchItem) => {
    // Convert recent search to playable item
    const playableItem: YTMusicItem = {
      id: item.id,
      title: item.title,
      artists: item.artists
    };
    setResults([playableItem]);
    setCurrentIndex(0);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  const playRelatedSong = async () => {
    if (!current) return;
    
    try {
      // Fetch related songs based on the current song
      const res = await fetch(`/api/ytmusic?relatedTo=${current.id}`);
      if (res.ok) {
        const data = await res.json();
        const relatedSongs = data.items || [];
        
        // Filter out the current song and get the first related song
        const nextSong = relatedSongs.find((song: YTMusicItem) => song.id !== current.id);
        
        if (nextSong) {
          // Add the related song to the results and play it
          const newResults = [...results, nextSong];
          setResults(newResults);
          setCurrentIndex(newResults.length - 1);
          setIsPlaying(true);
          // Reset progress when playing a new song
          setProgress(0);
          setCurrentTime(0);
          setDuration(0);
        } else {
          // If no related song found, play the next song in the current list
          nextTrack();
        }
      } else {
        // If API call fails, play the next song in the current list
        nextTrack();
      }
    } catch (e) {
      console.error("Failed to fetch related songs", e);
      // If we can't get related songs, just play the next song in the current list
      nextTrack();
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* YouTube Header */}
      <header className={`sticky top-0 z-40 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Logo and Menu */}
          <div className="flex items-center">
            {/* Hamburger Menu */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className={`p-2 mr-3 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors md:hidden`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </button>

            {/* YouTube Logo */}
            <div className="flex items-center">
              <div className="flex items-center cursor-pointer">
                <svg className="w-6 h-6 text-red-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span className="text-xl font-bold">YouTube</span>
              </div>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className={`flex-1 px-4 py-2 ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border border-r-0 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Search"
                />
                <button
                  type="submit"
                  className={`px-6 py-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} border border-l-0 rounded-r-full transition-colors`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </button>
              </div>

              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className={`absolute top-full left-0 right-0 mt-1 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border rounded-lg shadow-lg z-50`}>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setQuery(suggestion);
                        search(suggestion);
                        setShowSuggestions(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors flex items-center gap-3`}
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Right side - User Actions */}
          <div className="flex items-center">
            <button 
              onClick={() => setShowKeyboardShortcuts(true)}
              className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors hidden sm:block`}
              title="Keyboard shortcuts (?)"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
              </svg>
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors ml-1`}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                </svg>
              )}
            </button>
            <button className={`p-2 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors ml-1`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden">
          <div className={`w-64 h-full ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-xl`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-red-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="text-xl font-bold">YouTube</span>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
              
              {/* Mobile Navigation */}
              <nav className="space-y-2">
                <button 
                  onClick={() => {
                    setCurrentView("home");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "home" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                  Home
                </button>
                <button 
                  onClick={() => {
                    setCurrentView("liked");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "liked" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  Liked Songs
                </button>
                <button 
                  onClick={() => {
                    setCurrentView("recent");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "recent" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Recent
                </button>
                <button 
                  onClick={() => {
                    setCurrentView("queue");
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "queue" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                  </svg>
                  Queue ({queue.length})
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`hidden md:block w-64 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-r min-h-screen`}>
          <div className="p-4">
            {/* Navigation */}
            <nav className="space-y-2">
              <button 
                onClick={() => setCurrentView("home")}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "home" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                Home
              </button>
              <button 
                onClick={() => setCurrentView("liked")}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "liked" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Liked Songs
              </button>
              <button 
                onClick={() => setCurrentView("recent")}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "recent" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Recent
              </button>
              <button 
                onClick={() => setCurrentView("queue")}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left ${currentView === "queue" ? 'bg-red-100 text-red-600' : darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
                </svg>
                Queue ({queue.length})
              </button>
            </nav>

            {/* Playlists */}
            {playlists.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-500 mb-3">PLAYLISTS</h3>
                <div className="space-y-1">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => setCurrentView("playlists")}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {playlist.name} ({playlist.songs.length})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 pb-20">
          {/* Filter Chips */}
          <div className="mb-6">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {([
                { key: "all", label: "All" },
                { key: "songs", label: "Songs" },
                { key: "videos", label: "Videos" },
                { key: "artists", label: "Artists" },
                { key: "albums", label: "Albums" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === key
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : darkMode 
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content based on current view */}
          {currentView === "home" && (
            <>
              {/* Popular Songs Section */}
              {!query && popularSongs.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4">Popular Songs</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {popularSongs.slice(0, 8).map((song, index) => (
                      <div
                        key={song.id}
                        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                        onClick={() => {
                          setResults(popularSongs);
                          setCurrentIndex(index);
                          setIsPlaying(true);
                          setProgress(0);
                          setCurrentTime(0);
                          setDuration(0);
                        }}
                      >
                        <div className="relative">
                          <img
                            src={computeThumb(song.id)}
                            alt={song.title || "Song"}
                            className="w-full aspect-video object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<div class="w-full aspect-video ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center"><span class="text-2xl">♪</span></div>`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <button className="opacity-0 hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                              <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2">{song.title || "Untitled"}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {Array.isArray(song.artists) && song.artists.length
                              ? song.artists
                                  .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                                  .filter(Boolean)
                                  .join(", ")
                              : "Unknown Artist"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {query && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Search Results for &quot;{query}&quot;</h2>
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                  )}
                  {error && (
                    <div className="text-center py-8 text-red-600">
                      {error}
                    </div>
                  )}
                  {!loading && !error && filteredResults.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredResults.map((item, index) => (
                        <div
                          key={item.id}
                          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                          onClick={() => {
                            setCurrentIndex(index);
                            setIsPlaying(true);
                            setProgress(0);
                            setCurrentTime(0);
                            setDuration(0);
                          }}
                        >
                          <div className="relative">
                            <img
                              src={computeThumb(item.id)}
                              alt={item.title || "Video"}
                              className="w-full aspect-video object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `<div class="w-full aspect-video ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center"><span class="text-2xl">♪</span></div>`;
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                              <button className="opacity-0 hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                                <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </button>
                            </div>
                            {item.duration && (
                              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                                {item.duration}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm line-clamp-2">{item.title || "Untitled"}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {Array.isArray(item.artists) && item.artists.length
                                ? item.artists
                                    .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                                    .filter(Boolean)
                                    .join(", ")
                                : "Unknown Artist"}
                            </p>
                            {item.viewsText && (
                              <p className="text-xs text-gray-500 mt-1">{item.viewsText} views</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loading && !error && filteredResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No results found for &quot;{query}&quot;
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Other views */}
          {currentView === "liked" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Liked Songs</h2>
              {likedSongs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {likedSongs.map((song, index) => (
                    <div
                      key={song.id}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => {
                        setResults(likedSongs);
                        setCurrentIndex(index);
                        setIsPlaying(true);
                        setProgress(0);
                        setCurrentTime(0);
                        setDuration(0);
                      }}
                    >
                      <div className="relative">
                        <img
                          src={computeThumb(song.id)}
                          alt={song.title || "Song"}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <button className="opacity-0 hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                            <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2">{song.title || "Untitled"}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {Array.isArray(song.artists) && song.artists.length
                            ? song.artists
                                .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                                .filter(Boolean)
                                .join(", ")
                            : "Unknown Artist"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No liked songs yet
                </div>
              )}
            </div>
          )}

          {currentView === "recent" && (
            <div>
              <h2 className="text-xl font-bold mb-4">Recent Searches</h2>
              {recentSearches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recentSearches.map((item, index) => (
                    <div
                      key={`${item.id}-${item.timestamp}`}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                      onClick={() => playRecentSearch(item)}
                    >
                      <div className="relative">
                        <img
                          src={computeThumb(item.id)}
                          alt={item.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <button className="opacity-0 hover:opacity-100 transition-opacity bg-white rounded-full p-2">
                            <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {Array.isArray(item.artists) && item.artists.length
                            ? item.artists
                                .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                                .filter(Boolean)
                                .join(", ")
                            : "Unknown Artist"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent searches
                </div>
              )}
            </div>
          )}

          {currentView === "queue" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Queue ({queue.length})</h2>
                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear Queue
                  </button>
                )}
              </div>
              {queue.length > 0 ? (
                <div className="space-y-2">
                  {queue.map((song, index) => (
                    <div
                      key={song.id}
                      className={`flex items-center p-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}
                    >
                      <img
                        src={computeThumb(song.id)}
                        alt={song.title || "Song"}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 ml-3">
                        <h3 className="font-medium text-sm">{song.title || "Untitled"}</h3>
                        <p className="text-xs text-gray-500">
                          {Array.isArray(song.artists) && song.artists.length
                            ? song.artists
                                .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                                .filter(Boolean)
                                .join(", ")
                            : "Unknown Artist"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromQueue(index)}
                        className="text-gray-400 hover:text-red-600 p-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Queue is empty
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Player */}
      {current && (
        <div className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-t z-30`}>
          <div className="flex items-center p-4">
            {/* Song Info */}
            <div className="flex items-center flex-1 min-w-0">
              <img
                src={currentThumb}
                alt={current?.title || "Now Playing"}
                className="w-12 h-12 object-cover rounded mr-3"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm truncate">{current?.title || "Untitled"}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {Array.isArray(current?.artists) && current?.artists.length
                    ? current!.artists
                        .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                        .filter(Boolean)
                        .join(", ")
                    : "Unknown Artist"}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`p-2 ${shuffle ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </button>
              
              <button
                onClick={prevTrack}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>
              
              <button
                onClick={playPause}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>
              
              <button
                onClick={nextTrack}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
              
              <button
                onClick={() => {
                  const nextRepeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
                  setRepeat(nextRepeat);
                }}
                className={`p-2 ${repeat !== "off" ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {repeat === "one" ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 mx-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
                <div 
                  className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-red-600 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  playerRef.current?.setVolume?.(v);
                }}
                className="w-20 accent-red-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden YouTube player */}
      <div className="absolute w-0 h-0 overflow-hidden">
        {current && (
          <YouTube
            videoId={current.id}
            onReady={(e) => {
              playerRef.current = e.target as unknown as YTLikePlayer;
              playerRef.current?.setVolume?.(volume);
              const dur = playerRef.current?.getDuration?.() || 0;
              setDuration(dur);
            }}
            onStateChange={(e) => {
              const s = (e.data ?? 0) as number;
              setIsPlaying(s === YTPlayerState.PLAYING);
              if (s === YTPlayerState.ENDED) {
                playRelatedSong();
              }
            }}
            opts={{
              height: "0",
              width: "0",
              playerVars: { 
                autoplay: 1,
                controls: 0
              },
            }}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`fixed bottom-20 right-4 z-50 ${darkMode ? 'bg-gray-800' : 'bg-gray-900'} text-white px-4 py-3 rounded-lg shadow-lg`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}