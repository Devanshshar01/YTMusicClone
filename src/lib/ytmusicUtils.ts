import { Artist } from "@/types/music";

export function asRecord(x: unknown): Record<string, unknown> {
  return typeof x === "object" && x !== null ? (x as Record<string, unknown>) : {};
}

export function asString(x: unknown): string | undefined {
  return typeof x === "string" ? x : undefined;
}

export function asNumber(x: unknown): number | undefined {
  return typeof x === "number" ? x : undefined;
}

export function asArray(x: unknown): unknown[] {
  return Array.isArray(x) ? x : [];
}

export function toDurationFromSeconds(val: unknown): string | undefined {
  const num = typeof val === "string" ? Number(val) : asNumber(val);
  if (typeof num !== "number" || Number.isNaN(num)) return undefined;
  const m = Math.floor(num / 60);
  const s = Math.floor(num % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function extractId(r: Record<string, unknown>): string | undefined {
  const video = asRecord(r.video);
  return (
    asString(r.videoId) ||
    asString(video.videoId) ||
    asString(r.id)
  );
}

export function extractTitle(r: Record<string, unknown>): string | undefined {
  const video = asRecord(r.video);
  const track = asRecord(r.track);
  return asString(r.title) || asString(r.name) || asString(video.title) || asString(track.title);
}

export function extractArtists(r: Record<string, unknown>): Artist[] {
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

  const single = r.artist;
  if (typeof single === "string") return [single];
  const rec = asRecord(single);
  const name = asString(rec.name);
  if (name) return [{ name }];
  return [];
}

export function extractAlbumName(r: Record<string, unknown>): string | null {
  const album = r.album ?? asRecord(r.track).album;
  if (typeof album === "string") return album;
  const rec = asRecord(album);
  return asString(rec.name) ?? null;
}

export function extractDuration(r: Record<string, unknown>): string | null {
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

export function extractViews(r: Record<string, unknown>): string | null {
  const video = asRecord(r.video);
  const views = r.views ?? video.views ?? r.playCount;
  if (typeof views === "number") return views.toLocaleString();
  if (typeof views === "string") return views;
  return null;
}
