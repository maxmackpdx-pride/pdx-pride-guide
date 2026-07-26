/**
 * Smoke: Sports Bra Airtable connector + game poster generator (offline).
 * Run: npx tsx script/smoke-sports-bra.ts
 *
 * The live Airtable fetch can't run here (needs the token + network), so we
 * test the pure record→draft mapping against fixtures that mirror plausible
 * Airtable field shapes, plus the Swedish-minimal poster SVG builder.
 */
import {
  parseMatchupCell,
  parseSportsBraRecords,
  parseSportsBraSharedView,
  recordToDraft,
} from "../server/ingest/adapters/sportsBra";
import { buildGamePosterSvg } from "../server/posters/gamePoster";

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

/* ── separate home/away fields + explicit time ── */
const d1 = recordToDraft({
  Date: "2999-08-01",
  Time: "7:30 PM",
  League: "NWSL",
  Away: "Portland Thorns",
  Home: "Gotham FC",
});
assert(d1, "record with date maps to a draft");
assert(d1!.title === "Portland Thorns vs Gotham FC", "title built from home/away");
assert(d1!.dateStart === "2999-08-01T19:30", "date+time → Pacific wall-clock start");
assert(d1!.venueName === "The Sports Bra", "venue stamped");
assert(d1!.address === "2512 NE Broadway, Portland, OR", "address stamped");
assert(d1!.parseSource === "airtable", "parseSource is airtable");
assert(d1!.admission === "UNKNOWN", "admission never invented as FREE");
assert(
  d1!.posterImageUrl?.startsWith("/api/game-poster?") &&
    /league=NWSL/.test(d1!.posterImageUrl!) &&
    /home=Gotham/.test(d1!.posterImageUrl!),
  "no-flyer game gets generated poster URL with league + home",
);

/* ── single matchup string, no time ── */
const d2 = recordToDraft({ Date: "2999-08-05", Sport: "USWNT Friendly", Matchup: "USA vs Canada" });
assert(d2!.title === "USA vs Canada", "title from single matchup field");
assert(d2!.dateStart === "2999-08-05T12:00", "missing time defaults");
assert(
  d2!.warnings.some((w) => /time missing/i.test(w)),
  "missing-time warning present for reviewer",
);

/* ── real attachment wins over generated poster ── */
const d3 = recordToDraft({
  "Game Date": "2999-08-09",
  Flyer: [{ url: "https://example.com/real-flyer.jpg" }],
  Game: "Storm vs Aces",
});
assert(d3!.posterImageUrl === "https://example.com/real-flyer.jpg", "attached flyer wins over generator");

/* ── no date → not a game (skipped) ── */
assert(recordToDraft({ Note: "TBD" }) === null, "row without a date is skipped");

/* ── batch: past games filtered, undatable dropped ── */
const batch = parseSportsBraRecords([
  { id: "r1", fields: { Date: "2000-01-01", Away: "Old Game" } }, // past
  { id: "r2", fields: { Date: "2999-08-01", Away: "Future Game" } },
  { id: "r3", fields: { Note: "no date" } },
]);
assert(batch.length === 1 && batch[0].title === "Future Game", "batch keeps only future datable games");

/* ── poster SVG: brand + content present, self-contained ── */
const svg = buildGamePosterSvg({
  league: "NWSL",
  away: "Portland Thorns",
  home: "Gotham FC",
  dateLabel: "Sat · Aug 1",
  timeLabel: "7:30 PM",
});
assert(svg.startsWith("<svg"), "poster is an SVG");
assert(svg.includes("THE SPORTS BRA"), "poster carries the wordmark");
assert(
  svg.includes("THORNS") && svg.includes("GOTHAM") && svg.includes("VS"),
  "poster shows both teams (wrapped) and the vs mark",
);
assert(svg.includes("#E63E82"), "poster uses brand pink");
assert(svg.includes("@font-face") && svg.includes("base64,"), "poster embeds fonts (deterministic)");
assert(svg.includes("<") && !/<script/i.test(svg), "poster has no script (safe)");

/* ── poster escapes hostile text (no injection) ── */
const evil = buildGamePosterSvg({ league: "X", away: "<script>alert(1)</script>", dateLabel: "x", timeLabel: "y" });
assert(!/<script>alert/.test(evil), "hostile team text is escaped in poster");

/* ── public shared-view matchup formula ── */
const m = parseMatchupCell("July 15, 2026 - 🥎 Blaze vs Bandits");
assert(m.iso === "2026-07-15", "matchup cell parses ISO date");
assert(m.away === "Blaze" && m.home === "Bandits", "matchup cell splits teams");

const shared = parseSportsBraSharedView(
  {
    data: {
      table: {
        columns: [
          { id: "fldMatch", name: "2025 Matchup" },
          { id: "fldTime", name: "Time (PT)" },
          {
            id: "fldLeague",
            name: "League",
            typeOptions: { choices: [{ id: "selNWSL", name: "NWSL" }] },
          },
        ],
        rows: [
          {
            id: "r1",
            cellValuesByColumnId: {
              fldMatch: "August 1, 2999 - ⚽ Portland Thorns vs Gotham FC",
              fldTime: "7:30 PM",
              fldLeague: "selNWSL",
            },
          },
          {
            id: "r2",
            cellValuesByColumnId: {
              fldMatch: "January 1, 2000 - Old Game vs Past",
              fldTime: "1:00 PM",
            },
          },
        ],
      },
    },
  },
  {},
);
assert(shared.length === 1, "shared view keeps only future games");
assert(shared[0].title === "Portland Thorns vs Gotham FC", "shared view title from matchup formula");
assert(shared[0].dateStart === "2999-08-01T19:30", "shared view date+time");
assert(/league=NWSL/.test(shared[0].posterImageUrl || ""), "shared view league on poster");

console.log("\nAll Sports Bra connector + poster smoke checks passed.");
