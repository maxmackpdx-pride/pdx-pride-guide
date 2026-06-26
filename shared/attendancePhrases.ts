export const ATTENDANCE_PHRASE_KEYS = [
  "HEY",
  "ILL_BE_HERE",
  "WANT_TO_CHECK_OUT",
  "LOOKING_FOR_SOMEONE",
  "WORKING_THIS",
] as const;

export type AttendancePhraseKey = (typeof ATTENDANCE_PHRASE_KEYS)[number];

export type AttendancePhraseDef = {
  key: AttendancePhraseKey;
  label: string;
  color: string;
};

export const ATTENDANCE_PHRASES: AttendancePhraseDef[] = [
  { key: "HEY", label: "Hey there", color: "#C8FA3C" },
  { key: "ILL_BE_HERE", label: "I'll be there", color: "#19E3FF" },
  { key: "WANT_TO_CHECK_OUT", label: "Checking it out", color: "#FF00CC" },
  { key: "LOOKING_FOR_SOMEONE", label: "Looking for someone", color: "#A24BFF" },
  { key: "WORKING_THIS", label: "I'm Working", color: "#FF6600" },
];

export const ATTENDANCE_PHRASE_BY_KEY: Record<AttendancePhraseKey, AttendancePhraseDef> =
  Object.fromEntries(ATTENDANCE_PHRASES.map(p => [p.key, p])) as Record<AttendancePhraseKey, AttendancePhraseDef>;

export const DEFAULT_ATTENDANCE_PHRASE_KEY: AttendancePhraseKey = "ILL_BE_HERE";

export function attendancePhraseLabel(key: AttendancePhraseKey): string {
  return ATTENDANCE_PHRASE_BY_KEY[key].label;
}

export function resolveAttendancePhrase(message: string): AttendancePhraseDef {
  const trimmed = (message || "").trim();
  const byKey = ATTENDANCE_PHRASE_BY_KEY[trimmed as AttendancePhraseKey];
  if (byKey) return byKey;
  if (trimmed === "Working this one") return ATTENDANCE_PHRASE_BY_KEY.WORKING_THIS;
  const byLabel = ATTENDANCE_PHRASES.find(p => p.label === trimmed);
  if (byLabel) return byLabel;
  return { key: "HEY", label: trimmed || "Hey there", color: "#C8FA3C" };
}