"use client";

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'from-green-600 to-emerald-600',
    icon: '✓',
    border: 'border-green-400',
  },
  error: {
    bg: 'from-red-600 to-pink-600',
    icon: '✕',
    border: 'border-red-400',
  },
  info: {
    bg: 'from-blue-600 to-cyan-600',
    icon: 'ℹ',
    border: 'border-blue-400',
  },
  warning: {
    bg: 'from-yellow-600 to-orange-600',
    icon: '⚠',
    border: 'border-yellow-400',
  },
};

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const style = toastStyles[type];

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
      <div
        className={`
          bg-gradient-to-r ${style.bg} text-white
          px-6 py-4 rounded-2xl shadow-2xl
          border-2 ${style.border}
          flex items-center gap-3
          min-w-[300px] max-w-md
          backdrop-blur-sm
        `}
      >
        <span className="text-2xl">{style.icon}</span>
        <p className="flex-1 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded-full p-1 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
