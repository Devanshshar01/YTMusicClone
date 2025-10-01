import { NextRequest } from "next/server";

const YT_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

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
    return Response.json(
      { error: "Server not configured: please set YOUTUBE_API_KEY in .env.local" },
      { status: 500 }
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
      headers: { "Accept": "application/json" },
    });

    if (!ytRes.ok) {
      const text = await ytRes.text();
      return Response.json(
        { error: "YouTube API error", status: ytRes.status, message: text },
        { status: 502 }
      );
    }

    const data = await ytRes.json();

    const items = (data.items || []).map((item: any) => ({
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
  } catch (err: any) {
    return Response.json(
      { error: "Failed to fetch from YouTube", message: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}