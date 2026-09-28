export const HAWKS_LOCKER_SPECIAL = 'Happy Hour Locker Special (venue offer, not a separate event): $7 for a six-hour locker rental, available daily 10 a.m.–6 p.m. Only active long-term or VIP members qualify. Specialty-day admission rules still apply. The offer has its own hours and does not change this event’s schedule or admission.';

export function isHawksLockerSpecial(title: string) {
  return /^happy\s+hour\s+locker\s+special[!.]?$/i.test(title.trim());
}

export function withHawksLockerSpecial(description: string) {
  return /happy hour locker special/i.test(description)
    ? description
    : `${description}\n\n${HAWKS_LOCKER_SPECIAL}`;
}
