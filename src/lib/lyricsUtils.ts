import { LyricsLine, LyricsData } from "@/types/music";

export function parseLRC(lrcText: string): LyricsLine[] {
  const lines = lrcText.split('\n');
  const lyricsLines: LyricsLine[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3].padEnd(3, '0'));
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();

      if (text) {
        lyricsLines.push({ time, text });
      }
    }
  }

  return lyricsLines.sort((a, b) => a.time - b.time);
}

export function generateFallbackLyrics(title: string, artist: string): LyricsLine[] {
  return [
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
}

export async function fetchLyrics(songTitle: string, artist: string): Promise<LyricsData> {
  try {
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
          const lyricsText = data.lyrics;
          const lines = lyricsText.split('\n').map((line: string, index: number) => ({
            time: index * 4,
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
