import { NextRequest } from "next/server";
import YTMusic from "ytmusic-api";
import { YTMusicItem } from "@/types/music";
import {
  asRecord,
  asString,
  extractId,
  extractTitle,
  extractArtists,
  extractAlbumName,
  extractDuration,
  extractViews,
} from "@/lib/ytmusicUtils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const relatedTo = searchParams.get("relatedTo")?.trim();

  if (!q && !relatedTo) {
    return Response.json({ error: "Missing query parameter 'q' or 'relatedTo'" }, { status: 400 });
  }

  try {
    const ytmusic = new YTMusic();
    const cookies = process.env.YTMUSIC_COOKIES;
    await ytmusic.initialize(cookies ? { cookies } : undefined);

    if (relatedTo) {
      const currentSong = await ytmusic.getSong(relatedTo);

      let artistQuery = "";
      if (currentSong && currentSong.artist) {
        const artist = currentSong.artist;
        artistQuery = typeof artist === "string" ? artist : artist.name || "";
      }

      const relatedSongs = artistQuery ? await ytmusic.search(artistQuery) : [];

      const items: YTMusicItem[] = (Array.isArray(relatedSongs) ? relatedSongs : [])
        .map((raw): YTMusicItem | null => {
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
        .filter((x): x is YTMusicItem => Boolean(x));

      return Response.json({ items });
    } else {
      const results = await ytmusic.search(q!);

      const items: YTMusicItem[] = (Array.isArray(results) ? results : [])
        .map((raw): YTMusicItem | null => {
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
        .filter((x): x is YTMusicItem => Boolean(x));

      const sortedItems = items.sort((a, b) => {
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

        const aDuration = a.duration ? 1 : 0;
        const bDuration = b.duration ? 1 : 0;

        return bDuration - aDuration;
      });

      const filteredItems = sortedItems.filter(item => {
        if (item.type?.toLowerCase() === 'song') return true;
        if (item.type?.toLowerCase() === 'video' && item.duration) return true;
        if (item.artists && item.artists.length > 0) return true;
        return sortedItems.length < 5;
      });

      return Response.json({ items: filteredItems });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "ytmusic search failed", message }, { status: 500 });
  }
}
