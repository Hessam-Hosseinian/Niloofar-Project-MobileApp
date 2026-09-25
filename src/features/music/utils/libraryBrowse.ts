import type { LibraryTrack } from "@/src/features/music/types";

export type LibraryFilter = "all" | "favorites" | "recent" | "artists" | "albums";
export type LibrarySort = "title" | "artist" | "newest" | "mostPlayed";

export function browseMusic(
  tracks: LibraryTrack[],
  recentTracks: LibraryTrack[],
  filter: LibraryFilter,
  sort: LibrarySort,
  query: string,
): LibraryTrack[] {
  const source = filter === "recent" ? recentTracks : tracks;
  const needle = query.trim().toLocaleLowerCase();
  const filtered = source.filter((track) => {
    if (filter === "favorites" && !track.favorite) return false;
    if (filter === "artists" && track.artist === "Unknown artist") return false;
    if (filter === "albums" && !track.album) return false;
    return !needle || [track.title, track.artist, track.album ?? "", track.filename]
      .some((value) => value.toLocaleLowerCase().includes(needle));
  });
  if (filter === "recent" && sort === "newest") return filtered;
  return filtered.sort((a, b) => {
    if (filter === "artists") return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
    if (filter === "albums") return (a.album ?? "").localeCompare(b.album ?? "") || a.title.localeCompare(b.title);
    if (sort === "newest") return b.addedAt.localeCompare(a.addedAt);
    if (sort === "mostPlayed") return b.playCount - a.playCount || a.title.localeCompare(b.title);
    if (sort === "artist") return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
    return a.title.localeCompare(b.title);
  });
}
