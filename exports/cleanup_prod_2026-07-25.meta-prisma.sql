-- Zaylist Prod Cleanup 2026-07-25
-- Generated: 2026-07-26
-- Audit source: zaylist-events-upcoming-2026-07-25.json (245 LIVE)
-- Garbage: Hardstyle Strength (376) + Molalla Ripple (377) + Beer Runs
-- Dupes: keep oldest ID per title+date
--
-- EXACT Meta AI shape (Prisma / Postgres). Zaylist runtime uses SQLite `events`
-- without updatedAt — prefer cleanup_prod_2026-07-25.sql for actual apply.

BEGIN;

-- 1) Soft-delete first (safer), then hard delete if you have no FK constraints
-- If you use status enum LIVE/HIDDEN/ARCHIVED, use HIDDEN

-- Garbage non-queer - Hardstyle Strength Barbell
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (376);
-- Garbage non-queer - Molalla Ripple Weekend of Survival (3 expanded listings share same id 377)
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (377);

-- Non-queer Beer Runs (optional - delete both as non-queer)
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (365, 368, 381);

-- Dupes - keep oldest, hide newer
-- Oliver Tree Tribute Drag Show 2026-07-26: keep 337, drop 355
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (355);
-- Charli XCX Album Release 2026-07-30: keep 315, drop 316,356
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (316, 356);
-- Club Petal Ariana Grande 2026-08-06: keep 317, drop 357
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (357);
-- Live Nude Mammals 2026-08-15: keep 325, drop 358
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (358);
-- Oregon Professional Wrestling July 31: keep 383, drop 386
UPDATE "Event" SET status = 'HIDDEN', "updatedAt" = NOW() WHERE id IN (386);

-- If you want hard deletes (with cascades):
-- DELETE FROM "Attendance" WHERE "eventId" IN (376,377,355,316,356,357,358,386,365,368,381);
-- DELETE FROM "ChatMessage" WHERE "eventId" IN (376,377,355,316,356,357,358,386,365,368,381);
-- DELETE FROM "Event" WHERE id IN (376,377,355,316,356,357,358,386,365,368,381);

-- Verify
-- SELECT id, title, venueName, dateStart, status FROM "Event" WHERE id IN (376,377,365,368,381,337,355,315,316,356,317,357,325,358,383,386) ORDER BY id;

COMMIT;
