export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function computeThumb(id?: string): string | undefined {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}

export function getArtistName(artist: { name?: string } | string): string {
  return typeof artist === "string" ? artist : artist?.name || "";
}

export function getArtistsText(artists?: Array<{ name?: string } | string>): string {
  if (!artists || artists.length === 0) return "Unknown Artist";
  return artists.map(getArtistName).filter(Boolean).join(", ");
}
