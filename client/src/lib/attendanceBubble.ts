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

export function attendanceBubbleGradient(seed: string): string {
  const accent = attendanceSeedColor(seed);
  return `linear-gradient(145deg, ${accent} 0%, #19e3ff 48%, #a24bff 100%)`;
}

export type AttendancePreviewBubble = {
  id: number;
  initials: string;
  avatarSeed: string;
};

export type AttendanceSummary = {
  count: number;
  preview: AttendancePreviewBubble[];
};