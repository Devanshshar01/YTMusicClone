import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YT Music - Stream Your Favorite Songs",
  description: "A beautiful, modern YouTube Music clone with an enhanced UI/UX. Discover, play, and enjoy your favorite music with advanced features like playlists, queue management, and more.",
  keywords: ["music", "youtube music", "streaming", "songs", "playlists", "audio player"],
  authors: [{ name: "YT Music" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ef4444",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}