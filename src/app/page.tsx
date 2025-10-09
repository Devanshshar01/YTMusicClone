"use client";

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
};

// Type for recently searched items
type RecentSearchItem = {
  id: string;
  title: string;
  artists: Array<{ name?: string } | string>;
  timestamp: number;
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
  const [darkMode, setDarkMode] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [likedSongs, setLikedSongs] = useState<YTMusicItem[]>([]);
  const [currentView, setCurrentView] = useState<"home" | "liked" | "recent" | "favorites">("home");

  const playerRef = useRef<YTLikePlayer | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches, theme preference, and liked songs from localStorage on component mount
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

  // Progress tracking
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(() => {
        const current = playerRef.current?.getCurrentTime?.() || 0;
        const total = playerRef.current?.getDuration?.() || 0;
        setCurrentTime(current);
        setDuration(total);
        setProgress(total > 0 ? (current / total) * 100 : 0);
      }, 1000);
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying]);

  const canSearch = useMemo(() => query.trim().length > 1, [query]);

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setCurrentIndex(null);
    try {
      const res = await fetch(`/api/ytmusic?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data = (await res.json()) as { items: YTMusicItem[] };
      setResults(data.items || []);
      
      // Add to recent searches if we have results
      if (data.items && data.items.length > 0) {
        const newItem: RecentSearchItem = {
          id: data.items[0].id,
          title: data.items[0].title || "Untitled",
          artists: data.items[0].artists || [],
          timestamp: Date.now()
        };
        
        // Update recent searches, keeping only the latest 10 and avoiding duplicates
        setRecentSearches(prev => {
          const filtered = prev.filter(item => item.id !== newItem.id);
          return [newItem, ...filtered].slice(0, 10);
        });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSearch) search(query);
  }

  const current = currentIndex != null ? results[currentIndex] : null;
  const currentThumb = computeThumb(current?.id);

  // Check if a song is liked
  const isSongLiked = (songId: string) => {
    return likedSongs.some(song => song.id === songId);
  };

  // Toggle like status for a song
  const toggleLikeSong = (song: YTMusicItem) => {
    if (isSongLiked(song.id)) {
      // Remove from liked songs
      setLikedSongs(prev => prev.filter(s => s.id !== song.id));
    } else {
      // Add to liked songs
      setLikedSongs(prev => [...prev, song]);
    }
  };

  const filteredResults = results.filter((r) => {
    if (filter === "all") return true;
    const t = String(r.type || "").toLowerCase();
    if (filter === "songs") return t.includes("song") || t.includes("track");
    if (filter === "videos") return t.includes("video");
    if (filter === "artists") return t.includes("artist");
    if (filter === "albums") return t.includes("album");
    return true;
  });

  function playAt(index: number) {
    setCurrentIndex(index);
    setIsPlaying(true);
    // Reset progress when playing a new song
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }

  // Function to play a recent search item
  async function playRecentSearch(item: RecentSearchItem) {
    // Set the item as currently playing
    const dummyResults: YTMusicItem[] = [{
      id: item.id,
      title: item.title,
      artists: item.artists
    }];
    
    setResults(dummyResults);
    setCurrentIndex(0);
    setIsPlaying(true);
    // Reset progress when playing a new song
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }

  function playPause() {
    if (!playerRef.current) return;
    const state = playerRef.current.getPlayerState?.();
    if (state === YTPlayerState.PLAYING) {
      playerRef.current.pauseVideo?.();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo?.();
      setIsPlaying(true);
    }
  }

  function nextTrack() {
    if (!results.length) return;
    setCurrentIndex((idx) => {
      const i = typeof idx === "number" ? idx : -1;
      const n = (i + 1) % results.length;
      return n;
    });
    setIsPlaying(true);
    // Reset progress when playing a new song
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }

  function prevTrack() {
    if (!results.length) return;
    setCurrentIndex((idx) => {
      const i = typeof idx === "number" ? idx : 0;
      const p = (i - 1 + results.length) % results.length;
      return p;
    });
    setIsPlaying(true);
    // Reset progress when playing a new song
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }

  // Clear recent searches
  function clearRecentSearches() {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }

  // Toggle dark/light mode
  function toggleTheme() {
    setDarkMode(!darkMode);
  }

  // Handle progress bar click to seek
  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!playerRef.current || !duration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    // Seek to the new time using YouTube API
    playerRef.current.seekTo?.(newTime, true);
    
    // Update our local state
    setCurrentTime(newTime);
    setProgress(pos * 100);
  }

  // Skip forward 10 seconds
  function skipForward() {
    if (!playerRef.current || !duration) return;
    
    const currentTime = playerRef.current.getCurrentTime?.() || 0;
    const newTime = Math.min(currentTime + 10, duration);
    
    // Seek to the new time using YouTube API
    playerRef.current.seekTo?.(newTime, true);
    
    // Update our local state
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  }

  // Skip backward 10 seconds
  function skipBackward() {
    if (!playerRef.current) return;
    
    const currentTime = playerRef.current.getCurrentTime?.() || 0;
    const newTime = Math.max(currentTime - 10, 0);
    
    // Seek to the new time using YouTube API
    playerRef.current.seekTo?.(newTime, true);
    
    // Update our local state
    setCurrentTime(newTime);
    setProgress(duration > 0 ? (newTime / duration) * 100 : 0);
  }

  // Toggle sidebar collapse
  function toggleSidebar() {
    setSidebarCollapsed(!sidebarCollapsed);
  }

  // Navigate back to home view
  function goBack() {
    setCurrentView("home");
  }

  // Function to play a related song when the current one ends
  async function playRelatedSong() {
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
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar - Hidden on mobile when collapsed */}
      <aside className={`${sidebarCollapsed ? 'w-16 md:w-64' : 'w-64'} ${darkMode ? 'bg-black' : 'bg-white'} border-r ${darkMode ? 'border-gray-800' : 'border-gray-200'} flex flex-col transition-all duration-300 hidden md:flex`}>
        {/* Logo and collapse button */}
        <div className="flex items-center p-4">
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">▶</span>
              </div>
              <h1 className="text-xl font-bold">YouTube Music</h1>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">▶</span>
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className={`ml-auto p-1 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
          >
            <span className="text-lg">{sidebarCollapsed ? '▶' : '◀'}</span>
          </button>
        </div>

        {/* Search in sidebar when collapsed */}
        {sidebarCollapsed && (
          <div className="px-2 mb-4">
            <form onSubmit={handleSubmit} className="relative">
              <input
                className={`w-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} rounded-full py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-white`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search"
              />
            </form>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {([
            { key: "home", label: "Home", icon: "🏠" },
            { key: "explore", label: "Explore", icon: "🔍" },
            { key: "library", label: "Library", icon: "📚" },
          ] as const).map(({ key, label, icon }) => (
            <button
              key={key}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors ${
                key === "home" && currentView === "home"
                  ? `${darkMode ? 'text-white bg-gray-900' : 'text-black bg-gray-200'} font-semibold` 
                  : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`
              }`}
              onClick={() => {
                if (key === "library") {
                  setCurrentView("liked");
                } else {
                  setCurrentView("home");
                }
              }}
            >
              <span className="text-lg mr-4">{icon}</span>
              {!sidebarCollapsed && <span>{label}</span>}
            </button>
          ))}

          {/* Library section */}
          {!sidebarCollapsed && (
            <div className="mt-8">
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Playlists
              </div>
              {[
                { id: "liked", name: "Liked songs", count: `${likedSongs.length} songs` },
                { id: "recent", name: "Recently played", count: `${recentSearches.length} songs` },
                { id: "favorites", name: "Favorites", count: "8 songs" },
              ].map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setCurrentView(playlist.id as "liked" | "recent" | "favorites")}
                  className={`flex items-center w-full px-4 py-3 text-sm transition-colors ${
                    currentView === playlist.id
                      ? `${darkMode ? 'text-white bg-gray-900' : 'text-black bg-gray-200'} font-semibold`
                      : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`
                  }`}
                >
                  <span className="text-lg mr-4">
                    {playlist.id === "liked" ? "♥" : playlist.id === "recent" ? "🕒" : "⭐"}
                  </span>
                  <div className="text-left">
                    <div className="font-medium">{playlist.name}</div>
                    <div className="text-xs opacity-70">{playlist.count}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* User profile */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800">
            <button className={`flex items-center w-full p-2 rounded-lg ${darkMode ? 'hover:bg-gray-900' : 'hover:bg-gray-200'}`}>
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                <span className="text-white">👤</span>
              </div>
              <span>Guest</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Navigation - Only visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
        <div className={`flex justify-around items-center py-2 ${darkMode ? 'bg-black border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
          {([
            { key: "home", icon: "🏠" },
            { key: "explore", icon: "🔍" },
            { key: "library", icon: "📚" },
          ] as const).map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => {
                if (key === "library") {
                  setCurrentView("liked");
                } else {
                  setCurrentView("home");
                }
              }}
              className={`p-3 ${key === "home" && currentView === "home" || key === "library" && currentView !== "home" ? (darkMode ? 'text-white' : 'text-black') : (darkMode ? 'text-gray-400' : 'text-gray-600')}`}
            >
              <span className="text-xl">{icon}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className={`sticky top-0 z-10 ${darkMode ? 'bg-black' : 'bg-white'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center px-4 py-3">
            {/* Back button - only visible when not on home view */}
            {currentView !== "home" && (
              <button 
                onClick={goBack}
                className={`p-2 mr-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
              >
                <span className="text-lg">←</span>
              </button>
            )}
            
            {/* Mobile menu button - only visible on home view */}
            {currentView === "home" && (
              <button 
                onClick={toggleSidebar}
                className={`p-2 mr-2 rounded-full md:hidden ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
              >
                <span className="text-lg">☰</span>
              </button>
            )}
            
            {/* Search Bar - Always visible on mobile, only when sidebar is collapsed on desktop */}
            <div className="flex-1 max-w-2xl">
              <form onSubmit={handleSubmit} className="relative">
                <div className={`relative rounded-full ${darkMode ? 'bg-gray-900' : 'bg-gray-100'} hover:${darkMode ? 'bg-gray-800' : 'bg-gray-200'} transition-colors`}>
                  <input
                    className={`w-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} rounded-full py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-white`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search songs, albums, artists"
                    aria-label="Search"
                  />
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-base`}>🔍</span>
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center ml-4">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span className="text-lg">{darkMode ? "☀️" : "🌙"}</span>
              </button>
              <button className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors ml-1`}>
                <span className="text-lg">👤</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-32">
          {/* Show Liked Songs when "Liked songs" playlist is selected */}
          {currentView === "liked" && likedSongs.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h2 className="text-xl sm:text-2xl font-bold">Liked Songs</h2>
                </div>
                <button 
                  onClick={() => setLikedSongs([])}
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                {likedSongs.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      setResults(likedSongs);
                      setCurrentIndex(index);
                      setIsPlaying(true);
                      setProgress(0);
                      setCurrentTime(0);
                      setDuration(0);
                    }}
                    className={`rounded-lg p-3 ${darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="relative mb-3">
                      <div className={`aspect-square rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(song.id)} 
                          alt={song.title || "Song"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className={`w-8 h-8 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                          <span className="text-white text-xs">▶</span>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium truncate text-sm">{song.title || "Untitled"}</h3>
                    <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Array.isArray(song.artists) && song.artists.length
                        ? song.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeSong(song);
                      }}
                      className={`mt-2 text-xs ${isSongLiked(song.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      <span>{isSongLiked(song.id) ? '♥ Liked' : '♡ Like'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show message when "Liked songs" playlist is selected but empty */}
          {currentView === "liked" && likedSongs.length === 0 && (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center mb-4">
                <button 
                  onClick={goBack}
                  className={`p-2 mr-4 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                  <span className="text-lg">←</span>
                </button>
                <div className="text-5xl sm:text-6xl">♥</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">No Liked Songs Yet</h2>
              <p className={`px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Like songs by clicking the heart icon on any song to add them to this playlist.
              </p>
            </div>
          )}

          {/* Recently Searched Section - Only show on home view */}
          {currentView === "home" && recentSearches.length > 0 && !query && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">Recently Searched</h2>
                <button 
                  onClick={clearRecentSearches}
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                {recentSearches.map((item) => (
                  <div
                    key={`${item.id}-${item.timestamp}`}
                    onClick={() => playRecentSearch(item)}
                    className={`rounded-lg p-3 ${darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="relative mb-3">
                      <div className={`aspect-square rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(item.id)} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className={`w-8 h-8 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                          <span className="text-white text-xs">▶</span>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium truncate text-sm">{item.title}</h3>
                    <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Array.isArray(item.artists) && item.artists.length
                        ? item.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Convert RecentSearchItem to YTMusicItem for liking
                        const songItem: YTMusicItem = {
                          id: item.id,
                          title: item.title,
                          artists: item.artists
                        };
                        toggleLikeSong(songItem);
                      }}
                      className={`mt-2 text-xs ${isSongLiked(item.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      <span>{isSongLiked(item.id) ? '♥ Liked' : '♡ Like'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Songs Section - Only show on home view */}
          {currentView === "home" && !query && popularSongs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Popular Songs</h2>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                {popularSongs.slice(0, 24).map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      setResults(popularSongs);
                      setCurrentIndex(index);
                      setIsPlaying(true);
                      setProgress(0);
                      setCurrentTime(0);
                      setDuration(0);
                    }}
                    className={`rounded-lg p-3 ${darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="relative mb-3">
                      <div className={`aspect-square rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(song.id)} 
                          alt={song.title || "Song"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className={`w-8 h-8 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                          <span className="text-white text-xs">▶</span>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-medium truncate text-sm">{song.title || "Untitled"}</h3>
                    <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Array.isArray(song.artists) && song.artists.length
                        ? song.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLikeSong(song);
                      }}
                      className={`mt-2 text-xs ${isSongLiked(song.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                      <span>{isSongLiked(song.id) ? '♥ Liked' : '♡ Like'}</span>
                    </button>
                  </div>

                ))}
              </div>
            </div>
          )}

          {/* Filter Chips - Only show on home view */}
          {currentView === "home" && (
            <div className="mb-6">
              <div className="flex overflow-x-auto space-x-2 pb-2 hide-scrollbar">
                {([
                  { key: "all", label: "All" },
                  { key: "songs", label: "Songs" },
                  { key: "videos", label: "Videos" },
                  { key: "artists", label: "Artists" },
                  { key: "albums", label: "Albums" },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => key !== "all" && setFilter(key as "songs" | "videos" | "artists" | "albums")}
                    className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-full transition-colors ${
                      filter === key 
                        ? `${darkMode ? 'bg-white text-black' : 'bg-black text-white'}` 
                        : `${darkMode ? 'bg-gray-900 text-gray-300 hover:bg-gray-800' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results - Only show on home view */}
          {currentView === "home" && (
            <div>
              {error && (
                <div className={`mb-6 p-4 text-sm rounded-lg ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}>
                  Error: {error}
                </div>
              )}

              {!loading && filteredResults.length === 0 && !query && recentSearches.length === 0 && popularSongs.length === 0 && (
                <div className="py-16 text-center">
                  <div className="text-5xl sm:text-6xl mb-4">🎵</div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Discover Music</h2>
                  <p className={`px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Search for your favorite songs, artists, and albums to get started.</p>
                </div>
              )}

              {!loading && filteredResults.length === 0 && query && (
                <div className="py-16 text-center">
                  <div className="text-5xl sm:text-6xl mb-4">🔍</div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">No results found</h2>
                  <p className={`px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Try different search terms or check your spelling</p>
                </div>
              )}

              {loading && (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className={`rounded-lg p-3 animate-pulse ${darkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                      <div className={`aspect-square rounded-lg mb-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                      <div className={`h-4 rounded mb-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                      <div className={`h-3 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && filteredResults.length > 0 && (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
                  {filteredResults.map((r, idx) => (
                    <div
                      key={r.id}
                      onClick={() => playAt(idx)}
                      className={`rounded-lg p-3 ${darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all duration-200 cursor-pointer group`}
                    >
                      <div className="relative mb-3">
                        <div className={`aspect-square rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={computeThumb(r.id)} 
                            alt={r.title ?? "art"} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                            }}
                          />
                        </div>
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className={`w-8 h-8 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                            <span className="text-white text-xs">▶</span>
                          </button>
                        </div>
                      </div>
                      <h3 className="font-medium truncate text-sm" title={r.title ?? "Untitled"}>
                        {r.title ?? "Untitled"}
                      </h3>
                      <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {Array.isArray(r.artists) && r.artists.length
                          ? r.artists
                              .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                              .filter(Boolean)
                              .join(", ")
                          : "Unknown Artist"}
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeSong(r);
                        }}
                        className={`mt-2 text-xs ${isSongLiked(r.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        <span>{isSongLiked(r.id) ? '♥ Liked' : '♡ Like'}</span>
                      </button>
                    </div>

                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Enhanced Bottom Player - YouTube Music Style */}
        {current && (
          <footer className="fixed bottom-0 left-0 right-0 z-20">
            {/* Progress bar */}
            <div 
              className="h-1 w-full bg-gray-700 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-red-600" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className={`px-3 sm:px-4 py-3 ${darkMode ? 'bg-black border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Track info - Responsive for mobile */}
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded mr-3">
                    {currentThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentThumb} alt="art" className="w-full h-full rounded" />
                    ) : (
                      <div className={`w-full h-full rounded flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                        <span className="text-lg">♪</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 hidden xs:block">
                    <div className="font-medium truncate text-sm">{current?.title ?? "Untitled"}</div>
                    <div className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {Array.isArray(current?.artists) && current?.artists.length
                        ? current!.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </div>
                  </div>
                  <button 
                    onClick={() => current && toggleLikeSong(current)}
                    className={`p-2 ml-2 ${isSongLiked(current?.id || '') ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <span className="text-base">{isSongLiked(current?.id || '') ? '♥' : '♡'}</span>
                  </button>
                </div>

                {/* Controls - YouTube Music Style - Center section */}
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Skip backward button */}
                    <button
                      onClick={skipBackward}
                      className={`p-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      aria-label="Skip backward 10 seconds"
                      title="Skip backward 10 seconds"
                    >
                      <span className="text-base">⏪</span>
                    </button>
                    
                    <button
                      onClick={prevTrack}
                      className={`p-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      disabled={!filteredResults.length}
                      aria-label="Previous"
                      title="Previous"
                    >
                      <span className="text-base sm:text-lg">⏮</span>
                    </button>
                    
                    <button
                      onClick={playPause}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center hover:scale-105 transition-transform`}
                      disabled={currentIndex == null}
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      <span className="text-sm sm:text-base">{isPlaying ? "⏸" : "▶"}</span>
                    </button>
                    
                    <button
                      onClick={nextTrack}
                      className={`p-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      disabled={!filteredResults.length}
                      aria-label="Next"
                      title="Next"
                    >
                      <span className="text-base sm:text-lg">⏭</span>
                    </button>
                    
                    {/* Skip forward button */}
                    <button
                      onClick={skipForward}
                      className={`p-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      aria-label="Skip forward 10 seconds"
                      title="Skip forward 10 seconds"
                    >
                      <span className="text-base">⏩</span>
                    </button>
                  </div>
                  
                  {/* Time indicators - Always visible now */}
                  <div className="flex items-center w-full mt-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mr-2`}>{formatTime(currentTime)}</span>
                    <div 
                      className="flex-1 h-1 bg-gray-700 rounded-full cursor-pointer"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-full bg-red-600 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} ml-2`}>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Additional controls - Responsive for mobile */}
                <div className="flex items-center justify-end flex-1">
                  <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                    <span className="text-base">🔀</span>
                  </button>
                  <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} ml-1`}>
                    <span className="text-base">🔁</span>
                  </button>
                  <div className="flex items-center ml-2 sm:ml-4">
                    <span className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'} mr-2 hidden sm:block`}>🔈</span>
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
                      className="w-16 sm:w-20 accent-red-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </footer>
        )}

        {/* Hidden YouTube player */}
        <div className="absolute w-0 h-0 overflow-hidden">
          {current && (
            <YouTube
              videoId={current.id}
              onReady={(e) => {
                playerRef.current = e.target as unknown as YTLikePlayer;
                playerRef.current?.setVolume?.(volume);
                // Get duration when player is ready
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
                  controls: 0 // Hide YouTube controls since we're using our own
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}