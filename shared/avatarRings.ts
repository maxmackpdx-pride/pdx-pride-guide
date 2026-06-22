export type AvatarRingId =
  | "none"
  | "rainbow"
  | "progress"
  | "lesbian"
  | "gay-men"
  | "bisexual"
  | "transgender"
  | "nonbinary"
  | "pansexual"
  | "genderfluid"
  | "genderqueer"
  | "intersex"
  | "asexual"
  | "aromantic"
  | "agender"
  | "leather"
  | "bear"
  | "chain";

export interface AvatarRingOption {
  id: AvatarRingId;
  label: string;
}

export const AVATAR_RING_OPTIONS: AvatarRingOption[] = [
  { id: "none", label: "No Ring" },
  { id: "rainbow", label: "Rainbow Pride" },
  { id: "progress", label: "Progress Pride" },
  { id: "lesbian", label: "Lesbian" },
  { id: "gay-men", label: "Gay Men" },
  { id: "bisexual", label: "Bisexual" },
  { id: "transgender", label: "Transgender" },
  { id: "nonbinary", label: "Nonbinary" },
  { id: "pansexual", label: "Pansexual" },
  { id: "genderfluid", label: "Genderfluid" },
  { id: "genderqueer", label: "Genderqueer" },
  { id: "intersex", label: "Intersex" },
  { id: "asexual", label: "Asexual" },
  { id: "aromantic", label: "Aromantic" },
  { id: "agender", label: "Agender" },
  { id: "leather", label: "Leather Pride" },
  { id: "bear", label: "Bear" },
  { id: "chain", label: "Chain & Padlock" },
];

export const AVATAR_EMOJI_OPTIONS = [
  { id: 1, emoji: "🐱", bg: "#00FFFF", label: "Cyan Cat" },
  { id: 2, emoji: "🦋", bg: "#FF00CC", label: "Magenta Butterfly" },
  { id: 3, emoji: "🐍", bg: "#CCFF00", label: "Neon Snake" },
  { id: 4, emoji: "🌙", bg: "#8800FF", label: "Violet Moon" },
  { id: 5, emoji: "🔥", bg: "#FF6600", label: "Orange Flame" },
  { id: 6, emoji: "⚡", bg: "#fff", label: "White Lightning" },
] as const;

export function normalizeAvatarRing(value?: string | null): AvatarRingId {
  const found = AVATAR_RING_OPTIONS.find(r => r.id === value);
  return found ? found.id : "none";
}