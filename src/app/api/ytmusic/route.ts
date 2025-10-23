import { NextRequest } from "next/server";
import YTMusic from "ytmusic-api";

type Artist = { name?: string } | string;

type ResultItem = {
  id: string;
  title?: string;
  artists?: Artist[];
  album?: unknown;
  albumName?: string | null;
  duration?: string | null;
  viewsText?: string | null;
  type?: string;
};

function asRecord(x: unknown): Record<string, unknown> {
  return typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {};
}
function asString(x: unknown): string | undefined {
  return typeof x === "string" ? x : undefined;
}
function asNumber(x: unknown): number | undefined {
  return typeof x === "number" ? x : undefined;
}
function asArray(x: unknown): unknown[] {
  return Array.isArray(x) ? x : [];
}
function toDurationFromSeconds(val: unknown): string | undefined {
  const num = typeof val === "string" ? Number(val) : asNumber(val);
  if (typeof num !== "number" || Number.isNaN(num)) return undefined;
  const m = Math.floor(num / 60);
  const s = Math.floor(num % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
function extractId(r: Record<string, unknown>): string | undefined {
  const video = asRecord(r.video);
  return (
    asString(r.videoId) ||
    asString(video.videoId) ||
    asString(r.id)
  );
}
function extractTitle(r: Record<string, unknown>): string | undefined {
  const video = asRecord(r.video);
  const track = asRecord(r.track);
  return asString(r.title) || asString(r.name) || asString(video.title) || asString(track.title);
}
function extractArtists(r: Record<string, unknown>): Artist[] {
  // Prefer arrays if present
  const candidates = [r.artists, asRecord(r.video).artists, asRecord(r.track).artists];
  for (const cand of candidates) {
    const arr = asArray(cand);
    if (arr.length) {
      const mapped = arr
        .map((v) => {
          if (typeof v === "string") return v;
          const rec = asRecord(v);
          const name = asString(rec.name);
          return name ? ({ name } as Artist) : null;
        })
        .filter((x): x is Artist => Boolean(x));
      if (mapped.length) return mapped;
    }
  }
  // Fallback: singular "artist" object/string
  const single = r.artist;
  if (typeof single === "string") return [single];
  const rec = asRecord(single);
  const name = asString(rec.name);
  if (name) return [{ name }];
  return [];
}
function extractAlbumName(r: Record<string, unknown>): string | null {
  const album = r.album ?? asRecord(r.track).album;
  if (typeof album === "string") return album;
  const rec = asRecord(album);
  return asString(rec.name) ?? null;
}
function extractDuration(r: Record<string, unknown>): string | null {
  const video = asRecord(r.video);
  return (
    asString(r.duration) ||
    asString(r.length) ||
    asString(r.lengthText) ||
    asString(video.lengthText) ||
    toDurationFromSeconds(video.lengthSeconds) ||
    null
  );
}
function extractViews(r: Record<string, unknown>): string | null {
  const video = asRecord(r.video);
  const views = r.views ?? video.views ?? r.playCount;
  if (typeof views === "number") return views.toLocaleString();
  if (typeof views === "string") return views;
  return null;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 requests per minute

  const userLimit = rateLimitStore.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const relatedTo = searchParams.get("relatedTo")?.trim();
  
  if (!q && !relatedTo) {
    return Response.json({ error: "Missing query parameter 'q' or 'relatedTo'" }, { status: 400 });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  try {
    const ytmusic = new YTMusic();
    const cookies = process.env.YTMUSIC_COOKIES; // optional
    await ytmusic.initialize(cookies ? { cookies } : undefined);

    if (relatedTo) {
      // Get related songs by searching for the artist of the current song
      // First, get the current song details
      const currentSong = await ytmusic.getSong(relatedTo);
      
      // Extract artist name
      let artistQuery = "";
      if (currentSong && currentSong.artist) {
        const artist = currentSong.artist;
        artistQuery = typeof artist === "string" ? artist : artist.name || "";
      }
      
      // Search for songs by the same artist
      const relatedSongs = artistQuery ? await ytmusic.search(artistQuery) : [];
      
      const items: ResultItem[] = (Array.isArray(relatedSongs) ? relatedSongs : [])
        .map((raw): ResultItem | null => {
          const r = asRecord(raw);
          const id = extractId(r);
          if (!id) return null;
          const title = extractTitle(r);
          const artists = extractArtists(r);
          const albumName = extractAlbumName(r);
          const duration = extractDuration(r);
          const viewsText = extractViews(r);
          const type = asString(r.type);
          return {
            id,
            title,
            artists,
            album: r.album,
            albumName,
            duration,
            viewsText,
            type,
          };
        })
        .filter((x): x is ResultItem => Boolean(x));

      return Response.json({ items });
    } else {
      // Regular search with better filtering
      const results = await ytmusic.search(q!);

      const items: ResultItem[] = (Array.isArray(results) ? results : [])
        .map((raw): ResultItem | null => {
          const r = asRecord(raw);
          const id = extractId(r);
          if (!id) return null;
          const title = extractTitle(r);
          const artists = extractArtists(r);
          const albumName = extractAlbumName(r);
          const duration = extractDuration(r);
          const viewsText = extractViews(r);
          const type = asString(r.type);
          return {
            id,
            title,
            artists,
            album: r.album,
            albumName,
            duration,
            viewsText,
            type,
          };
        })
        .filter((x): x is ResultItem => Boolean(x));

      // Sort results to prioritize songs and music content
      const sortedItems = items.sort((a, b) => {
        // Priority order: song > video (with duration) > others
        const typeOrder: Record<string, number> = {
          'song': 1,
          'video': 2,
          'album': 3,
          'artist': 4,
          'playlist': 5
        };
        
        const aOrder = typeOrder[a.type?.toLowerCase() || ''] || 99;
        const bOrder = typeOrder[b.type?.toLowerCase() || ''] || 99;
        
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        
        // For same type, prioritize items with duration (actual playable content)
        const aDuration = a.duration ? 1 : 0;
        const bDuration = b.duration ? 1 : 0;
        
        return bDuration - aDuration;
      });

      // Filter to include primarily songs and videos with duration
      const filteredItems = sortedItems.filter(item => {
        // Always include songs
        if (item.type?.toLowerCase() === 'song') return true;
        // Include videos with duration (likely music videos)
        if (item.type?.toLowerCase() === 'video' && item.duration) return true;
        // Include if it has artists (likely music content)
        if (item.artists && item.artists.length > 0) return true;
        // Otherwise only include if we have less than 5 items
        return sortedItems.length < 5;
      });

      return Response.json({ items: filteredItems });
    }
  } catch (err: unknown) {
    console.error("YTMusic API error:", err);
    
    // Handle specific error types
    if (err instanceof Error) {
      if (err.message.includes("rate limit") || err.message.includes("too many requests")) {
        return Response.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
      }
      if (err.message.includes("network") || err.message.includes("timeout")) {
        return Response.json({ error: "Network error. Please check your connection and try again." }, { status: 503 });
      }
      if (err.message.includes("not found") || err.message.includes("404")) {
        return Response.json({ error: "No results found for your search." }, { status: 404 });
      }
    }
    
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ 
      error: "Search failed", 
      message: "Unable to search for music. Please try again later.",
      details: process.env.NODE_ENV === "development" ? message : undefined
    }, { status: 500 });
  }
}