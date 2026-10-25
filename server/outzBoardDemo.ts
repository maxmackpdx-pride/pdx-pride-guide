import type Database from "better-sqlite3";
import { DEMO_ACCOUNT } from "@shared/demo";

/**
 * DEMO cards for the Outzide board (Trip Buddy + Carpool wall posts), one per blended-art destination.
 * Authored by the existing demo account (`hausing_demo`, shown as "Rowan"), so the server flags them isDemo and the
 * board marks them DEMO and read-only. No real people, no contact details.
 */
export const OUTZ_BOARD_DEMO_POSTS: ReadonlyArray<{ placeId: string; postKind: string; body: string }> = [
  {
    "placeId": "usfs-6485821010602",
    "postKind": "HIKE_BUDDY",
    "body": "Tamolitch's Blue Pool is calling. Easy 4-mile out-and-back, slow pace, lots of photo stops. Saturday mornings, we can carpool from Portland if you want."
  },
  {
    "placeId": "silver-falls",
    "postKind": "HIKE_BUDDY",
    "body": "Trail of Ten Falls loop, 8.7 miles. Looking for two people who like walking behind waterfalls and snacking at the lodge after."
  },
  {
    "placeId": "usfs-7682.004621",
    "postKind": "HIKE_BUDDY",
    "body": "Tumalo Falls day trip from Bend, then the rim trail if legs allow. All paces welcome, dogs welcome, bring a thermos."
  },
  {
    "placeId": "cape-lookout",
    "postKind": "CAMP_BUDDY",
    "body": "Car camping at Cape Lookout, two nights. Tent spot for four is booked. Need two more campers to split the site, the firewood and the s'mores debate."
  },
  {
    "placeId": "usfs-5435010324",
    "postKind": "CAMP_BUDDY",
    "body": "First-timers welcome at Trillium Lake. We have the stove and extra sleeping pads. You bring snacks and good vibes."
  },
  {
    "placeId": "rooster-rock",
    "postKind": "LOOKING_FOR_COMPANY",
    "body": "Rooster Rock beach day: sunscreen, a speaker, a very lazy Sunday. Looking for company who likes sand and silence in equal parts."
  },
  {
    "placeId": "bc-garibaldi",
    "postKind": "LOOKING_FOR_COMPANY",
    "body": "Garibaldi Lake is a big day, 18 km round trip. Want a slow-and-steady partner who loves switchbacks and summit selfies."
  },
  {
    "placeId": "dayuse-or-latourell-falls-trailhead-guy-w-talbot",
    "postKind": "CARPOOL_OFFER",
    "body": "Driving from inner SE Portland to Latourell Falls on Saturday morning. Three open seats, gas split, the playlist is democratic."
  },
  {
    "placeId": "sol-duc-falls",
    "postKind": "CARPOOL_REQUEST",
    "body": "No car, big Olympic Peninsula plans. Looking for a ride up to Sol Duc Falls, happy to chip in on gas and bring the coffee."
  },
  {
    "placeId": "dayuse-or-smith-rock-state-park",
    "postKind": "CARPOOL_OFFER",
    "body": "Heading to Smith Rock for a climbing weekend. Room for two climbers and their gear. Pads and ropes ride free."
  }
];

export const OUTZ_BOARD_DEMO_MIGRATION = "seed_outz_board_demo_v1";
/** Old created_at so demos sit below real posts (and stay out of the 30-day feeds), like the other demo boards. */
const DEMO_BASE_TS = Date.parse("2020-01-01T00:00:00.000Z");

/**
 * INSERT-only, one transaction, run once (boot_migrations marker). Skips posts that already exist
 * (same author, place, kind and body), so it is safe to re-run. Never updates or deletes rows.
 * Returns the inserted outz_wall_posts ids (also logged) so they can be rolled back:
 *   DELETE FROM outz_wall_posts WHERE id IN (...) AND user_id = <demo user id>;
 */
export function seedOutzBoardDemo(sqlite: Database.Database): number[] {
  sqlite.exec(`CREATE TABLE IF NOT EXISTS boot_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  if (sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(OUTZ_BOARD_DEMO_MIGRATION)) return [];
  const hasTable = sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='outz_wall_posts'").get();
  const demo = sqlite.prepare("SELECT id FROM users WHERE username = ?").get(DEMO_ACCOUNT) as { id: number } | undefined;
  if (!hasTable || !demo) return []; // not ready yet; not recorded, so the next boot retries
  const insert = sqlite.prepare(`
    INSERT INTO outz_wall_posts (place_id, user_id, post_kind, body, trip_date, created_at)
    SELECT @placeId, @userId, @postKind, @body, NULL, @createdAt
    WHERE NOT EXISTS (SELECT 1 FROM outz_wall_posts WHERE user_id = @userId AND place_id = @placeId AND post_kind = @postKind AND body = @body)`);
  const ids: number[] = [];
  sqlite.transaction(() => {
    OUTZ_BOARD_DEMO_POSTS.forEach((post, i) => {
      const result = insert.run({ ...post, userId: demo.id, createdAt: new Date(DEMO_BASE_TS + i * 1000).toISOString() });
      if (result.changes > 0) ids.push(Number(result.lastInsertRowid));
    });
    sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(OUTZ_BOARD_DEMO_MIGRATION, new Date().toISOString());
  })();
  console.log(`[boot] ${OUTZ_BOARD_DEMO_MIGRATION}: inserted outz_wall_posts ids=[${ids.join(",")}] demo_user_id=${demo.id}`);
  return ids;
}
