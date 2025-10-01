"use client";

import { useEffect, useMemo, useState } from "react";
import YouTube from "react-youtube";

type VideoItem = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  publishedAt?: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const canSearch = useMemo(() => query.trim().length > 1, [query]);

  async function search(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data = (await res.json()) as { items: VideoItem[] };
      setResults(data.items || []);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (canSearch) search(query);
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 md:p-12 font-sans max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">YouTube Music Search</h1>
        <p className="text-sm opacity-80">Search and play music from YouTube</p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          className="flex-1 border rounded px-3 py-2 bg-transparent border-black/10 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs, artists, or albums"
          aria-label="Search"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-foreground text-background disabled:opacity-50"
          disabled={!canSearch || loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="mb-4 text-red-500 text-sm">{error}</div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {!loading && results.length === 0 && (
            <p className="opacity-70">Try searching for an artist or track.</p>
          )}
          <ul className="space-y-3">
            {results.map((v) => (
              <li key={v.id}>
                <button
                  onClick={() => setSelected(v.id)}
                  className="w-full flex items-center gap-3 text-left hover:bg-black/5 dark:hover:bg-white/10 rounded p-2"
                >
                  {v.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnail}
                      alt="thumbnail"
                      className="w-16 h-10 object-cover rounded"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{v.title}</div>
                    <div className="text-xs opacity-70 truncate">{v.channelTitle}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sticky top-4 h-fit">
          {selected ? (
            <YouTube
              videoId={selected}
              opts={{
                height: "360",
                width: "100%",
                playerVars: { autoplay: 1 },
              }}
              iframeClassName="w-full aspect-video rounded"
            />
          ) : (
            <div className="opacity-60">Select a result to start playing.</div>
          )}
        </div>
      </section>
    </div>
  );
}
