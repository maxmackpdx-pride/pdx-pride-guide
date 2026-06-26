export function attendanceInitials(handle: string): string {
  const clean = (handle || "?").replace(/^@/, "").trim();
  if (!clean) return "?";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

export function attendanceSeedColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const colors = ["#CCFF00", "#00FFFF", "#FF00CC", "#FF6600", "#8800FF", "#FF2400", "#00EE44"];
  return colors[h % colors.length];
}

const REFERENCE_GRADIENTS = [
  "linear-gradient(135deg, #FF00CC, #A24BFF)",
  "linear-gradient(135deg, #19E3FF, #008026)",
  "linear-gradient(135deg, #CCFF00, #19E3FF)",
  "linear-gradient(135deg, #FF6600, #FF00CC)",
  "linear-gradient(135deg, #A24BFF, #19E3FF)",
  "linear-gradient(135deg, #FFED00, #FF6600)",
  "linear-gradient(135deg, #CCFF00, #FF00CC)",
];

export function attendanceBubbleGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return REFERENCE_GRADIENTS[h % REFERENCE_GRADIENTS.length];
}

export type AttendancePreviewBubble = {
  id: number;
  initials: string;
  avatarSeed: string;
  userId?: number | null;
  avatarRing?: string | null;
  avatarChoice?: number | null;
  photoUrl?: string | null;
};

export type AttendanceSummary = {
  count: number;
  preview: AttendancePreviewBubble[];
};