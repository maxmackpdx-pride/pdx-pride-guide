// Tucker's supplied Steam flyers, 2026-09-28; recurring rules cross-checked with
// https://quillfish-bison-dpbr.squarespace.com/events and /the-grid.
// Tucker confirmed November 21 Sin City exception; fourth Saturdays thereafter.
export const STEAM_SOURCE = "https://quillfish-bison-dpbr.squarespace.com/events";
export type SteamOccurrence = { title: string; dateStart: string; dateEnd: string; description: string; posterImageUrl: string | null; dayOfWeek: string };

export function steamThroughApril2027(): SteamOccurrence[] {
  const result: SteamOccurrence[] = [];
  const date = (d: Date) => d.toISOString().slice(0, 10);
  const plus = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
  const add = (d: Date, title: string, start: string, end: string, description: string, poster: string | null) => {
    result.push({ title, dateStart: `${date(d)}T${start}`, dateEnd: `${date(end <= start ? plus(d, 1) : d)}T${end}`,
      dayOfWeek: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getUTCDay()],
      description: `${description} Steam Portland is a private men's club. Ages 18+ with valid government ID. Membership or a day pass and applicable room or locker charges are required.`,
      posterImageUrl: poster ? `/posters/steam-2026/${poster}.jpg` : null });
  };
  for (let d = new Date("2026-09-28T12:00:00Z"); date(d) <= "2027-04-30"; d = plus(d, 1)) {
    const weekday = d.getUTCDay();
    const ordinal = Math.floor((d.getUTCDate() - 1) / 7) + 1;
    const day = date(d);
    if (weekday >= 1 && weekday <= 4) {
      add(d, "Morning Wood", "10:00", "12:00", "Monday–Thursday, 10 a.m.–noon. Elite members: $11 lockers and $20 basic rooms.", "morning-wood");
      add(d, "Thirst Quencher", "18:00", "23:00", "Monday–Thursday, 6–11 p.m. Elite members: $11 lockers; non-elite members: $21 lockers. Offer covers a four-hour stay.", "thirst-quencher");
    }
    if (weekday === 2) add(d, "Radical Rubdown", "19:00", "22:00", "Tuesday open massage-table gathering, 7–10 p.m. No experience needed.", "radical-rubdown");
    if (weekday === 3) add(d, "Hump Day", "12:00", "22:30", "Every Wednesday, noon–10:30 p.m. Elite members receive $5 off all rooms and lockers. Cannot be combined with other offers.", "hump-day");
    if (weekday === 6 && (ordinal === 1 || ordinal === 3) && day !== "2026-11-21") add(d, "Blackout", "22:00", "04:00", "First and third Saturdays, 10 p.m.–4 a.m. Lights-out glowstick night. November 21 is replaced by Sin City for Kink Week.", "blackout");
    if (weekday === 6 && ordinal === 2) add(d, "CumUnion Portland", "22:00", "04:00", "Second Saturday of each month, 10 p.m.–4 a.m.", "cumunion");
    if (day === "2026-11-21" || (weekday === 6 && ordinal === 4 && day !== "2026-11-28")) add(d, "Sin City", "22:00", "04:00", "Retro ’70s party with disco music and red lighting. $5 off when attending with a mustache. Fourth Saturdays, 10 p.m.–4 a.m.; November 2026 moves to November 21 for Kink Week.", "sin-city");
    const previous = plus(d, -1);
    const previousOrdinal = Math.floor((previous.getUTCDate() - 1) / 7) + 1;
    if (weekday === 0 && (previousOrdinal === 1 || previousOrdinal === 3) && date(previous) !== "2026-11-21") add(d, "Afterglow", "22:00", "04:00", "Sunday following Blackout, 10 p.m.–4 a.m. $5 off all rooms and lockers.", "afterglow");
    // Kink Week starts on the third Sunday, not the third occurrence of each weekday.
    const first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 12));
    const thirdSunday = 1 + (7 - first.getUTCDay()) % 7 + 14;
    const offset = d.getUTCDate() - thirdSunday;
    if (offset === 3) add(d, "Tied & Teased", "19:00", "21:00", "Monthly Kink Week Wednesday gathering, 7–9 p.m. Part of Steam's third-Sunday Kink Week schedule.", null);
    if (offset === 4) add(d, "Fetch & Frolic", "20:00", "04:00", "Monthly Kink Week Thursday gathering, 8 p.m.–4 a.m. Part of Steam's third-Sunday Kink Week schedule.", null);
    if (offset === 5) add(d, "Hardwear", "22:00", "04:00", "Monthly Kink Week Friday gathering, 10 p.m.–4 a.m. Part of Steam's third-Sunday Kink Week schedule.", null);
  }
  return result;
}
