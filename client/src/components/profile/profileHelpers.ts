import type React from "react";
import { profileAccentText } from "@shared/profileConstants";
import type { PublicProfileData } from "./types";

export function parseSocialLinks(raw: PublicProfileData["socialLinks"]): Record<string, string> {
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

type SocialPlatform = {
  key: string;
  label: string;
  base: (handle: string) => string;
  isEmail?: boolean;
};

export const PROFILE_SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: "instagram", label: "Instagram", base: h => `https://instagram.com/${h}` },
  { key: "tiktok", label: "TikTok", base: h => `https://www.tiktok.com/@${h}` },
  { key: "soundcloud", label: "SoundCloud", base: h => `https://soundcloud.com/${h}` },
  { key: "spotify", label: "Spotify", base: h => `https://open.spotify.com/user/${h}` },
  { key: "linktree", label: "Linktree", base: h => `https://linktr.ee/${h}` },
  { key: "website", label: "Website", base: h => (h.startsWith("http") ? h : `https://${h}`) },
  { key: "bookingEmail", label: "Booking email", base: h => `mailto:${h}`, isEmail: true },
];

export function socialHref(platform: SocialPlatform, raw: string): string | null {
  const value = String(raw || "").trim();
  if (!value) return null;
  if (platform.isEmail) return value.includes("@") ? `mailto:${value.replace(/^mailto:/i, "")}` : null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  const handle = value.replace(/^@/, "").replace(/^\/+/, "").trim();
  if (!handle) return null;
  return platform.base(encodeURI(handle));
}

export function fmtProfileTime(sec: number): string {
  const s = Math.floor(sec || 0);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtEventWhen(dateStart?: string | null, neighborhood?: string | null): string {
  if (!dateStart) return neighborhood || "";
  const d = new Date(dateStart);
  if (Number.isNaN(d.getTime())) return neighborhood || "";
  const parts = [
    d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
  ];
  if (neighborhood) parts.push(neighborhood);
  return parts.join(" · ");
}

export function fmtShortDate(dateStart?: string | null): string {
  if (!dateStart) return "";
  const d = new Date(dateStart);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function profileCssVars(accent: string): React.CSSProperties {
  return {
    "--profile-acc": accent,
    "--profile-acc-t": profileAccentText(accent),
  } as React.CSSProperties;
}

function promoterMonogramSource(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || "?").toUpperCase();
}

export function promoterMonogram(displayName: string | null | undefined, username: string): string {
  return promoterMonogramSource(displayName || username);
}

export function promoterHeroLine(data: PublicProfileData): { lead: string; accent: string } {
  let lead = "";
  if (data.talents?.length) {
    lead = data.talents.slice(0, 4).join(". ");
  } else if (data.bio?.trim()) {
    lead = data.bio.trim().split(/\n/)[0].replace(/\.\s*$/, "");
  } else {
    lead = "Portland nightlife";
  }
  if (!lead.endsWith(".")) lead += ".";

  const sinceYear = data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
    ? new Date(data.memberSince).getFullYear()
    : null;
  const accentParts = [data.location || "Portland", sinceYear ? `since ${sinceYear}` : null].filter(Boolean);
  const accent = accentParts.length ? `${accentParts.join(", ")}.` : "";
  return { lead, accent };
}

export function promoterSectionKicker(data: PublicProfileData): string {
  const name = (data.displayName || data.username).trim().split(/\s+/)[0] || data.username;
  return `${name} presents`;
}