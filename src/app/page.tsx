"use client";

/**
 * YouTube Music Clone - Enhanced UI/UX Version
 * 
 * Features:
 * ✨ Visual Design:
 *   - Beautiful gradients and modern card designs
 *   - Smooth animations and transitions
 *   - Glass effects and shadows
 *   - Responsive design for all screen sizes
 * 
 * 🎵 Playback Features:
 *   - Full-screen now playing view with album art glow effect
 *   - Queue management (add, remove, view, clear)
 *   - Working shuffle mode
 *   - Repeat modes (off, all, one)
 *   - Skip forward/backward 10 seconds
 *   - Progress bar with seeking
 *   - Volume control
 * 
 * 📱 Mobile Experience:
 *   - Swipe gestures (left/right to skip tracks)
 *   - Touch-optimized controls
 *   - Mobile bottom navigation
 *   - Responsive grid layouts
 * 
 * ⌨️ Keyboard Shortcuts:
 *   - Space: Play/Pause
 *   - Arrow keys: Seek, volume, next/prev
 *   - S: Toggle shuffle
 *   - R: Cycle repeat
 *   - L: Like current song
 *   - F: Full screen
 *   - ?: Show shortcuts help
 * 
 * 🎨 User Features:
 *   - Dark/Light mode toggle
 *   - Search suggestions
 *   - Recently played history
 *   - Liked songs collection
 *   - Custom playlists (create, manage)
 *   - Share songs
 *   - Toast notifications
 * 
 * 🔄 Smart Features:
 *   - Auto-play related songs when queue ends
 *   - LocalStorage persistence
 *   - Popular songs recommendations
 */

import { useMemo, useRef, useState, useEffect } from "react";
import YouTube from "react-youtube";
import UserMenu from "@/components/UserMenu";

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
  const [darkMode, setDarkMode] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [likedSongs, setLikedSongs] = useState<YTMusicItem[]>([]);
  const [currentView, setCurrentView] = useState<"home" | "liked" | "recent" | "favorites" | "queue" | "playlists">("home");
  const [queue, setQueue] = useState<YTMusicItem[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const [miniPlayer, setMiniPlayer] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [playlists, setPlaylists] = useState<{id: string, name: string, songs: YTMusicItem[]}[]>([]);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState<{message: string, visible: boolean}>({message: "", visible: false});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [currentLyricsLine, setCurrentLyricsLine] = useState<number>(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);

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
        case 'm':
        case 'M':
          setMiniPlayer(!miniPlayer);
          break;
        case 'f':
        case 'F':
          setFullScreen(!fullScreen);
          break;
        case 's':
        case 'S':
          setShuffle(!shuffle);
          break;
        case 'r':
        case 'R':
          const nextRepeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
          setRepeat(nextRepeat);
          break;
        case 'l':
        case 'L':
          if (current) {
            toggleLikeSong(current);
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardShortcuts(!showKeyboardShortcuts);
          break;
        case 'y':
        case 'Y':
          if (current) {
            setShowLyrics(!showLyrics);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [miniPlayer, fullScreen, shuffle, repeat, currentIndex, volume, showKeyboardShortcuts]);

  // Progress tracking with real-time lyrics sync
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(() => {
        const current = playerRef.current?.getCurrentTime?.() || 0;
        const total = playerRef.current?.getDuration?.() || 0;
        setCurrentTime(current);
        setDuration(total);
        setProgress(total > 0 ? (current / total) * 100 : 0);
        
        // Update current lyrics line based on time with real-time sync
        if (lyrics && lyrics.lines.length > 0) {
          let newLineIndex = 0;
          for (let i = 0; i < lyrics.lines.length; i++) {
            if (lyrics.lines[i].time <= current) {
              newLineIndex = i;
            } else {
              break;
            }
          }
          // Only update if the line actually changed to avoid unnecessary re-renders
          if (newLineIndex !== currentLyricsLine) {
            setCurrentLyricsLine(newLineIndex);
          }
        }
      }, 100); // Changed from 1000ms to 100ms for real-time lyrics sync
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, lyrics, currentLyricsLine]);

  // Auto-scroll to current lyrics line
  useEffect(() => {
    if (lyrics && lyrics.lines.length > 0 && currentLyricsLine < lyricsRefs.current.length) {
      const currentElement = lyricsRefs.current[currentLyricsLine];
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [currentLyricsLine, lyrics]);

  // Search suggestions based on query input
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 2) {
        // Generate suggestions from recent searches and popular terms
        const suggestions: string[] = [];
        
        // Add matching recent searches
        const recentMatches = recentSearches
          .filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (Array.isArray(item.artists) && item.artists.some(artist => {
              const artistName = typeof artist === 'string' ? artist : artist?.name || '';
              return artistName.toLowerCase().includes(query.toLowerCase());
            }))
          )
          .map(item => item.title)
          .slice(0, 3);
        
        suggestions.push(...recentMatches);
        
        // Add popular search terms that match
        const popularTerms = [
          'top hits 2024', 'trending music', 'latest songs',
          'rock music', 'pop hits', 'hip hop', 'electronic music',
          'classical music', 'jazz', 'country music'
        ];
        
        const popularMatches = popularTerms
          .filter(term => term.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 2);
        
        suggestions.push(...popularMatches);
        
        // Remove duplicates and limit to 5 suggestions
        const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 5);
        setSearchSuggestions(uniqueSuggestions);
      } else {
        setSearchSuggestions([]);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(debounceTimer);
  }, [query, recentSearches]);

  const canSearch = useMemo(() => query.trim().length > 1, [query]);

  async function search(q: string) {
    if (!q.trim()) return;
    
    // Close suggestions when searching
    setShowSuggestions(false);
    
    setLoading(true);
    setError(null);
    setCurrentIndex(null);
    
    try {
      // Add music-related keywords to improve search results
      const enhancedQuery = q.trim();
      
      const res = await fetch(`/api/ytmusic?q=${encodeURIComponent(enhancedQuery)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data = (await res.json()) as { items: YTMusicItem[] };
      
      // Filter out results without proper titles or IDs
      const validResults = (data.items || []).filter(item => 
        item.id && item.title && item.title.trim().length > 0
      );
      
      setResults(validResults);
      
      // Add to recent searches if we have results
      if (validResults.length > 0) {
        const newItem: RecentSearchItem = {
          id: validResults[0].id,
          title: validResults[0].title || "Untitled",
          artists: validResults[0].artists || [],
          timestamp: Date.now()
        };
        
        // Update recent searches, keeping only the latest 10 and avoiding duplicates
        setRecentSearches(prev => {
          const filtered = prev.filter(item => item.id !== newItem.id);
          return [newItem, ...filtered].slice(0, 10);
        });
      }
      
      // Show toast if no results found
      if (validResults.length === 0) {
        setToast({ message: `No results found for "${q}"`, visible: true });
        setTimeout(() => setToast({ message: "", visible: false }), 3000);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
      setToast({ message: `Search error: ${message}`, visible: true });
      setTimeout(() => setToast({ message: "", visible: false }), 3000);
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
      showToast("Removed from liked songs");
    } else {
      // Add to liked songs
      setLikedSongs(prev => [...prev, song]);
      showToast(`"${song.title}" added to liked songs`);
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
    setCurrentLyricsLine(0);
    
    // Fetch lyrics for the new song
    const song = results[index];
    if (song) {
      const artistName = Array.isArray(song.artists) && song.artists.length
        ? song.artists
            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
            .filter(Boolean)
            .join(", ")
        : "Unknown Artist";
      
      fetchLyrics(song.id, song.title || "Untitled", artistName);
    }
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
    setCurrentLyricsLine(0);
    
    // Fetch lyrics for the song
    const artistName = Array.isArray(item.artists) && item.artists.length
      ? item.artists
          .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
          .filter(Boolean)
          .join(", ")
      : "Unknown Artist";
    
    fetchLyrics(item.id, item.title, artistName);
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
    
    // Check queue first
    if (queue.length > 0) {
      const nextSong = queue[0];
      setQueue(prev => prev.slice(1));
      // Add to results if not already there
      if (!results.find(r => r.id === nextSong.id)) {
        setResults(prev => [...prev, nextSong]);
        setCurrentIndex(results.length);
      } else {
        const idx = results.findIndex(r => r.id === nextSong.id);
        setCurrentIndex(idx);
      }
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setCurrentLyricsLine(0);
      
      // Fetch lyrics for the new song
      const artistName = Array.isArray(nextSong.artists) && nextSong.artists.length
        ? nextSong.artists
            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
            .filter(Boolean)
            .join(", ")
        : "Unknown Artist";
      
      fetchLyrics(nextSong.id, nextSong.title || "Untitled", artistName);
      return;
    }

    // Handle shuffle
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * results.length);
      setCurrentIndex(randomIndex);
    } else {
      setCurrentIndex((idx) => {
        const i = typeof idx === "number" ? idx : -1;
        const n = (i + 1) % results.length;
        return n;
      });
    }
    setIsPlaying(true);
    // Reset progress when playing a new song
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }

  function prevTrack() {
    if (!results.length) return;
    
    // Handle shuffle
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * results.length);
      setCurrentIndex(randomIndex);
      const song = results[randomIndex];
      if (song) {
        const artistName = Array.isArray(song.artists) && song.artists.length
          ? song.artists
              .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
              .filter(Boolean)
              .join(", ")
          : "Unknown Artist";
        
        fetchLyrics(song.id, song.title || "Untitled", artistName);
      }
    } else {
      setCurrentIndex((idx) => {
        const i = typeof idx === "number" ? idx : 0;
        const p = (i - 1 + results.length) % results.length;
        const song = results[p];
        if (song) {
          const artistName = Array.isArray(song.artists) && song.artists.length
            ? song.artists
                .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                .filter(Boolean)
                .join(", ")
            : "Unknown Artist";
          
          fetchLyrics(song.id, song.title || "Untitled", artistName);
        }
        return p;
      });
    }
    setIsPlaying(true);
    // Reset progress when playing a new song
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setCurrentLyricsLine(0);
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

  // Show toast notification
  function showToast(message: string) {
    setToast({message, visible: true});
    setTimeout(() => {
      setToast({message: "", visible: false});
    }, 3000);
  }

  // Add song to queue
  function addToQueue(song: YTMusicItem) {
    setQueue(prev => [...prev, song]);
    showToast(`Added "${song.title}" to queue`);
  }

  // Remove song from queue
  function removeFromQueue(index: number) {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }

  // Clear queue
  function clearQueue() {
    setQueue([]);
  }

  // Play song from queue
  function playFromQueue(index: number) {
    const song = queue[index];
    removeFromQueue(index);
    // Add to results if not already there
    if (!results.find(r => r.id === song.id)) {
      setResults(prev => [...prev, song]);
      setCurrentIndex(results.length);
    } else {
      const idx = results.findIndex(r => r.id === song.id);
      setCurrentIndex(idx);
    }
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }

  // Create new playlist
  function createPlaylist(name: string) {
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      songs: []
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setShowCreatePlaylist(false);
    setNewPlaylistName("");
    showToast(`Playlist "${name}" created!`);
  }


  // Share song
  function shareSong(song: YTMusicItem) {
    const url = `https://music.youtube.com/watch?v=${song.id}`;
    if (navigator.share) {
      navigator.share({
        title: song.title || "Check out this song!",
        text: `Listen to ${song.title || "this song"} on YouTube Music`,
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard!");
    }
  }

  // Generate search suggestions
  useEffect(() => {
    if (query.trim().length > 1) {
      // Mock suggestions - in a real app, you'd fetch these from an API
      const mockSuggestions = [
        `${query} songs`,
        `${query} music`,
        `${query} official`,
        `${query} remix`,
        `${query} live`,
      ];
      setSearchSuggestions(mockSuggestions);
    } else {
      setSearchSuggestions([]);
    }
  }, [query]);

  // Handle swipe gestures on mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && current) {
      nextTrack();
    }
    if (isRightSwipe && current) {
      prevTrack();
    }
  };

  // Function to fetch lyrics for a song
  async function fetchLyrics(songId: string, title: string, artist: string) {
    if (!songId || !title || !artist) return;
    
    // Clear existing lyrics and show loading
    setLyrics(null);
    setCurrentLyricsLine(0);
    setLyricsLoading(true);
    
    try {
      const response = await fetch(`/api/lyrics?songId=${encodeURIComponent(songId)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      if (response.ok) {
        const data = await response.json();
        setLyrics(data);
        setCurrentLyricsLine(0);
      } else {
        console.error('Failed to fetch lyrics');
        // Set fallback lyrics instead of null
        setLyrics({
          lines: generateFallbackLyrics(title, artist),
          hasLyrics: false,
          source: 'fallback'
        });
      }
    } catch (error) {
      console.error('Error fetching lyrics:', error);
      // Set fallback lyrics instead of null
      setLyrics({
        lines: generateFallbackLyrics(title, artist),
        hasLyrics: false,
        source: 'fallback'
      });
    } finally {
      setLyricsLoading(false);
    }
  }

  // Helper function to generate fallback lyrics (moved from API)
  function generateFallbackLyrics(title: string, artist: string): LyricsLine[] {
    return [
      { time: 0, text: `♪ ${title} ♪` },
      { time: 3, text: `by ${artist}` },
      { time: 6, text: "" },
      { time: 8, text: "♪ ♪ ♪" },
      { time: 11, text: "♪ ♪ ♪" },
      { time: 14, text: "♪ ♪ ♪" },
      { time: 17, text: "" },
      { time: 19, text: `♪ ${title} ♪` },
      { time: 22, text: "♪ ♪ ♪" },
      { time: 25, text: "♪ ♪ ♪" },
      { time: 28, text: "♪ ♪ ♪" },
      { time: 31, text: "" },
      { time: 33, text: "♪ Instrumental ♪" },
      { time: 36, text: "♪ ♪ ♪" },
      { time: 39, text: "♪ ♪ ♪" },
      { time: 42, text: "♪ ♪ ♪" },
      { time: 45, text: "" },
      { time: 47, text: `♪ ${title} ♪` },
      { time: 50, text: "♪ ♪ ♪" },
      { time: 53, text: "♪ ♪ ♪" },
      { time: 56, text: "♪ ♪ ♪" },
      { time: 59, text: "" },
      { time: 61, text: "♪ Outro ♪" },
      { time: 64, text: "♪ ♪ ♪" },
      { time: 67, text: "♪ ♪ ♪" },
      { time: 70, text: "♪ ♪ ♪" },
      { time: 73, text: "" },
      { time: 75, text: "♪ Fade out ♪" },
    ];
  }

  // Function to play a related song when the current one ends
  async function playRelatedSong() {
    if (!current) return;
    
    // Handle repeat one
    if (repeat === "one") {
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);
      playerRef.current?.seekTo?.(0, true);
      playerRef.current?.playVideo?.();
      return;
    }

    // Handle repeat all or no repeat
    if (repeat === "all" || currentIndex !== null && currentIndex < results.length - 1) {
      nextTrack();
      return;
    }
    
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
    <div className={`flex h-screen ${darkMode ? 'bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900'} smooth-scroll overflow-hidden`}>
      {/* Full Screen Now Playing View - Enhanced */}
      {fullScreen && current && (
        <div className={`fixed inset-0 z-50 ${darkMode ? 'bg-gradient-to-br from-gray-950 via-black to-gray-950' : 'bg-gradient-to-br from-white via-gray-50 to-white'} flex flex-col backdrop-blur-3xl`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6">
            <button 
              onClick={() => setFullScreen(false)}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
            >
              <span className="text-2xl">↓</span>
            </button>
            <div className="text-sm font-medium opacity-70">NOW PLAYING</div>
            <button 
              onClick={() => current && shareSong(current)}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
            >
              <span className="text-xl">🔗</span>
            </button>
          </div>

          {/* Album Art - Enhanced with better effects */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
            <div className="relative w-full max-w-md aspect-square">
              {currentThumb ? (
                <div className="relative w-full h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={currentThumb} 
                    alt={current?.title || "Now Playing"} 
                    className={`w-full h-full rounded-3xl shadow-2xl object-cover ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''} border-4 ${darkMode ? 'border-gray-800/50' : 'border-white/50'}`}
                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                  />
                  {/* Enhanced Glow effect with multiple layers */}
                  <div 
                    className="absolute inset-0 rounded-3xl blur-3xl opacity-40 -z-10 animate-pulse"
                    style={{ 
                      backgroundImage: `url(${currentThumb})`,
                      backgroundSize: 'cover',
                      filter: 'blur(80px) saturate(150%)',
                      transform: 'scale(1.2)'
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-3xl blur-2xl opacity-20 -z-10"
                    style={{ 
                      background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)',
                      transform: 'scale(1.3)'
                    }}
                  />
                </div>
              ) : (
                <div className={`w-full h-full rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center shadow-2xl`}>
                  <span className="text-6xl">♪</span>
                </div>
              )}
            </div>
          </div>

          {/* Song Info */}
          <div className="px-4 sm:px-8 text-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{current?.title || "Untitled"}</h1>
            <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {Array.isArray(current?.artists) && current?.artists.length
                ? current!.artists
                    .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                    .filter(Boolean)
                    .join(", ")
                : "Unknown Artist"}
            </p>
            
            {/* Lyrics Toggle Button */}
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              disabled={lyricsLoading}
              className={`mt-4 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showLyrics 
                  ? 'bg-red-500 text-white' 
                  : darkMode 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${lyricsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {lyricsLoading ? '⏳ Loading Lyrics...' : showLyrics ? '🎵 Hide Lyrics' : '🎵 Show Lyrics'}
            </button>
          </div>

          {/* Enhanced Lyrics Display */}
          {showLyrics && lyrics && (
            <div className="px-4 sm:px-8 mb-6 max-h-80 overflow-y-auto">
              <div className="relative">
                {/* Lyrics Container with better spacing and typography */}
                <div className="text-center space-y-3 sm:space-y-4">
                  {lyrics.lines.map((line, index) => (
                    <div
                      key={index}
                      ref={(el) => { lyricsRefs.current[index] = el; }}
                      className={`transition-all duration-500 ease-in-out transform ${
                        index === currentLyricsLine
                          ? `${darkMode ? 'text-white' : 'text-black'} font-bold text-lg sm:text-xl scale-105`
                          : `${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm sm:text-base opacity-60`
                      } ${
                        index === currentLyricsLine 
                          ? 'drop-shadow-lg' 
                          : 'hover:opacity-80'
                      }`}
                      style={{
                        textShadow: index === currentLyricsLine 
                          ? darkMode 
                            ? '0 0 20px rgba(255, 255, 255, 0.3)' 
                            : '0 0 20px rgba(0, 0, 0, 0.2)'
                          : 'none'
                      }}
                    >
                      {line.text || (index === currentLyricsLine ? '♪' : '')}
                    </div>
                  ))}
                  
                  {/* Enhanced empty state */}
                  {lyrics.lines.length === 0 && (
                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-4xl mb-2">🎵</div>
                      <div className="text-sm">No lyrics available for this song</div>
                    </div>
                  )}
                  
                  {/* Enhanced fallback notice */}
                  {!lyrics.hasLyrics && lyrics.source === 'fallback' && (
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-4 px-4 py-2 rounded-full bg-opacity-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      * Generated lyrics - actual lyrics not available
                    </div>
                  )}
                </div>
                
                {/* Progress indicator for lyrics */}
                {lyrics.lines.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <div className={`w-32 h-1 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${darkMode ? 'bg-white' : 'bg-black'}`}
                        style={{ width: `${(currentLyricsLine / lyrics.lines.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="px-4 sm:px-8 mb-6">
            <div 
              className={`h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-300'} rounded-full cursor-pointer`}
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm opacity-70">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="px-4 sm:px-8 pb-8 sm:pb-12">
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={`p-3 rounded-full transition-all ${shuffle ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span className="text-2xl">🔀</span>
              </button>
              
              <button
                onClick={prevTrack}
                className={`p-3 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span className="text-3xl">⏮</span>
              </button>
              
              <button
                onClick={playPause}
                className={`w-16 h-16 rounded-full ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center hover:scale-110 transition-transform shadow-2xl`}
              >
                <span className="text-2xl">{isPlaying ? "⏸" : "▶"}</span>
              </button>
              
              <button
                onClick={nextTrack}
                className={`p-3 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span className="text-3xl">⏭</span>
              </button>
              
              <button
                onClick={() => {
                  const nextRepeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
                  setRepeat(nextRepeat);
                }}
                className={`p-3 rounded-full transition-all ${repeat !== "off" ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <span className="text-2xl">{repeat === "one" ? "🔂" : "🔁"}</span>
              </button>
            </div>

            {/* Additional Actions */}
            <div className="flex items-center justify-center gap-4 text-sm">
              <button 
                onClick={() => current && toggleLikeSong(current)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${isSongLiked(current?.id || '') ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-white bg-gray-800' : 'text-gray-600 hover:text-gray-900 bg-gray-200'} transition-all`}
              >
                <span>{isSongLiked(current?.id || '') ? '♥' : '♡'}</span>
                <span>Like</span>
              </button>
              <button 
                onClick={() => setCurrentView("queue")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition-all`}
              >
                <span>📋</span>
                <span>Queue ({queue.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Sidebar with Grid Layout */}
      <aside className={`${sidebarCollapsed ? 'w-16 md:w-64' : 'w-64'} ${darkMode ? 'bg-gradient-to-b from-gray-950 via-gray-900 to-black border-gray-800/50' : 'bg-gradient-to-b from-white via-gray-50 to-gray-100 border-gray-200/50'} border-r flex flex-col transition-all duration-300 hidden md:flex shadow-2xl backdrop-blur-sm`}>
        {/* Enhanced Logo and collapse button with better design */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-800/30' : 'border-gray-200/30'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-pink-600 flex items-center justify-center mr-3 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 hover:scale-105">
                <span className="text-white font-bold text-lg">▶</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow-lg">YT Music</h1>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-pink-600 flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 hover:scale-105">
              <span className="text-white font-bold text-lg">▶</span>
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-200/50'} transition-all duration-200 hover:scale-110`}
          >
            <span className="text-lg">{sidebarCollapsed ? '▶' : '◀'}</span>
          </button>
        </div>

        {/* Enhanced Search in sidebar when collapsed */}
        {sidebarCollapsed && (
          <div className="px-3 mb-4">
            <form onSubmit={handleSubmit} className="relative">
              <input
                className={`w-full ${darkMode ? 'bg-gray-800/50 text-white' : 'bg-gray-100/50 text-gray-900'} rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 backdrop-blur-sm border ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search"
              />
            </form>
          </div>
        )}

        {/* Enhanced Navigation with Grid Layout */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-2 px-3">
            {([
              { key: "home", label: "Home", icon: "🏠", view: "home" },
              { key: "explore", label: "Explore", icon: "🔍", view: "home" },
              { key: "library", label: "Library", icon: "📚", view: "liked" },
              { key: "queue", label: "Queue", icon: "📋", view: "queue", badge: queue.length },
            ] as const).map((item) => {
              const { key, label, icon, view } = item;
              const badge = 'badge' in item ? item.badge : null;
              return (
              <button
                key={key}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-300 relative rounded-2xl group ${
                  currentView === view
                    ? `${darkMode ? 'text-white bg-gradient-to-r from-red-500/25 to-pink-500/25 border border-red-500/40 shadow-lg shadow-red-500/20' : 'text-black bg-gradient-to-r from-red-100 to-pink-100 border border-red-300 shadow-lg shadow-red-200/30'} font-semibold` 
                    : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 border border-transparent'} hover:scale-105 hover:shadow-md`
                }`}
                onClick={() => setCurrentView(view as typeof currentView)}
              >
                <span className={`text-lg mr-4 transition-all duration-300 ${currentView === view ? 'scale-110' : 'group-hover:scale-125 group-hover:rotate-6'}`}>{icon}</span>
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left">{label}</span>
                )}
                {badge !== undefined && badge > 0 && !sidebarCollapsed && (
                  <span className={`ml-auto px-2 py-1 text-xs rounded-full font-bold ${darkMode ? 'bg-red-600 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg'} animate-pulse`}>
                    {badge}
                  </span>
                )}
              </button>
              );
            })}
          </div>

          {/* Library section */}
          {!sidebarCollapsed && (
            <div className="mt-8">
              <div className="flex items-center justify-between px-4 py-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Playlists
                </div>
                <button
                  onClick={() => setShowCreatePlaylist(true)}
                  className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
                  title="Create playlist"
                >
                  <span className="text-lg">➕</span>
                </button>
              </div>
              {[
                { id: "liked", name: "Liked songs", count: `${likedSongs.length} songs` },
                { id: "recent", name: "Recently played", count: `${recentSearches.length} songs` },
              ].map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setCurrentView(playlist.id as "liked" | "recent")}
                  className={`flex items-center w-full px-4 py-3 text-sm transition-colors ${
                    currentView === playlist.id
                      ? `${darkMode ? 'text-white bg-gray-900' : 'text-black bg-gray-200'} font-semibold`
                      : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`
                  }`}
                >
                  <span className="text-lg mr-4">
                    {playlist.id === "liked" ? "♥" : "🕒"}
                  </span>
                  <div className="text-left">
                    <div className="font-medium">{playlist.name}</div>
                    <div className="text-xs opacity-70">{playlist.count}</div>
                  </div>
                </button>
              ))}
              {/* User Playlists */}
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => {
                    setCurrentView("playlists");
                    // You would set a selected playlist state here
                  }}
                  className={`flex items-center w-full px-4 py-3 text-sm transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg mr-4">🎵</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium truncate">{playlist.name}</div>
                    <div className="text-xs opacity-70">{playlist.songs.length} songs</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* Enhanced User profile */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800/50">
            <div className="flex items-center w-full">
              <UserMenu />
            </div>
          </div>
        )}
      </aside>

      {/* Enhanced Mobile Navigation with modern design */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20">
        <div className={`grid grid-cols-3 items-center py-3 px-4 ${darkMode ? 'bg-gradient-to-t from-black via-gray-950 to-gray-900/95 border-t border-gray-800/30' : 'bg-gradient-to-t from-white via-gray-50 to-gray-100/95 border-t border-gray-200/30'} backdrop-blur-2xl shadow-2xl`}>
          {([
            { key: "home", icon: "🏠", label: "Home" },
            { key: "explore", icon: "🔍", label: "Search" },
            { key: "library", icon: "📚", label: "Library" },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => {
                if (key === "library") {
                  setCurrentView("liked");
                } else {
                  setCurrentView("home");
                }
              }}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all duration-300 active:scale-95 ${
                key === "home" && currentView === "home" || key === "library" && currentView !== "home" 
                  ? `${darkMode ? 'text-white bg-gradient-to-t from-red-500/30 to-pink-500/30 shadow-lg shadow-red-500/20' : 'text-black bg-gradient-to-t from-red-100 to-pink-100 shadow-lg shadow-red-200/30'} scale-105` 
                  : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800/60' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'} hover:scale-105`
              }`}
            >
              <span className={`text-2xl mb-1 transition-transform duration-300 ${key === "home" && currentView === "home" || key === "library" && currentView !== "home" ? 'scale-110' : ''}`}>{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Enhanced with glassmorphism and better spacing */}
        <header className={`sticky top-0 z-10 ${darkMode ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-xl border-b ${darkMode ? 'border-gray-800/50' : 'border-gray-200/50'} shadow-sm`}>
          <div className="flex items-center px-4 py-4">
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
            
            {/* Search Bar - Enhanced with modern styling */}
            <div className="flex-1 max-w-2xl">
              <form onSubmit={handleSubmit} className="relative">
                <div className={`relative rounded-full ${darkMode ? 'bg-gray-900/60' : 'bg-gray-100/60'} hover:${darkMode ? 'bg-gray-800/80' : 'bg-gray-200/80'} transition-all duration-300 backdrop-blur-sm border ${darkMode ? 'border-gray-700/30' : 'border-gray-300/30'} hover:border-red-500/50`}>
                  <input
                    className={`w-full ${darkMode ? 'bg-transparent text-white placeholder-gray-400' : 'bg-transparent text-gray-900 placeholder-gray-500'} rounded-full py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-500/50' : 'focus:ring-red-400/50'} transition-all`}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search songs, albums, artists"
                    aria-label="Search"
                  />
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-base`}>🔍</span>
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setShowSuggestions(false);
                      }}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                {/* Search Suggestions - Enhanced with modern styling */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-2 ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden z-50 border ${darkMode ? 'border-gray-700/50' : 'border-gray-300/50'} slide-in-bottom`}>
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setQuery(suggestion);
                          search(suggestion);
                          setShowSuggestions(false);
                        }}
                        className={`w-full text-left px-5 py-3.5 text-sm ${darkMode ? 'hover:bg-gray-800/70' : 'hover:bg-gray-100/70'} transition-all duration-200 flex items-center gap-3 ${index === 0 ? 'rounded-t-2xl' : ''} ${index === searchSuggestions.length - 1 ? 'rounded-b-2xl' : ''} hover:translate-x-1`}
                      >
                        <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>🔍</span>
                        <span className="flex-1">{suggestion}</span>
                        <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>↵</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
            
            {/* User Actions - Enhanced with better hover effects */}
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => setShowKeyboardShortcuts(true)}
                className={`p-2.5 rounded-full ${darkMode ? 'hover:bg-gray-800/70' : 'hover:bg-gray-200/70'} transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border ${darkMode ? 'border-transparent hover:border-gray-700' : 'border-transparent hover:border-gray-300'} hidden sm:block`}
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <span className="text-lg">⌨️</span>
              </button>
              <button 
                onClick={toggleTheme}
                className={`p-2.5 rounded-full ${darkMode ? 'hover:bg-gray-800/70' : 'hover:bg-gray-200/70'} transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm border ${darkMode ? 'border-transparent hover:border-gray-700' : 'border-transparent hover:border-gray-300'}`}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span className="text-lg">{darkMode ? "☀️" : "🌙"}</span>
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Enhanced Lyrics Panel - Toggleable overlay with grid layout */}
        {showLyrics && lyrics && !fullScreen && (
          <div className={`fixed inset-0 z-30 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' : 'bg-gradient-to-br from-white via-gray-50 to-white'} backdrop-blur-md`}>
            <div className="grid grid-rows-[auto_1fr] h-full">
              {/* Enhanced Header with better typography */}
              <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} backdrop-blur-sm`}>
                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                    Lyrics
                  </h2>
                  <p className="text-sm sm:text-base opacity-80 mt-1 truncate">
                    {current?.title} - {Array.isArray(current?.artists) && current?.artists.length
                      ? current!.artists
                          .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                          .filter(Boolean)
                          .join(", ")
                      : "Unknown Artist"}
                  </p>
                </div>
                <button
                  onClick={() => setShowLyrics(false)}
                  className={`p-3 rounded-full transition-all duration-200 ${darkMode ? 'hover:bg-gray-800 hover:scale-110' : 'hover:bg-gray-200 hover:scale-110'}`}
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
              
              {/* Enhanced Lyrics Content with better grid layout */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-6">
                  {/* Lyrics Grid Container */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Lyrics Display */}
                    <div className="lg:col-span-2">
                      <div className="text-center space-y-4 sm:space-y-6">
                        {lyrics.lines.map((line, index) => (
                          <div
                            key={index}
                            ref={(el) => { lyricsRefs.current[index] = el; }}
                            className={`transition-all duration-500 ease-in-out transform ${
                              index === currentLyricsLine
                                ? `${darkMode ? 'text-white' : 'text-black'} font-bold text-xl sm:text-2xl scale-105`
                                : `${darkMode ? 'text-gray-400' : 'text-gray-500'} text-lg sm:text-xl opacity-60`
                            } ${
                              index === currentLyricsLine 
                                ? 'drop-shadow-2xl' 
                                : 'hover:opacity-80 hover:scale-102'
                            }`}
                            style={{
                              textShadow: index === currentLyricsLine 
                                ? darkMode 
                                  ? '0 0 30px rgba(255, 255, 255, 0.4)' 
                                  : '0 0 30px rgba(0, 0, 0, 0.3)'
                                : 'none'
                            }}
                          >
                            {line.text || (index === currentLyricsLine ? '♪' : '')}
                          </div>
                        ))}
                        
                        {/* Enhanced empty state */}
                        {lyrics.lines.length === 0 && (
                          <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <div className="text-6xl mb-4">🎵</div>
                            <div className="text-xl">No lyrics available for this song</div>
                          </div>
                        )}
                        
                        {/* Enhanced fallback notice */}
                        {!lyrics.hasLyrics && lyrics.source === 'fallback' && (
                          <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-6 px-6 py-3 rounded-full bg-opacity-20 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            * Generated lyrics - actual lyrics not available
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Sidebar with song info and progress */}
                    <div className="lg:col-span-1">
                      <div className={`sticky top-6 ${darkMode ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm rounded-2xl p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {/* Song Info */}
                        <div className="text-center mb-6">
                          <div className="text-4xl mb-4">🎵</div>
                          <h3 className="text-lg font-bold mb-2">{current?.title}</h3>
                          <p className="text-sm opacity-70">
                            {Array.isArray(current?.artists) && current?.artists.length
                              ? current!.artists
                                  .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                                  .filter(Boolean)
                                  .join(", ")
                              : "Unknown Artist"}
                          </p>
                        </div>
                        
                        {/* Lyrics Progress */}
                        {lyrics.lines.length > 0 && (
                          <div className="space-y-4">
                            <div className="text-sm font-medium opacity-70">Lyrics Progress</div>
                            <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r from-red-500 to-pink-500`}
                                style={{ width: `${(currentLyricsLine / lyrics.lines.length) * 100}%` }}
                              />
                            </div>
                            <div className="text-xs opacity-60 text-center">
                              {currentLyricsLine + 1} of {lyrics.lines.length} lines
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Content Area with Grid Layout */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 md:pb-32 smooth-scroll">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 gap-6">
          {/* Create Playlist Modal */}
          {showCreatePlaylist && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
                <h2 className="text-2xl font-bold mb-4">Create Playlist</h2>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name"
                  className={`w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newPlaylistName.trim()) {
                      createPlaylist(newPlaylistName.trim());
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreatePlaylist(false);
                      setNewPlaylistName("");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (newPlaylistName.trim()) {
                        createPlaylist(newPlaylistName.trim());
                      }
                    }}
                    disabled={!newPlaylistName.trim()}
                    className={`flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts Modal */}
          {showKeyboardShortcuts && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setShowKeyboardShortcuts(false)}>
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                  <button
                    onClick={() => setShowKeyboardShortcuts(false)}
                    className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} transition-colors`}
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-500">Playback</h3>
                    <div className="space-y-2">
                      {[
                        { key: "Space", action: "Play/Pause" },
                        { key: "→", action: "Skip forward 10 seconds" },
                        { key: "←", action: "Skip backward 10 seconds" },
                        { key: "Shift + →", action: "Next track" },
                        { key: "Shift + ←", action: "Previous track" },
                      ].map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{shortcut.action}</span>
                          <kbd className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} font-mono text-sm`}>{shortcut.key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-500">Volume</h3>
                    <div className="space-y-2">
                      {[
                        { key: "↑", action: "Increase volume" },
                        { key: "↓", action: "Decrease volume" },
                      ].map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{shortcut.action}</span>
                          <kbd className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} font-mono text-sm`}>{shortcut.key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-red-500">Navigation & Features</h3>
                    <div className="space-y-2">
                      {[
                        { key: "M", action: "Toggle mini player" },
                        { key: "F", action: "Toggle full screen" },
                        { key: "S", action: "Toggle shuffle" },
                        { key: "R", action: "Cycle repeat mode" },
                        { key: "L", action: "Like current song" },
                        { key: "Y", action: "Toggle lyrics display" },
                        { key: "?", action: "Show this help" },
                      ].map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>{shortcut.action}</span>
                          <kbd className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} font-mono text-sm`}>{shortcut.key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                    💡 Tip: Swipe left/right on mobile to skip tracks
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Queue View */}
          {currentView === "queue" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Queue</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{queue.length} songs in queue</p>
                </div>
                {queue.length > 0 && (
                  <button 
                    onClick={clearQueue}
                    className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'} transition-colors text-sm font-medium`}
                  >
                    Clear Queue
                  </button>
                )}
              </div>

              {queue.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-bold mb-2">Queue is Empty</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Add songs to your queue to play them next
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className={`flex items-center gap-4 p-3 rounded-lg ${darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-100'} transition-all group`}
                    >
                      <div className="text-sm opacity-50 w-6 text-center">{index + 1}</div>
                      <div className="w-12 h-12 rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(song.id)} 
                          alt={song.title || "Song"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span>♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{song.title || "Untitled"}</div>
                        <div className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {Array.isArray(song.artists) && song.artists.length
                            ? song.artists
                                .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                                .filter(Boolean)
                                .join(", ")
                            : "Unknown Artist"}
                        </div>
                      </div>
                      <button
                        onClick={() => playFromQueue(index)}
                        className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} opacity-0 group-hover:opacity-100 transition-all`}
                      >
                        <span className="text-lg">▶</span>
                      </button>
                      <button
                        onClick={() => removeFromQueue(index)}
                        className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} opacity-0 group-hover:opacity-100 transition-all`}
                      >
                        <span className="text-lg">✕</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                {likedSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className={`rounded-2xl p-4 ${darkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:from-gray-800/90 hover:to-gray-700/90' : 'bg-white/80 hover:bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-700/50 hover:border-gray-600/50' : 'border-gray-200/50 hover:border-gray-300/50'} shadow-lg hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 cursor-pointer group relative overflow-hidden hover:scale-105 hover:-translate-y-2`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <div 
                      className="relative"
                      onClick={() => {
                        setResults(likedSongs);
                        setCurrentIndex(index);
                        setIsPlaying(true);
                        setProgress(0);
                        setCurrentTime(0);
                        setDuration(0);
                      }}
                    >
                      <div className={`aspect-square rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'} shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(song.id)} 
                          alt={song.title || "Song"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                          <span className="text-white">▶</span>
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold truncate text-sm mt-3 relative z-10 group-hover:text-red-500 transition-colors duration-300">{song.title || "Untitled"}</h3>
                    <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} relative z-10 transition-colors duration-300`}>
                      {Array.isArray(song.artists) && song.artists.length
                        ? song.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 relative z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeSong(song);
                        }}
                        className="text-xs text-red-500 transition-colors"
                      >
                        <span>♥</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(song);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                        title="Add to queue"
                      >
                        <span>➕</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          shareSong(song);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors ml-auto`}
                        title="Share"
                      >
                        <span>🔗</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show Recent Playlist when "recent" is selected */}
          {currentView === "recent" && recentSearches.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <h2 className="text-xl sm:text-2xl font-bold">Recently Played</h2>
                </div>
                <button 
                  onClick={clearRecentSearches}
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                >
                  Clear all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                {recentSearches.map((item) => (
                  <div
                    key={`${item.id}-${item.timestamp}`}
                    className={`rounded-2xl p-4 ${darkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:from-gray-800/90 hover:to-gray-700/90' : 'bg-white/80 hover:bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-700/50 hover:border-gray-600/50' : 'border-gray-200/50 hover:border-gray-300/50'} shadow-lg hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 cursor-pointer group relative overflow-hidden hover:scale-105 hover:-translate-y-2`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <div 
                      className="relative"
                      onClick={() => playRecentSearch(item)}
                    >
                      <div className={`aspect-square rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'} shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(item.id)} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                          <span className="text-white">▶</span>
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-medium truncate text-sm mt-3 relative z-10">{item.title}</h3>
                    <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'} relative z-10`}>
                      {Array.isArray(item.artists) && item.artists.length
                        ? item.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 relative z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const songItem: YTMusicItem = { id: item.id, title: item.title, artists: item.artists };
                          toggleLikeSong(songItem);
                        }}
                        className={`text-xs ${isSongLiked(item.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                      >
                        <span>{isSongLiked(item.id) ? '♥' : '♡'}</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const songItem: YTMusicItem = { id: item.id, title: item.title, artists: item.artists };
                          addToQueue(songItem);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                        title="Add to queue"
                      >
                        <span>➕</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const songItem: YTMusicItem = { id: item.id, title: item.title, artists: item.artists };
                          shareSong(songItem);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors ml-auto`}
                        title="Share"
                      >
                        <span>🔗</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show message when "recent" is selected but empty */}
          {currentView === "recent" && recentSearches.length === 0 && (
            <div className="py-16 text-center">
              <div className="flex items-center justify-center mb-4">
                <button 
                  onClick={goBack}
                  className={`p-2 mr-4 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                  <span className="text-lg">←</span>
                </button>
                <div className="text-5xl sm:text-6xl">🕒</div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">No Recent Plays</h2>
              <p className={`px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Songs you listen to will appear here.
              </p>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                {recentSearches.map((item) => (
                  <div
                    key={`${item.id}-${item.timestamp}`}
                    className={`rounded-2xl p-4 ${darkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:from-gray-800/90 hover:to-gray-700/90' : 'bg-white/80 hover:bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-700/50 hover:border-gray-600/50' : 'border-gray-200/50 hover:border-gray-300/50'} shadow-lg hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 cursor-pointer group relative overflow-hidden hover:scale-105 hover:-translate-y-2`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <div className="relative" onClick={() => playRecentSearch(item)}>
                      <div className={`aspect-square rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'} shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(item.id)} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                          <span className="text-white">▶</span>
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-medium truncate text-sm mt-3 relative z-10">{item.title}</h3>
                    <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'} relative z-10`}>
                      {Array.isArray(item.artists) && item.artists.length
                        ? item.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 relative z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const songItem: YTMusicItem = {
                            id: item.id,
                            title: item.title,
                            artists: item.artists
                          };
                          toggleLikeSong(songItem);
                        }}
                        className={`text-xs ${isSongLiked(item.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                      >
                        <span>{isSongLiked(item.id) ? '♥' : '♡'}</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const songItem: YTMusicItem = {
                            id: item.id,
                            title: item.title,
                            artists: item.artists
                          };
                          addToQueue(songItem);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                        title="Add to queue"
                      >
                        <span>➕</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const songItem: YTMusicItem = {
                            id: item.id,
                            title: item.title,
                            artists: item.artists
                          };
                          shareSong(songItem);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors ml-auto`}
                        title="Share"
                      >
                        <span>🔗</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Songs Section - Only show on home view */}
          {currentView === "home" && !query && popularSongs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Popular Songs</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                {popularSongs.slice(0, 24).map((song, index) => (
                  <div
                    key={song.id}
                    className={`rounded-2xl p-4 ${darkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:from-gray-800/90 hover:to-gray-700/90' : 'bg-white/80 hover:bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-700/50 hover:border-gray-600/50' : 'border-gray-200/50 hover:border-gray-300/50'} shadow-lg hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 cursor-pointer group relative overflow-hidden hover:scale-105 hover:-translate-y-2`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    
                    <div 
                      className="relative"
                      onClick={() => {
                        setResults(popularSongs);
                        setCurrentIndex(index);
                        setIsPlaying(true);
                        setProgress(0);
                        setCurrentTime(0);
                        setDuration(0);
                      }}
                    >
                      <div className={`aspect-square rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'} shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={computeThumb(song.id)} 
                          alt={song.title || "Song"} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                          }}
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                          <span className="text-white">▶</span>
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold truncate text-sm mt-3 relative z-10 group-hover:text-red-500 transition-colors duration-300">{song.title || "Untitled"}</h3>
                    <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} relative z-10 transition-colors duration-300`}>
                      {Array.isArray(song.artists) && song.artists.length
                        ? song.artists
                            .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                            .filter(Boolean)
                            .join(", ")
                        : "Unknown Artist"}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 relative z-10">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLikeSong(song);
                        }}
                        className={`text-xs ${isSongLiked(song.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                      >
                        <span>{isSongLiked(song.id) ? '♥' : '♡'}</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(song);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                        title="Add to queue"
                      >
                        <span>➕</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          shareSong(song);
                        }}
                        className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors ml-auto`}
                        title="Share"
                      >
                        <span>🔗</span>
                      </button>
                    </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                  {filteredResults.map((r, idx) => (
                    <div
                      key={r.id}
                      className={`rounded-2xl p-4 ${darkMode ? 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 hover:from-gray-800/90 hover:to-gray-700/90' : 'bg-white/80 hover:bg-white/90'} backdrop-blur-sm border ${darkMode ? 'border-gray-700/50 hover:border-gray-600/50' : 'border-gray-200/50 hover:border-gray-300/50'} shadow-lg hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 cursor-pointer group relative overflow-hidden hover:scale-105 hover:-translate-y-2`}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      
                      <div className="relative" onClick={() => playAt(idx)}>
                        <div className={`aspect-square rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'} shadow-xl group-hover:shadow-2xl transition-all duration-500`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={computeThumb(r.id)} 
                            alt={r.title ?? "art"} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}"><span class="text-2xl">♪</span></div>`;
                            }}
                          />
                        </div>
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                            <span className="text-white">▶</span>
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold truncate text-sm mt-3 relative z-10 group-hover:text-red-500 transition-colors duration-300" title={r.title ?? "Untitled"}>
                        {r.title ?? "Untitled"}
                      </h3>
                      <p className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} relative z-10 transition-colors duration-300`}>
                        {Array.isArray(r.artists) && r.artists.length
                          ? r.artists
                              .map((a) => (typeof a === "string" ? a : a?.name ?? ""))
                              .filter(Boolean)
                              .join(", ")
                          : "Unknown Artist"}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2 relative z-10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLikeSong(r);
                          }}
                          className={`text-xs ${isSongLiked(r.id) ? 'text-red-500' : darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                        >
                          <span>{isSongLiked(r.id) ? '♥' : '♡'}</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToQueue(r);
                          }}
                          className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                          title="Add to queue"
                        >
                          <span>➕</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            shareSong(r);
                          }}
                          className={`text-xs ${darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors ml-auto`}
                          title="Share"
                        >
                          <span>🔗</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </main>

        {/* Enhanced Bottom Player - YouTube Music Style */}
        {current && !fullScreen && (
          <footer className="fixed bottom-0 left-0 right-0 z-20 backdrop-blur-lg">
            {/* Enhanced Progress bar */}
            <div 
              className={`h-2 w-full ${darkMode ? 'bg-gray-800/50' : 'bg-gray-300/50'} cursor-pointer hover:h-3 transition-all duration-200`}
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 relative shadow-lg" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl opacity-0 hover:opacity-100 transition-all duration-200 hover:scale-125"></div>
              </div>
            </div>
            
            <div className={`px-4 sm:px-6 py-4 ${darkMode ? 'bg-gradient-to-t from-black/95 to-gray-900/95 border-t border-gray-800/50' : 'bg-gradient-to-t from-white/95 to-gray-50/95 border-t border-gray-200/50'} backdrop-blur-xl`}>
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
                    {/* Current lyrics line in mini player */}
                    {lyrics && lyrics.lines.length > 0 && currentLyricsLine < lyrics.lines.length && lyrics.lines[currentLyricsLine]?.text && (
                      <div className={`text-xs truncate mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {lyrics.lines[currentLyricsLine].text}
                      </div>
                    )}
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
                  <button 
                    onClick={() => setShuffle(!shuffle)}
                    className={`p-2 transition-colors ${shuffle ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    title={shuffle ? "Shuffle: On" : "Shuffle: Off"}
                  >
                    <span className="text-base">🔀</span>
                  </button>
                  <button 
                    onClick={() => {
                      const nextRepeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
                      setRepeat(nextRepeat);
                    }}
                    className={`p-2 ml-1 transition-colors ${repeat !== "off" ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    title={`Repeat: ${repeat === "one" ? "One" : repeat === "all" ? "All" : "Off"}`}
                  >
                    <span className="text-base">{repeat === "one" ? "🔂" : "🔁"}</span>
                  </button>
                  <button 
                    onClick={() => setShowLyrics(!showLyrics)}
                    disabled={lyricsLoading}
                    className={`p-2 ml-1 ${showLyrics ? 'text-red-500' : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hidden sm:block ${lyricsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={lyricsLoading ? "Loading lyrics..." : showLyrics ? "Hide lyrics" : "Show lyrics"}
                  >
                    <span className="text-base">{lyricsLoading ? '⏳' : '🎵'}</span>
                  </button>
                  <button 
                    onClick={() => setFullScreen(true)}
                    className={`p-2 ml-1 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} hidden sm:block`}
                    title="Full screen"
                  >
                    <span className="text-base">⛶</span>
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

        {/* Toast Notification - Enhanced with modern design */}
        {toast.visible && (
          <div className={`fixed bottom-24 right-4 sm:right-6 z-50 ${darkMode ? 'bg-gray-900/95' : 'bg-gray-800/95'} backdrop-blur-xl text-white px-5 py-3.5 rounded-2xl shadow-2xl slide-in-right flex items-center gap-3 max-w-xs border ${darkMode ? 'border-gray-700/50' : 'border-gray-600/50'}`}>
            <span className="text-lg">✓</span>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* Swipe gesture overlay for mobile player */}
        {current && !fullScreen && (
          <div 
            className="md:hidden fixed bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ pointerEvents: 'auto' }}
          />
        )}
      </div>
    </div>
  );
}