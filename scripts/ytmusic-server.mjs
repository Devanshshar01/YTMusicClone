#!/usr/bin/env node
// Lightweight standalone HTTP server using ytmusic-api
// Usage:
//   npm run ytmusic
// Then visit: http://localhost:4000/search?q=believer
// Optional: set YTMUSIC_COOKIES to pass custom cookies for region/account-specific results.

import http from "node:http";
import { URL } from "node:url";
import YTMusic from "ytmusic-api";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

async function createYT() {
  const ytmusic = new YTMusic();
  const cookies = process.env.YTMUSIC_COOKIES;
  await ytmusic.initialize(cookies); // cookies are optional per README
  return ytmusic;
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) return notFound(res);
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/") {
      return sendJson(res, 200, {
        ok: true,
        endpoints: [
          `/search?q=never%20gonna%20give%20you%20up`,
        ],
      });
    }

    if (req.method === "GET" && url.pathname === "/search") {
      const q = (url.searchParams.get("q") || "").trim();
      if (!q) return sendJson(res, 400, { error: "Missing query parameter 'q'" });

      const ytmusic = await createYT();
      const results = await ytmusic.search(q);

      // Map a simplified view alongside raw results
      const simplified = Array.isArray(results)
        ? results.map((r) => ({
            title: r.title || r.name || r?.video?.title || r?.track?.title,
            artists: r.artists || r?.video?.artists || r?.track?.artists,
            album: r.album || r?.track?.album,
            videoId: r.videoId || r?.video?.videoId || r?.id,
            // Construct a YouTube watch URL if videoId is present
            url: (r.videoId || r?.video?.videoId || r?.id)
              ? `https://www.youtube.com/watch?v=${r.videoId || r?.video?.videoId || r?.id}`
              : undefined,
            type: r.type,
          }))
        : results;

      return sendJson(res, 200, { query: q, count: Array.isArray(results) ? results.length : 0, simplified, raw: results });
    }

    return notFound(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return sendJson(res, 500, { error: "Internal server error", message });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ytmusic server running on http://localhost:${PORT}`);
});
