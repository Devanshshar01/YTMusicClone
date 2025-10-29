import { useEffect } from 'react';

type KeyboardShortcutHandlers = {
  onPlayPause?: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onToggleMiniPlayer?: () => void;
  onToggleFullScreen?: () => void;
  onToggleShuffle?: () => void;
  onCycleRepeat?: () => void;
  onToggleLike?: () => void;
  onToggleShortcuts?: () => void;
  onToggleLyrics?: () => void;
};

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlers.onPlayPause?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onNextTrack?.();
          } else {
            handlers.onSkipForward?.();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            handlers.onPrevTrack?.();
          } else {
            handlers.onSkipBackward?.();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlers.onVolumeUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.onVolumeDown?.();
          break;
        case 'm':
        case 'M':
          handlers.onToggleMiniPlayer?.();
          break;
        case 'f':
        case 'F':
          handlers.onToggleFullScreen?.();
          break;
        case 's':
        case 'S':
          handlers.onToggleShuffle?.();
          break;
        case 'r':
        case 'R':
          handlers.onCycleRepeat?.();
          break;
        case 'l':
        case 'L':
          handlers.onToggleLike?.();
          break;
        case '?':
          e.preventDefault();
          handlers.onToggleShortcuts?.();
          break;
        case 'y':
        case 'Y':
          handlers.onToggleLyrics?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlers, enabled]);
}
