import type Database from "better-sqlite3";


export const littleShopOfPonies = {
  title: "Pink Ponies Present: Little Shop of Ponies",
  description: "Queer plants and curiosities take over The Secret Warehouse for the Ponies’ 18th party! Inspired by Little Shop of Horrors, we’re bringing you art, offerings, and a killer DJ lineup.\n\nDoors open at 9, with limited tickets available at the door. And thanks to daylight saving time, we go ’til “3am.”\n\nNo funds, no problem. We got you. DM us on Instagram @burningmanpinkponies\n\nAUDIO BOTANISTS\nBRO HOE\nDJ GRIND\nCHELSEA STARR\n\nEXOTIC SPECIMENS\nANGEL DARKO\nMATRIX\nTRANSJENIFAHS GAWDY\n\nCURIO MERCHANTS\nNIKINGA\nRASPY TIMBRE",
  venueName: "Secret Warehouse",
  address: "Around NE 18th & Sandy in Portland, OR; exact location TBA",
  neighborhood: null,
  lat: null,
  lng: null,
  dateStart: "2026-10-31T21:00:00-07:00",
  dateEnd: "2026-11-01T03:00:00-08:00",
  dayOfWeek: "SAT",
  ageRequirement: "21_PLUS",
  eventTypes: JSON.stringify(["DANCE"]),
  admission: "TICKETED",
  ticketUrl: "https://events.humanitix.com/little-shop-of-ponies",
  sourceUrl: "https://events.humanitix.com/little-shop-of-ponies",
  isPublic: true,
  isPrivate: false,
  isHouseParty: false,
  isSexPositive: true,
  nudityOk: false,
  posterImageUrl: "/event-posters/little-shop-of-ponies-2026.jpeg",
};

export const PONIES_MIGRATION = "tucker_little_shop_of_ponies_2026_10_31_v1";

/** Owner-reviewed additions only; never modify an existing or claimed listing. */
export function seedLittleShopOfPonies20261031(sqlite: Database.Database, now = new Date()) {
  return sqlite.transaction(() => {
    if (sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(PONIES_MIGRATION)) return 0;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = sqlite.prepare("SELECT title, venue_name, date_start, ticket_url FROM events").all() as Array<{ title: string; venue_name: string; date_start: string; ticket_url: string | null }>;
    const insert = sqlite.prepare(`INSERT INTO events (
      title, description, venue_name, address, neighborhood, lat, lng,
      date_start, date_end, day_of_week, age_requirement, event_types,
      admission, ticket_url, is_public, is_private, is_house_party,
      is_sex_positive, nudity_ok, poster_image_url, status, source,
      is_claimable, claimed_by, submitted_by, admin_notes, created_at, updated_at
    ) VALUES (
      @title, @description, @venueName, @address, @neighborhood, @lat, @lng,
      @dateStart, @dateEnd, @dayOfWeek, @ageRequirement, @eventTypes,
      @admission, @ticketUrl, @isPublic, @isPrivate, @isHouseParty,
      @isSexPositive, @nudityOk, @posterImageUrl, 'LIVE', 'admin_seeded',
      1, NULL, NULL, @adminNotes, @now, @now
    )`);
    let added = 0;
    for (const draft of [littleShopOfPonies]) {
      if (draft.dateStart.slice(0, 10) < today) continue;
      const duplicate = existing.some(row => row.date_start.slice(0, 10) === draft.dateStart.slice(0, 10) && (
        (norm(row.venue_name) === norm(draft.venueName) && (
          norm(row.title) === norm(draft.title) || row.date_start.slice(0, 16) === draft.dateStart.slice(0, 16)
        )) || (row.ticket_url?.split("?")[0].replace(/\/$/, "") === draft.sourceUrl || norm(row.title).includes("littleshopofponies"))
      ));
      if (duplicate) continue;
      added += insert.run({
        ...draft,
        isPublic: Number(draft.isPublic), isPrivate: Number(draft.isPrivate),
        isHouseParty: Number(draft.isHouseParty), isSexPositive: Number(draft.isSexPositive),
        nudityOk: Number(draft.nudityOk),
        adminNotes: `Tucker requested publication and featuring 2026-10-09. Tucker confirmed 21+ and sex-positive. Secret venue: preserve organizer location wording; no exact coordinates. Source: ${draft.sourceUrl}`,
        now: now.toISOString(),
      }).changes;
      existing.push({ title: draft.title, venue_name: draft.venueName, date_start: draft.dateStart, ticket_url: draft.ticketUrl });
    }
    sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(PONIES_MIGRATION, now.toISOString());
    console.info(`[boot] ${PONIES_MIGRATION}: added ${added} approved unclaimed events`);
    return added;
  })();
}

/** Run after community tables and existing group identities have been initialized. */
export function linkLittleShopOfPoniesCommunity(sqlite: Database.Database, now = new Date()) {
  return sqlite.transaction(() => {
    const migration = `${PONIES_MIGRATION}_community`;
    if (sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(migration)) return 0;
    const community = sqlite.prepare("SELECT id FROM communities WHERE slug = 'pink-ponies' AND name = 'Pink Ponies'").get() as { id: string } | undefined;
    const event = sqlite.prepare("SELECT id FROM events WHERE ticket_url = ? AND substr(date_start, 1, 10) = '2026-10-31' AND status = 'LIVE'").get(littleShopOfPonies.ticketUrl) as { id: number } | undefined;
    if (!community || !event) return 0;
    const stamp = now.toISOString();
    const result = sqlite.prepare("INSERT OR IGNORE INTO community_relationships (community_id, target_type, target_id, relationship_type, created_at) VALUES (?, 'event', ?, 'related', ?)").run(community.id, String(event.id), stamp);
    sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(migration, stamp);
    return result.changes;
  })();
}
