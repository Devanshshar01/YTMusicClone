import { NextRequest } from "next/server";

type LyricsLine = {
  time: number;
  text: string;
};

type LyricsData = {
  lines: LyricsLine[];
  hasLyrics: boolean;
  source?: string;
};


// Function to generate fallback lyrics based on song title and artist
function generateFallbackLyrics(title: string, artist: string): LyricsLine[] {
  const lines = [
    { time: 0, text: `♪ ${title} ♪` },
    { time: 3, text: `by ${artist}` },
    { time: 6, text: "" },
    { time: 8, text: "♪ ♪ ♪" },
    { time: 11, text: "♪ ♪ ♪" },
    { time: 14, text: "♪ ♪ ♪" },
    { time: 17, text: "" },
    { time: 19, text: `♪ ${title} ♪` },
    { time: 22, text: "♪ ♪ ♪" },
    { time: 25, text: "♪ ♪ ♪" },
    { time: 28, text: "♪ ♪ ♪" },
    { time: 31, text: "" },
    { time: 33, text: "♪ Instrumental ♪" },
    { time: 36, text: "♪ ♪ ♪" },
    { time: 39, text: "♪ ♪ ♪" },
    { time: 42, text: "♪ ♪ ♪" },
    { time: 45, text: "" },
    { time: 47, text: `♪ ${title} ♪` },
    { time: 50, text: "♪ ♪ ♪" },
    { time: 53, text: "♪ ♪ ♪" },
    { time: 56, text: "♪ ♪ ♪" },
    { time: 59, text: "" },
    { time: 61, text: "♪ Outro ♪" },
    { time: 64, text: "♪ ♪ ♪" },
    { time: 67, text: "♪ ♪ ♪" },
    { time: 70, text: "♪ ♪ ♪" },
    { time: 73, text: "" },
    { time: 75, text: "♪ Fade out ♪" },
  ];
  
  return lines;
}

// Function to fetch lyrics from multiple sources
async function fetchLyrics(songTitle: string, artist: string): Promise<LyricsData> {
  const searchQuery = `${songTitle} ${artist}`.toLowerCase();
  
  try {
    // Try Lyrics.ovh API first (free, no API key required)
    try {
      const lyricsResponse = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(songTitle)}`,
        { 
          headers: { 'User-Agent': 'YouTube-Music-Clone/1.0' },
          signal: AbortSignal.timeout(8000)
        }
      );
      
      if (lyricsResponse.ok) {
        const data = await lyricsResponse.json();
        if (data.lyrics && data.lyrics !== "No lyrics found" && data.lyrics.trim().length > 0) {
          // Parse the lyrics and create timed lines
          const lyricsText = data.lyrics;
          const lines = lyricsText.split('\n').map((line: string, index: number) => ({
            time: index * 4, // 4 seconds per line as fallback
            text: line.trim()
          })).filter((line: LyricsLine) => line.text);
          
          if (lines.length > 0) {
            return {
              lines,
              hasLyrics: true,
              source: 'lyrics.ovh'
            };
          }
        }
      }
    } catch (e) {
      console.log('Lyrics.ovh failed:', e);
    }

    // Try Musixmatch API (free tier)
    try {
      const musixmatchResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/track.search?q_artist=${encodeURIComponent(artist)}&q_track=${encodeURIComponent(songTitle)}&apikey=YOUR_API_KEY`,
        { 
          headers: { 'User-Agent': 'YouTube-Music-Clone/1.0' },
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (musixmatchResponse.ok) {
        // This would require API key setup, so we'll skip for now
      }
    } catch (e) {
      console.log('Musixmatch failed:', e);
    }

    // Try Genius API (free tier)
    try {
      const geniusResponse = await fetch(
        `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`,
        { 
          headers: { 
            'User-Agent': 'YouTube-Music-Clone/1.0',
            'Authorization': 'Bearer YOUR_GENIUS_TOKEN'
          },
          signal: AbortSignal.timeout(5000)
        }
      );
      
      if (geniusResponse.ok) {
        // This would require API key setup, so we'll skip for now
      }
    } catch (e) {
      console.log('Genius failed:', e);
    }

    // If all external APIs fail, generate fallback lyrics
    return {
      lines: generateFallbackLyrics(songTitle, artist),
      hasLyrics: false,
      source: 'fallback'
    };

  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return {
      lines: generateFallbackLyrics(songTitle, artist),
      hasLyrics: false,
      source: 'fallback'
    };
  }
}

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

  // Clean up the inputs
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