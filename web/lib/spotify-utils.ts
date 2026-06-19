export function aggregateGenres(
  artists: { genres?: string[] }[],
  limit: number,
): { genre: string; count: number }[] {
  const count: Record<string, number> = {}
  for (const artist of artists) {
    for (const genre of artist.genres ?? []) {
      count[genre] = (count[genre] ?? 0) + 1
    }
  }
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre, c]) => ({ genre, count: c }))
}
