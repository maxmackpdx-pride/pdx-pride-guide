/**
 * Offline regression checks for QSearch relevance and directory identity.
 * Run: npx tsx script/smoke-qsearch-identity.ts
 */
import { isRelevantScanDraft } from "../server/ingest/relevance";
import { matchDirectoryBrands } from "../server/qsearch/directoryBrands";
import type { Business } from "../shared/schema";

let failed = 0;
function assert(cond: unknown, msg: string) {
  if (cond) console.log("ok:", msg);
  else {
    console.error("FAIL:", msg);
    failed += 1;
  }
}

const ordinarySource = {
  sourceId: "holocene-calendar",
  label: "Holocene",
  url: "https://www.holocene.org/calendar",
  tier: "1",
};

const draft = (over: Record<string, unknown>) =>
  ({
    title: "Event",
    description: "",
    venueName: "TBA",
    address: "Portland, OR",
    neighborhood: null,
    sourceUrl: null,
    eventPageUrl: null,
    ticketUrl: null,
    ...over,
  }) as any;

assert(
  !isRelevantScanDraft(
    draft({ title: "Indie Rock Showcase", venueName: "Holocene" }),
    ordinarySource,
  ).keep,
  "ordinary venue concert is rejected without LGBTQ+ evidence",
);
assert(
  isRelevantScanDraft(
    draft({
      title: "Queer Dance Night",
      description: "A dance party for Portland's LGBTQ+ community",
      venueName: "Holocene",
    }),
    ordinarySource,
  ).keep,
  "ordinary venue event is kept when the event explicitly says it is LGBTQ+",
);
assert(
  isRelevantScanDraft(draft({ title: "Tuesday Karaoke", venueName: "Badlands" }), ordinarySource)
    .keep,
  "all events at an exact dedicated queer venue are eligible",
);
for (const venueName of [
  "Sanctuary Club",
  "Eagle Portland",
  "Badlands",
  "The Sports Bra",
  "Q Center",
  "Steam Portland",
  "Camp Bar PDX",
  "Darcelle XV Showplace",
  "CC Slaughters",
  "Hawks PDX",
  "Scandals East",
]) {
  assert(
    isRelevantScanDraft(
      draft({ title: "Weekly Community Event", venueName }),
      ordinarySource,
    ).keep,
    `${venueName} needs no separate event-specific LGBTQ+ wording`,
  );
}
assert(
  isRelevantScanDraft(
    draft({
      title: "Community Book Night",
      venueName: "The Sports Bra",
      address: "2512 NE Broadway, Portland, OR 97232",
      sourceUrl: "https://thesportsbraofficial.com/pages/portland",
    }),
    ordinarySource,
  ).keep,
  "Sports Bra events do not need separate event-specific LGBTQ+ wording",
);
assert(
  !isRelevantScanDraft(
    draft({ title: "Business Mixer", venueName: "Badlands Golf Club" }),
    ordinarySource,
  ).keep,
  "a venue that merely contains a queer-bar word is rejected",
);
assert(
  isRelevantScanDraft(
    draft({
      title: "Tuesday Karaoke",
      venueName: null,
      sourceUrl: "https://www.badlandsportland.com/calendar",
    }),
    ordinarySource,
  ).keep,
  "an official dedicated queer-venue source is valid identity evidence",
);
assert(
  !isRelevantScanDraft(
    draft({ title: "Indie Rock Showcase", venueName: "Holocene" }),
    {
      sourceId: "holocene-eb",
      label: "Holocene",
      url: "https://www.eventbrite.com/d/or--portland/holocene/",
      tier: "3",
    },
  ).keep,
  "an exact ordinary-venue Eventbrite match still needs LGBTQ+ evidence",
);
assert(
  isRelevantScanDraft(draft({ title: "Monthly Member Meeting", venueName: "Community Hall" }), {
    sourceId: "bearracuda",
    label: "Bearracuda",
    url: "https://bearracuda.com/events/portland/",
    tier: "1",
    businessType: "group",
  }).keep,
  "an exact LGBTQ+ organization source is valid host evidence",
);

const businesses = [
  {
    id: 1,
    name: "Badlands",
    type: "bar",
    address: "110 NW Broadway, Portland, OR",
    website: "https://www.badlandsportland.com/",
  },
  {
    id: 2,
    name: "Sanctuary Club",
    type: "venue",
    address: "33 NW 9th Ave, Portland, OR 97209",
    website: "https://pdxsanctuary.com/",
  },
  {
    id: 3,
    name: "Portland Leather Alliance",
    type: "group",
    address: null,
    website: "https://portlandleather.org/",
  },
].map(row => ({
  description: "",
  neighborhood: null,
  instagram: null,
  donateUrl: null,
  queerOwned: false,
  queerFriendly: true,
  imageUrl: null,
  lat: null,
  lng: null,
  active: true,
  status: "OPEN",
  closedAt: null,
  isNew: false,
  grandOpeningDate: null,
  hours: null,
  phone: null,
  locations: null,
  ownerId: null,
  createdAt: "",
  ...row,
})) as Business[];

const brandsFor = (over: Record<string, unknown>, opts?: { sourceLabel?: string; sourceId?: string }) =>
  matchDirectoryBrands(
    draft({
      title: "Tuesday Night",
      venueName: "Badlands",
      address: "110 NW Broadway, Portland, OR",
      ...over,
    }),
    businesses,
    opts,
  );

assert(
  brandsFor({ venueName: "Badlands Golf Club", address: null }).every(b => b.name !== "Badlands"),
  "partial venue wording does not attach Badlands",
);
assert(
  brandsFor({ venueName: "TBA", address: "110 NW Broadway, Portland, OR" }).some(
    b => b.name === "Badlands" && b.reasons.includes("Address match"),
  ),
  "exact directory address attaches a venue even when its name is missing",
);
assert(
  brandsFor({ venueName: "Sanctuary", address: null }).some(b => b.name === "Sanctuary Club"),
  "a curated exact alias attaches the intended venue",
);
assert(
  brandsFor({
    title: "Leather Night at Badlands",
    description: "Leather looks encouraged; hosted by Badlands.",
  }).every(b => b.name !== "Portland Leather Alliance"),
  "a Badlands leather event does not attach Portland Leather Alliance",
);
assert(
  brandsFor({
    title: "Community Workshop",
    description: "Hosted by Portland Leather Alliance.",
  }).some(b => b.name === "Portland Leather Alliance"),
  "the full organization name explicitly attaches Portland Leather Alliance",
);
assert(
  brandsFor({ title: "PLA Community Night", description: "Monthly meetup." }).some(
    b => b.name === "Portland Leather Alliance",
  ),
  "PLA is accepted when explicitly named in the event title",
);
assert(
  brandsFor({ title: "Pet Play Night", description: "A playful social." }).every(
    b => b.name !== "Portland Leather Alliance",
  ),
  "play/pet-play wording never attaches Portland Leather Alliance",
);

if (failed) {
  console.error(`\n${failed} QSearch identity check(s) failed.`);
  process.exit(1);
}
console.log("\nAll QSearch identity checks passed.");
