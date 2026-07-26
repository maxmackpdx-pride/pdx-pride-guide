-- Zaylist Prod Cleanup 2026-07-25
-- Generated: 2026-07-26
-- Audit source: zaylist-events-upcoming-2026-07-25.json (245 LIVE)
-- Garbage: Hardstyle Strength (376) + Molalla Ripple (377) + Beer Runs
-- Dupes: keep oldest ID per title+date
--
-- NOTE (Grok): Meta AI used Prisma-style "Event" + updatedAt + NOW().
-- Zaylist prod is Drizzle/SQLite table `events` with no updatedAt column.
-- This file is the SQLite-ready version of Meta's script.
-- Meta-raw (Postgres/Prisma) copy: cleanup_prod_2026-07-25.meta-prisma.sql
-- DO NOT run against prod without explicit Tucker confirm.

BEGIN;

-- 1) Soft-delete first (safer). Public API only lists status = LIVE.

-- Garbage non-queer - Hardstyle Strength Barbell
UPDATE events SET status = 'HIDDEN' WHERE id IN (376);
-- Garbage non-queer - Molalla Ripple Weekend of Survival (3 expanded listings share same id 377)
UPDATE events SET status = 'HIDDEN' WHERE id IN (377);

-- Non-queer Beer Runs (optional - delete both as non-queer)
UPDATE events SET status = 'HIDDEN' WHERE id IN (365, 368, 381);

-- Dupes - keep oldest, hide newer
-- Oliver Tree Tribute Drag Show 2026-07-26: keep 337, drop 355
UPDATE events SET status = 'HIDDEN' WHERE id IN (355);
-- Charli XCX Album Release 2026-07-30: keep 315, drop 316,356
UPDATE events SET status = 'HIDDEN' WHERE id IN (316, 356);
-- Club Petal Ariana Grande 2026-08-06: keep 317, drop 357
UPDATE events SET status = 'HIDDEN' WHERE id IN (357);
-- Live Nude Mammals 2026-08-15: keep 325, drop 358
UPDATE events SET status = 'HIDDEN' WHERE id IN (358);
-- Oregon Professional Wrestling July 31: keep 383, drop 386
UPDATE events SET status = 'HIDDEN' WHERE id IN (386);

-- If you want hard deletes (with related rows — table names depend on schema):
-- DELETE FROM attendances WHERE event_id IN (376,377,355,316,356,357,358,386,365,368,381);
-- DELETE FROM event_chat_messages WHERE event_id IN (376,377,355,316,356,357,358,386,365,368,381);
-- DELETE FROM events WHERE id IN (376,377,355,316,356,357,358,386,365,368,381);

-- Verify
-- SELECT id, title, venue_name, date_start, status FROM events
--   WHERE id IN (376,377,365,368,381,337,355,315,316,356,317,357,325,358,383,386)
--   ORDER BY id;

COMMIT;

-- Summary: 5 garbage IDs (376,377,365,368,381) + 6 dupe IDs (355,316,356,357,358,386) = 11 UPDATE targets
-- (Meta said 12; 316+356 are two Charli drops; count of hide IDs = 5+6 = 11 unique, or 5+7 if counting 316 and 356 separately as "7 dupe" = 12)
