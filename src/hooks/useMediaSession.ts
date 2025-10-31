import { useEffect } from 'react';

interface MediaMetadata {
  title: string;
  artist: string;
  album?: string;
  artwork?: { src: string; sizes: string; type: string }[];
}

interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
}

/**
 * Hook to integrate with the Media Session API for better mobile/OS integration
 * Shows playback controls in notification area, lock screen, and media keys
 */
export function useMediaSession(
  metadata: MediaMetadata | null,
  handlers: MediaSessionHandlers
) {
  useEffect(() => {
    if ('mediaSession' in navigator && metadata) {
      // Set metadata
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album || '',
        artwork: metadata.artwork || [
          {
            src: `https://i.ytimg.com/vi/${metadata.title}/hqdefault.jpg`,
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      // Set action handlers
      const actionHandlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
        ['play', handlers.onPlay || null],
        ['pause', handlers.onPause || null],
        ['previoustrack', handlers.onPrevious || null],
        ['nexttrack', handlers.onNext || null],
        ['seekbackward', handlers.onSeekBackward || null],
        ['seekforward', handlers.onSeekForward || null],
      ];

      actionHandlers.forEach(([action, handler]) => {
        try {
          if (handler) {
            navigator.mediaSession.setActionHandler(action, handler);
          }
        } catch (error) {
          console.warn(`Media session action "${action}" not supported`, error);
        }
      });

      return () => {
        // Clean up handlers
        actionHandlers.forEach(([action]) => {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch (error) {
            // Ignore cleanup errors
          }
        });
      };
    }
  }, [metadata, handlers]);
}
