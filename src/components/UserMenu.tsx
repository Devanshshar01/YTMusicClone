"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse"></div>
    );
  }

  if (!session) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 text-white/90 hover:text-white transition font-medium"
        >
          Login
        </button>
        <button
          onClick={() => router.push("/signup")}
          className="px-4 py-2 bg-white text-red-500 rounded-full font-bold hover:bg-white/90 transition"
        >
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
          {session.user.name?.[0]?.toUpperCase() || session.user.email[0].toUpperCase()}
        </div>
        <span className="text-white font-medium hidden md:block">
          {session.user.name || session.user.email.split("@")[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-700">
            <p className="text-white font-medium">
              {session.user.name || "User"}
            </p>
            <p className="text-sm text-gray-400 truncate">
              {session.user.email}
            </p>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full text-left px-4 py-2 text-white hover:bg-red-500/20 rounded transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
