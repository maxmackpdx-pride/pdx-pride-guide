import type { MemberProfileData } from "./types";

/* ── Social platforms ("Find me"/"Find us") ────────────────────────────── */

export type SocialPlatform = {
  key: string;
  label: string;
  chip: string;
  color: string;
  whiteText?: boolean;
  base: (handle: string) => string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", chip: "IG", color: "var(--neon-magenta)", base: h => `https://instagram.com/${h}` },
  { key: "tiktok", label: "TikTok", chip: "TT", color: "var(--neon-cyan)", base: h => `https://www.tiktok.com/@${h}` },
  { key: "soundcloud", label: "SoundCloud", chip: "SC", color: "var(--neon-orange)", base: h => `https://soundcloud.com/${h}` },
  { key: "spotify", label: "Spotify", chip: "SP", color: "var(--neon-green)", base: h => `https://open.spotify.com/user/${h}` },
  { key: "bluesky", label: "Bluesky", chip: "BS", color: "var(--neon-blue)", whiteText: true, base: h => `https://bsky.app/profile/${h}` },
  { key: "x", label: "X", chip: "X", color: "#ffffff", base: h => `https://x.com/${h}` },
  { key: "facebook", label: "Facebook", chip: "f", color: "var(--neon-blue)", whiteText: true, base: h => `https://facebook.com/${h}` },
  { key: "website", label: "Website", chip: "↗", color: "var(--neon-cyan)", base: h => `https://${h}` },
  { key: "linktree", label: "Linktree", chip: "LT", color: "var(--neon-green)", base: h => `https://linktr.ee/${h}` },
  { key: "venmo", label: "Venmo", chip: "$", color: "var(--neon-yellow)", base: h => `https://venmo.com/${h}` },
  { key: "onlyfans", label: "OnlyFans", chip: "OF", color: "var(--neon-cyan)", base: h => `https://onlyfans.com/${h}` },
  { key: "fetlife", label: "FetLife", chip: "FL", color: "var(--neon-red)", whiteText: true, base: h => `https://fetlife.com/${h}` },
  { key: "bookingEmail", label: "Booking", chip: "@", color: "var(--neon-orange)", base: h => `mailto:${h}` },
];

export function socialHref(platform: SocialPlatform, raw: string): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  const handle = value.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (!handle) return null;
  return platform.base(encodeURI(handle));
}

export function parseSocialLinks(raw: MemberProfileData["socialLinks"]): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return raw;
}

export function socialCardsFor(socialLinks: Record<string, string>) {
  return SOCIAL_PLATFORMS
    .map(platform => {
      const raw = socialLinks[platform.key];
      const href = raw ? socialHref(platform, raw) : null;
      return href ? { platform, href, handle: String(raw).trim() } : null;
    })
    .filter((c): c is { platform: SocialPlatform; href: string; handle: string } => c !== null);
}

/* ── Formatting ─────────────────────────────────────────────────────────── */

export function fmtEventWhen(dateStart?: string | null): string {
  if (!dateStart) return "";
  const d = new Date(dateStart);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

/* ── Calm mode / reduced motion ─────────────────────────────────────────── */

export function isCalmOrReduced(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  if (root.dataset.calm === "true" || root.classList.contains("calm-mode")) return true;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
