---
schemaVersion: 1
explorationId: 2026-08-06-z-namespace-and-product-shape
date: 2026-08-06
session: Claude, chat, single long working session
participants: Tucker_PDmaX
authority: none
condensation: prohibited
status: closed
relatedDecisions:
  - ZF-Z-NAMESPACE-2026-08-06
  - ZF-Z-OUT-NAME-2026-08-06
  - ZF-SPOTZ-NAME-2026-08-06
  - ZF-ZAYDARK-MODE-2026-08-06
  - ZF-NO-PAYMENT-RAIL-2026-08-06
  - ZF-PLATFORM-SHAPE-2026-08-06
---

# Z namespace, product shape, and the adult layer

Session began as design-system work on color scales and moved into naming,
product architecture, and the adult content layer. Ideas below are recorded as
raised, not as resolved.

---

## E-01 Z/ as a Reddit-style prefix
**status:** promoted → `ZF-Z-NAMESPACE-2026-08-06`

Founder: "I'm gonna do something with that Z that's more like Reddit."

Then, narrowing it: "I don't want it on every product just the products that
live in the form."

First reading was forum-shaped. That was wrong and the founder corrected it. The
rule that actually held is **containment**: a `Z/` name holds a category, it does
not name a single-purpose product. Z/Space holds groups. Z/Out holds outdoors.

Consequence noticed but not decided: if `z/(club name)` is real, `Z/` is a
**routing convention**, not a brand prefix, which means Z/ names must be
typeset from a system rather than drawn individually. Z/SPACE currently has a
bespoke SVG logo and would become the exception.

## E-02 z/(club name) as user-generated namespace
**status:** unresolved

Floated alongside z/gifts and z/missed connections. The club case is different
in kind from the others: it implies users can create namespaces.

Open: whether user namespaces and first-party categories share a prefix, and
whether they look visibly different.

Noted: `z/missed connections` breaks the convention. Reddit has no spaces for a
reason. `z/missed` or `z/spotted` would hold.

## E-03 Naming the business directory
**status:** promoted → `ZF-SPOTZ-NAME-2026-08-06`

Founder: "it's really a queer business directory, but not every business that's
queer friendly is owned by queer people and I don't like it cause that gets
muddy."

The unlock was that this is not a naming problem. Queer-owned is an ownership
fact. Queer-safe is an experience fact. One label cannot carry both honestly.
The name should claim neither and the two become badges.

Rejected along the way:
- **SHOPZ** — rejected. Venues are in the directory and you do not shop a venue.
- **HAUNTS** — rejected. Founder: "I've never even heard of that word." A name
  that needs explaining to its own owner will need explaining to users.

Landed on **The Spotz**. The article does work: "Spotz" is a category, "The
Spotz" is a known set, which is a curation claim rather than an ownership claim.

Unresolved: nav treatment. "The Spotz" is clunky as a tab label next to Events
and Gigz. Likely follows however THE HAÜZ already handles it.

## E-04 Venues belong to two products
**status:** unresolved, not yet raised as a decision

A venue is both a directory entry and the place an event happens. If those are
two records they will drift on hours, address, and neighborhood.

Suggests venues are one object surfaced in both, with events hanging off them,
which would put the directory underneath events rather than beside it. A venue
page with live events attached is a destination; a shop page is a lookup.

Not decided. Raised and left open.

## E-05 ZayDark is a mode, not a place
**status:** promoted → `ZF-ZAYDARK-MODE-2026-08-06`

Founder: "Zaydark is not necessarily a place it's more of a ZayDark Mode that's
what's going to unlock adult content, though already lives in some of these
places and a personal section and a hook up app."

And on intent: "Queer people build community through sex it's not something we
need to have as a naughty app. It's just something I would like to still be
integrated into the fabric in my community that I can turn on and off
sometimes."

The word `sometimes` carried weight. A situational toggle is a different object
from a one-time unlock. One-time unlock makes you A Person Who Enabled That.
Situational means the state is yours to set by context.

Assistant framing that was corrected: calling it a "fenced minority" was
compliance language and would have produced a quarantine inside the product.
The legal boundary and the experience boundary are not the same object.

Also corrected: an earlier claim that a mode cannot be a waypoint. Founder:
"it absolutely is a way point because it's one of my goals." The Next page
waypoints are a roadmap of goals, not a product catalog.

## E-06 One toggle is too blunt
**status:** unresolved

Founder: "Going to rooster rock is a bit different than i want my dick sucked or
I'm selling my sex swing."

Three different profiles under one switch:
- Nude recreation — Rooster Rock is legally clothing-optional. Naturism, not
  adult content. Should not sit behind the mode at all.
- Explicit speech — the actual ZayDark case.
- Adult commerce — goods. Closer to gifts than to personals.

Suggests mode plus content flags rather than a single gate. Not decided.

## E-07 The iOS constraint, twice corrected
**status:** unresolved, but the operative test is settled

Assistant initially framed the risk as adult content. Founder corrected twice.

First: "Sniffies was on iOS. The reason if he's got kicked off as you can't be
on iOS and promote illegal activities & cruising is an illegal activity."

Second: "You can have adult content on iOS people share unlocked albums on
Scruff and Grindr all the time. X is basically a porn feed."

Operative test is therefore **legality of the underlying activity**, plus not
being primarily a pornography app, plus having moderation in place. Not
explicitness.

Consequence: ZayDark Mode can be native. The carve-out is a map framed around
cruising, which is a framing problem more than a feature problem.

## E-08 No personals; map instead
**status:** promoted → recorded inside `ZF-ZAYDARK-MODE-2026-08-06`

Founder: "I am not gonna do personals section because it gets messy. The map is
gonna function more like Sniffies's when it comes to that."

Noted but not decided: FOSTA-SESTA exposure is about facilitating commercial
sex, not explicit language. Moderation policy, not age verification, is the
larger legal surface. Flagged as attorney work.

## E-09 Structure is Craigslist, not Reddit
**status:** promoted → `ZF-PLATFORM-SHAPE-2026-08-06`

Founder: "Don't formulate too much off of Reddit. I know we're taking some of
the naming convention, but actually the structure is gonna be a little bit more
like craigslist, but with the modernization of Facebook groups."

Downstream observations, none decided:
- No voting, no karma. Craigslist has neither, and vote ranking in a
  single-city queer market is a popularity contest among a few hundred people.
- Listings expire. Expiry is free moderation.
- Geographic instances match the Portland → Seattle → SF plan far better than a
  global feed does.
- Facebook Groups supplies the accountability layer Craigslist never had, which
  is also the answer to the personals risk.

## E-10 Check-in as the shared primitive
**status:** unresolved

Founder described Z/ pages as a hybrid of a personal profile and the nude beach
page: destination widgets, a "looking for ___" form, check-ins, and a group chat
scoped to a trail or location, modeled on riverbrats.

Observation: trail chat, beach check-in, venue room, and AfterZ drop are one
object. A location, the people currently present, and a chat scoped to both.

The "looking for ___" form is a second primitive and a safer replacement for
personals, because a structured request with a category and an expiry controls
what can be said in a way open text does not.

## E-11 Telegram affordances
**status:** unresolved

Founder wants some Telegram features, referencing riverbratz. Assistant could
not find riverbratz and did not guess at it. Still unexplained.

Candidates raised: topics as threaded sub-forums, invite links with expiry,
auto-delete timers, expiring live location, and the channel/group distinction
that Facebook Groups conflates.

Open question left unanswered: whether the founder wants **messaging**, or the
**affordances** without the inbox.

## E-12 No payment rail, anywhere
**status:** promoted → `ZF-NO-PAYMENT-RAIL-2026-08-06`

Founder: "We don't take payments for art. It's no different than i have a used
harness for sale."

Assistant had imported Etsy's business model when only its browse shape was
being borrowed. Gifts, gear, and art are one object with different tags.

Consequence: no processor risk, no restricted-category exposure, no chargebacks,
no PCI scope. This is a structural advantage, not a limitation.

## E-13 Creator verification, and where it lives
**status:** promoted → `ZF-GIGZ-IDENTITY-LAYER-2026-08-06`

Founder raised "Z/ creatorz landing page with a verification process too for
adult content creators to find eachother," then agreed it is Gigz.

Naming collision caught: `Z/Creatorz` carries both markers. `Z/` means
container, terminal Z means product. Pick one.

Idea not yet decided: verification as two tiers on one vendor. Age-verified for
users, identity-verified for creators. The second tier is plausibly something
people would pay for, which is notable on a platform that takes no money.

Also noted: adult creators carry federal 2257 record-keeping. A network where
age and identity are established before the conversation starts solves a real
problem rather than adding a gate.

## E-14 Design system inputs
**status:** recommendation only, see `DS-COLOR-SCALES-2026-08-06`

Measured the nine live neon tokens against `#050506`. Three fail AA for body
text. Spread across the palette is 5.1x.

Found `--day-mon-text` and `--day-tue-text` already hand-patched at 5.9:1 and
6.0:1. Derived step 11 values reproduced them to within 0.003 OKLCH lightness,
which is the argument that the system extends existing instinct rather than
replacing it.

Founder: "I'm not changing anything today." The only change carried forward was
the Next preview stack becoming a rail. Later discovered the worlds grid already
ships a right-to-left marquee, `homeDestinationRailFlow 46s`.

Unresolved: whether nude beaches keeps the `01` feature slot on the home stage
once it moves under Z/Out.
