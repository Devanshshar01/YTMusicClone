"use client";

import { useState } from 'react';

interface ShareButtonProps {
  songTitle: string;
  artist: string;
  videoId: string;
  className?: string;
}

export default function ShareButton({ songTitle, artist, videoId, className = '' }: ShareButtonProps) {
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: `${songTitle} - ${artist}`,
      text: `Check out "${songTitle}" by ${artist} on YT Music!`,
      url: `${window.location.origin}/?play=${videoId}`,
    };

    try {
      // Try native share API first (mobile)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg
          bg-gradient-to-r from-purple-600 to-pink-600
          hover:from-purple-700 hover:to-pink-700
          text-white font-medium shadow-lg
          transition-all duration-200
          hover:scale-105 active:scale-95
          ${className}
        `}
        aria-label="Share song"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share
      </button>
      
      {showCopied && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg animate-[fadeIn_0.2s_ease-out]">
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
}
