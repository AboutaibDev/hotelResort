/**
 * Multi-image helpers.
 *
 * Images are stored in the DB as a JSON array string: '["url1","url2"]'
 * For backwards-compat, a bare single URL is also accepted and wrapped in an array.
 */

const ROOM_DEFAULT =
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=1200";

const ACTIVITY_DEFAULT =
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200";

/**
 * Parse the raw DB image string into a clean string[].
 * Falls back to [defaultUrl] if nothing is stored.
 */
export function parseImages(
  raw: string | null | undefined,
  type: "room" | "activity" = "room"
): string[] {
  const fallback = type === "activity" ? ACTIVITY_DEFAULT : ROOM_DEFAULT;

  if (!raw || raw.trim() === "") return [fallback];

  // Try JSON array format
  if (raw.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown[];
      const urls = parsed
        .filter((u): u is string => typeof u === "string" && u.trim() !== "")
        .map((u) => u.trim());
      return urls.length > 0 ? urls : [fallback];
    } catch {
      // fall through to bare-string handling
    }
  }

  // Legacy single URL
  return [raw.trim()];
}

/**
 * Serialize an array of URL strings for DB storage.
 * Filters out blank entries.
 */
export function stringifyImages(urls: string[]): string {
  const clean = urls.map((u) => u.trim()).filter(Boolean);
  return JSON.stringify(clean.length > 0 ? clean : []);
}
