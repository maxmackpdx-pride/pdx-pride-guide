# Design System

Status: Current Foundation domain  
Owner: Tucker_PDmaX  
Canonical guide: Design System package and written standards; public URL pending  
Production trap list: `docs/LIVE_DESIGN_STANDARD.md`

Zaylist's Design System is documentation infrastructure. It reduces repeated decisions for one founder today and gives future contributors a coherent visual and interaction language later. The Foundation records why the system exists, who owns its decisions, how its rules change, and which migrations are approved. The canonical guide owns the detailed rules and live specimens. Product code implements them.

## Authority

1. Tucker's explicit decisions.
2. The canonical Design System and written standards.
3. Production implementation and verified behavior.
4. Foundation summaries and recommendations.
5. Historical exports, prototypes, and migration notes.

The Foundation must not reverse this chain. A summary here never becomes more authoritative than the canonical specimen or verified implementation it describes.

## Two registers

- Zine: loud, expressive, event-forward, and collage-capable.
- Utility: calmer, denser, deep-black, and information-led.

Every surface chooses a register before composing components. Mixing registers requires a deliberate reason.

## Foundations

- Brand colors have semantic roles.
- Day colors are schedule data.
- Display, body, and mono type have distinct jobs.
- Spacing and layout are contracts, not local guesses.
- Deep-glass is the default card and control language.
- Motion becomes static under calm or reduced-motion settings.

## Product doctrine: human-first UI, agent-first-class access

The website's priority is human-first design. The UI and all copy are built for
people first.

In parallel, the site must be highly agent-readable, targeting at least 98 percent
agent readability. Agents will use the site and will increasingly run it, and people
will send their agents to fetch information. Treat visiting agents as first-class
users, not as threats to block.

- Give agents structured, stable, machine-readable access to what people use: identity,
  provenance, freshness, relationships, permissions, limitations, and available
  actions, exposed through documented interfaces.
- Identify and track agent visitors like users, and make their tasks easy to complete.
- Keep sign-up walls in force even for scrapers and agents, but leave inviting,
  high-value content unwalled so it pulls them back.
- Design so agents, and the people they act for, love working with Zaylist and return.

Internal build and operation stays expert and trusted. Work is evidence-first,
secrets and private data are protected, and Tucker gives explicit approval before
production push because a push ships live.

## Consistency lock

- Human-first UI and copy is the default.
- Agent-readability is required where it does not reduce people-first outcomes.
- Documented automation lanes are allowed behind auth and privacy-safe boundaries.
- No production or policy mutation is allowed without Tucker approval.

## Components and patterns

The guide owns cards, buttons, forms, navigation, maps, identity rings, and data-display primitives. It also documents page-level patterns such as the homepage stage, Hub feed, floating inbox, app shell, and responsive navigation. The Foundation links to these specimens instead of duplicating their code.

## Brand assets and migration boundary

Tucker has directed the primary website wordmark migration and the use of supplied family artwork on every NEXT card and selected branded titles. The Design System's living logo-family section is the organized source for current homes, future identities, candidates, variants, and provenance. Production effects remain implementation layers around the governed SVG art.

![Primary ZAYLIST rainbow-outline wordmark](../../assets/logo-family/zaylist-primary.svg)

The complete family includes ZAYLIST Primary, ZAYLIST Portland, Prime Z, GIGZ, GIFZ, THE HAÜZ, Z/SPACE, AFTERZ, IDEAZ, Z/OUT, ZENEGADES, and ZAYDARK. Their presence in one library does not mean they share one implementation state.

- Current or current-title homes: ZAYLIST Primary, Prime Z, GIGZ, GIFZ, THE HAÜZ, and IDEAZ.
- NEXT or future homes: Z/SPACE, AFTERZ, Z/OUT, ZENEGADES, and ZAYDARK.
- Library variant: ZAYLIST Portland.
- Candidate boundary: the supplied THE HAÜZ corner lockup remains a candidate even when shown in owner-directed previews or titles.

![THE HAÜZ white-and-cyan corner-lockup candidate](../../assets/logo-family/THE-HAUZ-Corner-Candidate.svg)

Do not add an extra TM layer when the supplied artwork already contains its intended mark. Do not infer that a NEXT placement means a product is launched. Preserve the existing source artwork, intentional proportions, background variants, and historical construction evidence.

## Governance

Durable records live in `foundation/decisions/design-system.yaml`. Current, Implemented, Migration, Queued, Draft, Legacy, Owner decision, and Rejected must remain visibly distinct. Shared global-rule changes update the canonical guide and production trap list together.

Historical exports, generated bundles, uploads, and prototypes remain labeled evidence. They do not become canonical source by proximity.

## Current Founder Priority

Finish the primary and NEXT migration without flattening statuses, keep the complete family organized in the canonical guide, and review parity whenever a shared token, component recipe, navigation rule, or brand asset changes.
