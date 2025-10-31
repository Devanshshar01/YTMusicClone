"use client";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Shortcut[] = [
  // Playback controls
  { keys: ['Space'], description: 'Play/Pause', category: 'Playback' },
  { keys: ['→'], description: 'Seek forward 5 seconds', category: 'Playback' },
  { keys: ['←'], description: 'Seek backward 5 seconds', category: 'Playback' },
  { keys: ['↑'], description: 'Volume up', category: 'Playback' },
  { keys: ['↓'], description: 'Volume down', category: 'Playback' },
  { keys: ['M'], description: 'Toggle mute', category: 'Playback' },
  
  // Navigation
  { keys: ['N'], description: 'Next track', category: 'Navigation' },
  { keys: ['P'], description: 'Previous track', category: 'Navigation' },
  { keys: ['S'], description: 'Toggle shuffle', category: 'Navigation' },
  { keys: ['R'], description: 'Cycle repeat mode', category: 'Navigation' },
  
  // Interface
  { keys: ['L'], description: 'Like current song', category: 'Interface' },
  { keys: ['F'], description: 'Toggle full screen', category: 'Interface' },
  { keys: ['Q'], description: 'Toggle queue', category: 'Interface' },
  { keys: ['/'], description: 'Focus search', category: 'Interface' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Interface' },
  { keys: ['Esc'], description: 'Close modals', category: 'Interface' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">⌨️</span>
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {categories.map((category) => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                {category === 'Playback' && '▶️'}
                {category === 'Navigation' && '🧭'}
                {category === 'Interface' && '💻'}
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition"
                    >
                      <span className="text-gray-300">{shortcut.description}</span>
                      <div className="flex gap-2">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-3 py-1.5 bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 rounded-md text-white font-mono text-sm shadow-lg"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm p-4 rounded-b-2xl border-t border-gray-700">
          <p className="text-center text-gray-400 text-sm">
            Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">?</kbd> anytime to view shortcuts
          </p>
        </div>
      </div>
    </div>
  );
}
