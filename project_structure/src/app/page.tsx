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

  const playerRef = useRef<YTLikePlayer | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches and theme preference from localStorage on component mount
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
    
    // Seek to the new time (this would require YouTube API method)
    // For now, we'll just update our local state
    setCurrentTime(newTime);
    setProgress(pos * 100);
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gradient-to-b from-gray-900 to-black text-white' : 'bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900'}`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-10 ${darkMode ? 'bg-gradient-to-b from-gray-900 to-black/80 border-gray-800' : 'bg-gradient-to-b from-gray-100 to-gray-200/80 border-gray-300'} backdrop-blur-lg border-b`}>
        {/* Top bar with search */}
        <div className="flex items-center px-4 py-3">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center mr-3 shadow-lg ${darkMode ? 'shadow-red-600/30' : 'shadow-red-500/30'}`}>
              <span className="text-white font-bold text-xl">▶</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">YouTube Music</h1>
          </div>
          
          <div className="flex-1 mx-6">
            <form onSubmit={handleSubmit} className="max-w-2xl">
              <div className="relative">
                <input
                  className={`w-full ${darkMode ? 'bg-gray-800/70 text-white' : 'bg-white text-gray-900'} backdrop-blur-sm rounded-full py-3 pl-14 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 shadow-lg`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search songs, albums, artists"
                  aria-label="Search"
                />
                <span className={`absolute left-5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg`}>🔍</span>
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
          
          <div className="flex items-center">
            <button 
              onClick={toggleTheme}
              className={`p-3 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="text-2xl">{darkMode ? "☀️" : "🌙"}</span>
            </button>
            <button className={`p-3 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}>
              <span className="text-2xl">👤</span>
            </button>
          </div>
        </div>
        
        {/* Navigation tabs */}
        <div className="flex overflow-x-auto px-4 py-3 hide-scrollbar border-t border-gray-800">
          {([
            { key: "home", label: "Home" },
            { key: "explore", label: "Explore" },
            { key: "library", label: "Library" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              className={`px-5 py-2 text-sm font-medium whitespace-nowrap rounded-full mx-1 transition-all duration-300 ${
                key === "home" 
                  ? `${darkMode ? 'bg-white text-black' : 'bg-gray-900 text-white'} font-semibold shadow-lg` 
                  : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        {/* Recently Searched Section */}
        {recentSearches.length > 0 && !query && (
          <div className="px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Recently Searched</h2>
              <button 
                onClick={clearRecentSearches}
                className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recentSearches.map((item) => (
                <div
                  key={`${item.id}-${item.timestamp}`}
                  onClick={() => playRecentSearch(item)}
                  className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all duration-300 cursor-pointer group`}
                >
                  <div className="relative mb-4">
                    <div className={`aspect-square rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={computeThumb(item.id)} 
                        alt={item.title} 
                        className="w-full h-full rounded-lg object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className={`w-10 h-10 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                        <span className="text-white">▶</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold truncate">{item.title}</h3>
                  <p className={`text-sm truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Array.isArray(item.artists) && item.artists.length
                      ? item.artists
                          .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                          .filter(Boolean)
                          .join(", ")
                      : "Unknown Artist"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Songs Section */}
        {!query && popularSongs.length > 0 && (
          <div className="px-6 py-6">
            <h2 className="text-2xl font-bold mb-4">Popular Songs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {popularSongs.slice(0, 12).map((song, index) => (
                <div
                  key={song.id}
                  onClick={() => {
                    setResults(popularSongs);
                    setCurrentIndex(index);
                    setIsPlaying(true);
                    // Reset progress when playing a new song
                    setProgress(0);
                    setCurrentTime(0);
                    setDuration(0);
                  }}
                  className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all duration-300 cursor-pointer group`}
                >
                  <div className="relative mb-4">
                    <div className={`aspect-square rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={computeThumb(song.id)} 
                        alt={song.title || "Song"} 
                        className="w-full h-full rounded-lg object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className={`w-10 h-10 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                        <span className="text-white">▶</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold truncate">{song.title || "Untitled"}</h3>
                  <p className={`text-sm truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Array.isArray(song.artists) && song.artists.length
                      ? song.artists
                          .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                          .filter(Boolean)
                          .join(", ")
                      : "Unknown Artist"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Chips */}
        <div className="px-6 py-4">
          <div className="flex overflow-x-auto space-x-3 hide-scrollbar pb-2">
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
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all duration-300 ${
                  filter === key 
                    ? `${darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'} shadow-lg ${darkMode ? 'shadow-red-600/30' : 'shadow-red-500/30'}` 
                    : `${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div className="px-6">
          {error && (
            <div className={`mb-6 p-4 text-sm rounded-xl backdrop-blur-sm border ${darkMode ? 'bg-red-900/30 text-red-200 border-red-800/50' : 'bg-red-100 text-red-800 border-red-200'}`}>
              Error: {error}
            </div>
          )}

          {!loading && filteredResults.length === 0 && !query && recentSearches.length === 0 && popularSongs.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-7xl mb-6 animate-pulse">🎵</div>
              <h2 className="text-2xl font-bold mb-3">Discover Music</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Search for your favorite songs, artists, and albums to get started. Popular tracks will appear here.</p>
            </div>
          )}

          {!loading && filteredResults.length === 0 && query && (
            <div className="py-16 text-center">
              <div className="text-7xl mb-6">🔍</div>
              <h2 className="text-2xl font-bold mb-3">No results found</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Try different search terms or check your spelling</p>
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`rounded-xl p-4 animate-pulse ${darkMode ? 'bg-gray-800/30' : 'bg-gray-200'}`}>
                  <div className={`aspect-square rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <div className={`h-5 rounded w-3/4 mb-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <div className={`h-4 rounded w-1/2 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredResults.map((r, idx) => (
                <div
                  key={r.id}
                  onClick={() => playAt(idx)}
                  className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all duration-300 cursor-pointer group`}
                >
                  <div className="relative mb-4">
                    <div className={`aspect-square rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={computeThumb(r.id)} 
                        alt={r.title ?? "art"} 
                        className="w-full h-full rounded-lg object-cover"
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className={`w-10 h-10 rounded-full ${darkMode ? 'bg-red-600' : 'bg-red-500'} flex items-center justify-center shadow-lg hover:scale-105 transition-transform`}>
                        <span className="text-white">▶</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold truncate" title={r.title ?? "Untitled"}>
                    {r.title ?? "Untitled"}
                  </h3>
                  <p className={`text-sm truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Array.isArray(r.artists) && r.artists.length
                      ? r.artists
                          .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                          .filter(Boolean)
                          .join(", ")
                      : "Unknown Artist"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Bottom Player with Glass Effect */}
      {current && (
        <footer className="fixed bottom-0 left-0 right-0 z-20">
          {/* Progress bar */}
          <div 
            className="h-1 w-full bg-gray-700/30 backdrop-blur-sm cursor-pointer glass-effect"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className={`px-4 py-3 ${darkMode ? 'glass-effect-dark bg-gradient-to-r from-black/20 via-black/10 to-black/20' : 'glass-effect bg-gradient-to-r from-white/20 via-white/10 to-white/20'} border-t shadow-2xl shadow-black/30`}>
            <div className="flex items-center">
              {/* Track info */}
              <div className="flex items-center w-1/4">
                <div className="w-12 h-12 rounded mr-3 shadow-md">
                  {currentThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentThumb} alt="art" className="w-full h-full rounded" />
                  ) : (
                    <div className={`w-full h-full rounded flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <span className="text-lg">♪</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
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
              </div>

              {/* Controls - Enhanced */}
              <div className="flex flex-col items-center w-2/4">
                <div className="flex items-center gap-6">
                  <button
                    onClick={prevTrack}
                    className={`p-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    disabled={!filteredResults.length}
                    aria-label="Previous"
                    title="Previous"
                  >
                    <span className="text-xl">⏮</span>
                  </button>
                  <button
                    onClick={playPause}
                    className={`w-10 h-10 rounded-full ${darkMode ? 'bg-white text-black' : 'bg-gray-900 text-white'} flex items-center justify-center hover:scale-105 transition-transform shadow-lg`}
                    disabled={currentIndex == null}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    <span className="text-lg">{isPlaying ? "⏸" : "▶"}</span>
                  </button>
                  <button
                    onClick={nextTrack}
                    className={`p-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    disabled={!filteredResults.length}
                    aria-label="Next"
                    title="Next"
                  >
                    <span className="text-xl">⏭</span>
                  </button>
                </div>
                {/* Time indicators */}
                <div className="flex items-center w-full mt-2">
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} mr-2`}>{formatTime(currentTime)}</span>
                  <div 
                    className="flex-1 h-1 bg-gray-700/30 rounded-full cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div 
                      className="h-full bg-red-600 rounded-full progress-bar" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} ml-2`}>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Additional controls */}
              <div className="flex items-center justify-end w-1/4">
                <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                  <span className="text-lg">🔀</span>
                </button>
                <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} ml-1`}>
                  <span className="text-lg">🔁</span>
                </button>
                <button className={`p-2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} ml-1`}>
                  <span className="text-lg">♡</span>
                </button>
                <div className="flex items-center ml-4">
                  <span className={darkMode ? 'text-gray-400 mr-2' : 'text-gray-600 mr-2'}>🔈</span>
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
                    className="w-20 accent-red-500"
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
                nextTrack();
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
  );
}