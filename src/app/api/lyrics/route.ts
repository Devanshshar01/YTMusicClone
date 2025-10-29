import { NextRequest } from "next/server";
import { fetchLyrics, generateFallbackLyrics } from "@/lib/lyricsUtils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const songId = searchParams.get("songId");
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!songId || !title || !artist) {
    return Response.json({
      error: "Missing required parameters: songId, title, artist"
    }, { status: 400 });
  }

  const cleanTitle = title.trim();
  const cleanArtist = artist.trim();

  if (!cleanTitle || !cleanArtist) {
    return Response.json({
      error: "Title and artist cannot be empty"
    }, { status: 400 });
  }

  try {
    const lyricsData = await fetchLyrics(cleanTitle, cleanArtist);

    return Response.json({
      songId,
      ...lyricsData
    });
  } catch (error) {
    console.error('Lyrics API error:', error);
    return Response.json({
      error: "Failed to fetch lyrics",
      songId,
      lines: generateFallbackLyrics(cleanTitle, cleanArtist),
      hasLyrics: false,
      source: 'fallback'
    }, { status: 500 });
  }
}
