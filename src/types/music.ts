export type Artist = { name?: string } | string;

export type YTMusicItem = {
  id: string;
  title?: string;
  artists?: Artist[];
  album?: unknown;
  albumName?: string | null;
  duration?: string | null;
  viewsText?: string | null;
  type?: string;
};

export type RecentSearchItem = {
  id: string;
  title: string;
  artists: Artist[];
  timestamp: number;
};

export type LyricsLine = {
  time: number;
  text: string;
};

export type LyricsData = {
  lines: LyricsLine[];
  hasLyrics: boolean;
  source?: string;
};

export type Playlist = {
  id: string;
  name: string;
  songs: YTMusicItem[];
};

export type YTLikePlayer = {
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
