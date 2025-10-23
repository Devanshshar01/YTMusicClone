import { NextRequest } from "next/server";

const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

type YTThumbnail = { url: string };
type YTThumbnails = {
  default?: YTThumbnail;
  medium?: YTThumbnail;
  high?: YTThumbnail;
};
type YTSnippet = {
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: YTThumbnails;
};

type YTSearchItem = {
  id: { videoId: string };
  snippet: YTSnippet;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const maxResults = Math.min(Number(searchParams.get("maxResults") || 12), 25);
  const regionCode = searchParams.get("regionCode") || "US";

  if (!q) {
    return Response.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.warn("YouTube API key not configured, falling back to YTMusic API");
    // Fallback to YTMusic API if YouTube API key is not available
    try {
      const fallbackRes = await fetch(`${req.nextUrl.origin}/api/ytmusic?q=${encodeURIComponent(q)}`);
      if (fallbackRes.ok) {
        return fallbackRes;
      }
    } catch (fallbackErr) {
      console.error("Fallback to YTMusic API failed:", fallbackErr);
    }
    
    return Response.json(
      { error: "Search service unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const url = new URL(YT_SEARCH_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("regionCode", regionCode);
  // Prefer music category where possible
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);

  try {
    const ytRes = await fetch(url.toString(), {
      // Avoid Next.js caching for dynamic queries
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!ytRes.ok) {
      const text = await ytRes.text();
      console.error("YouTube API error:", ytRes.status, text);
      
      // Handle specific HTTP status codes
      if (ytRes.status === 403) {
        return Response.json(
          { error: "YouTube API access denied. Please try again later." },
          { status: 503 }
        );
      }
      if (ytRes.status === 429) {
        return Response.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }
      if (ytRes.status === 400) {
        return Response.json(
          { error: "Invalid search query. Please try a different search term." },
          { status: 400 }
        );
      }
      
      return Response.json(
        { error: "Search service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const data = (await ytRes.json()) as { items?: YTSearchItem[] };

    const items = (data.items || []).map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url,
      publishedAt: item.snippet?.publishedAt,
    }));

    return Response.json({ items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: "Failed to fetch from YouTube", message },
      { status: 500 }
    );
  }
}