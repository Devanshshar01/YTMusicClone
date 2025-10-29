export const YTPlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export const POPULAR_SEARCH_TERMS = [
  'top hits 2024',
  'trending music',
  'latest songs',
  'rock music',
  'pop hits',
  'hip hop',
  'electronic music',
  'classical music',
  'jazz',
  'country music'
];

export const DEFAULT_VOLUME = 80;
export const PROGRESS_UPDATE_INTERVAL = 100;
export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_RECENT_SEARCHES = 10;
export const MAX_SEARCH_SUGGESTIONS = 5;
export const TOAST_DURATION = 3000;
