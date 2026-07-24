import type { Business } from "@shared/schema";
import { resolveDirectoryLogo, directoryFallbackLogo } from "@shared/directoryLogos";
import { directoryTypeColor } from "@shared/directoryTheme";
import { normalizeVenueKey } from "@shared/venueLinks";
import type { IngestEventDraft } from "../ingest/types";

export type DirectoryBrand = {
  businessId: number;
  name: string;
  type: string;
  logoUrl: string | null;
  color: string;
  /** venue = place of show; group = org/club; place = other category match */
  role: "venue" | "group" | "place";
  score: number;
  reasons: string[];
};

function logoFor(biz: Pick<Business, "id" | "name" | "imageUrl" | "type">): string {
  return (
    resolveDirectoryLogo(biz.name, biz.imageUrl) ||
    (biz.imageUrl && String(biz.imageUrl).trim()) ||
    directoryFallbackLogo(biz.type || "venue")
  );
}

function isVenueLike(type: string): boolean {
  return ["bar", "venue", "restaurant", "cafe", "hotel", "shop"].includes(type);
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize address for loose equality: street number + first street token. */
export function addressCore(value: string | null | undefined): string {
  if (!value) return "";
  let s = value
    .toLowerCase()
    .replace(/,?\s*portland,?\s*(or|oregon)?\s*\d{0,5}(-\d{4})?/gi, " ")
    .replace(/\b(suite|ste|unit|apt|#)\s*\w+/gi, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // collapse street suffixes
  s = s
    .replace(/\b(street|st)\b/g, "st")
    .replace(/\b(avenue|ave)\b/g, "ave")
    .replace(/\b(boulevard|blvd)\b/g, "blvd")
    .replace(/\b(road|rd)\b/g, "rd")
    .replace(/\b(northwest)\b/g, "nw")
    .replace(/\b(northeast)\b/g, "ne")
    .replace(/\b(southwest)\b/g, "sw")
    .replace(/\b(southeast)\b/g, "se");
  const parts = s.split(" ").filter(Boolean);
  if (parts.length < 2) return s;
  // number + direction? + street name
  return parts.slice(0, 4).join(" ");
}

function addressesLooselyMatch(a?: string | null, b?: string | null): boolean {
  const ca = addressCore(a);
  const cb = addressCore(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  // "208 nw 3rd" vs "208 nw 3rd ave"
  if (ca.startsWith(cb) || cb.startsWith(ca)) return true;
  // same leading house number + overlapping street tokens
  const ta = ca.split(" ");
  const tb = cb.split(" ");
  if (ta[0] !== tb[0]) return false; // house number must match
  const shared = ta.filter(t => t.length > 1 && tb.includes(t));
  return shared.length >= 2;
}

function nameLooselyMatch(a: string, b: string): boolean {
  const na = normalizeVenueKey(a).replace(/\s+/g, "");
  const nb = normalizeVenueKey(b).replace(/\s+/g, "");
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 5 && nb.length >= 5 && (na.includes(nb) || nb.includes(na))) return true;
  // single-char typo tolerance for short venue names (Darcell vs Darcelle)
  if (Math.abs(na.length - nb.length) <= 2 && na.length >= 6) {
    let i = 0;
    let j = 0;
    let misses = 0;
    while (i < na.length && j < nb.length) {
      if (na[i] === nb[j]) {
        i++;
        j++;
      } else {
        misses++;
        if (misses > 2) return false;
        if (na.length > nb.length) i++;
        else if (nb.length > na.length) j++;
        else {
          i++;
          j++;
        }
      }
    }
    misses += na.length - i + (nb.length - j);
    return misses <= 2;
  }
  return false;
}

export type MatchDirectoryBrandsOpts = {
  /** QSearch source label e.g. "Darcelle XV" - used when venue is TBA/empty */
  sourceLabel?: string | null;
  /** Curated source id e.g. sanctuary-ics - used for host/label hints */
  sourceId?: string | null;
};

/** Strip parser noise from labels: "Sanctuary (ICS)" → "Sanctuary" */
export function cleanSourceLabel(label: string | null | undefined): string {
  return stripHtml(label || "")
    .replace(
      /\s*[\(\[]\s*(ics|json|tribe|html|wix|squarespace|eventbrite|tixr|bit|bandsintown|vision|upload|api|calendar|jsonld)\s*[\)\]]\s*/gi,
      " ",
    )
    .replace(/\s*[-–-|]\s*(ics|tribe|json|eventbrite|tixr|calendar)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Feed put the street in LOCATION with no venue name (common on Sanctuary ICS). */
export function isAddressLikeVenueName(name: string | null | undefined): boolean {
  const n = stripHtml(name || "").trim();
  if (!n) return false;
  if (/^\d{1,6}\s+\S+/.test(n)) return true; // "33 NW 9th Ave"
  if (/^(nw|ne|sw|se)\s+\d/i.test(n)) return true;
  return false;
}

export function isWeakVenueName(name: string | null | undefined): boolean {
  const v = stripHtml(name || "").trim();
  if (!v || v.length < 2) return true;
  if (/^(tba|tbd|n\/?a|unknown|various|online|virtual|see listing|multiple)$/i.test(v)) return true;
  if (isAddressLikeVenueName(v)) return true;
  return false;
}

function hostsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  try {
    const ha = new URL(a.startsWith("http") ? a : `https://${a}`).hostname.replace(/^www\./, "");
    const hb = new URL(b.startsWith("http") ? b : `https://${b}`).hostname.replace(/^www\./, "");
    if (!ha || !hb) return false;
    return ha === hb || ha.endsWith(`.${hb}`) || hb.endsWith(`.${ha}`);
  } catch {
    return false;
  }
}

/**
 * When ICS/HTML only has TBA or a street address, resolve the real directory venue
 * from source label / source URL host so Review logos + publish matching work.
 */
export function enrichDraftVenueFromSource(
  draft: IngestEventDraft,
  businesses: Business[],
  opts?: MatchDirectoryBrandsOpts,
): IngestEventDraft {
  const active = businesses.filter(b => b.active !== false);
  const rawVenue = stripHtml(draft.venueName || "");
  const weak = isWeakVenueName(rawVenue);
  let address = draft.address || null;

  // Street-only LOCATION → keep as address, clear fake venue name
  if (isAddressLikeVenueName(rawVenue)) {
    if (!address) address = rawVenue.slice(0, 300);
  }

  if (!weak && !isAddressLikeVenueName(rawVenue)) {
    return address !== draft.address ? { ...draft, address } : draft;
  }

  const label = cleanSourceLabel(opts?.sourceLabel);
  const sourceId = String(opts?.sourceId || "").toLowerCase();

  // Prefer website host (pdxsanctuary.com ICS → Sanctuary Club once website is set)
  let hit =
    active.find(
      b =>
        b.type !== "group" &&
        b.type !== "nonprofit" &&
        hostsMatch(draft.sourceUrl, b.website || undefined),
    ) || null;

  // Source id / label contains venue key
  if (!hit && (label || sourceId)) {
    hit =
      active.find(b => {
        if (b.type === "group" || b.type === "nonprofit") return false;
        const bn = normalizeVenueKey(b.name);
        const core = bn.split(" ")[0] || bn;
        if (core.length < 4) return false;
        if (label && (nameLooselyMatch(label, b.name) || normalizeVenueKey(label).includes(core))) {
          return true;
        }
        if (sourceId && sourceId.includes(core.replace(/\s+/g, ""))) return true;
        return false;
      }) || null;
  }

  // Address match alone
  if (!hit && address) {
    hit =
      active.find(
        b =>
          b.type !== "group" &&
          b.type !== "nonprofit" &&
          addressesLooselyMatch(address, b.address),
      ) || null;
  }

  if (!hit) {
    // At least prefer cleaned label over TBA for display
    if (label && (isWeakVenueName(rawVenue) || isAddressLikeVenueName(rawVenue))) {
      return {
        ...draft,
        venueName: label.slice(0, 200),
        address,
        warnings: Array.from(
          new Set([...(draft.warnings || []), `Venue filled from source label (${label})`]),
        ),
      };
    }
    return address !== draft.address ? { ...draft, address } : draft;
  }

  return {
    ...draft,
    venueName: hit.name,
    address: address || hit.address || draft.address,
    warnings: Array.from(
      new Set([
        ...(draft.warnings || []),
        `Venue resolved to directory: ${hit.name}`,
      ]),
    ),
  };
}

/**
 * Match an ingest draft to directory places:
 * 1) Address (loose) and/or name (fuzzy) for venue-like businesses
 * 2) Group/org match from title/description
 * Always returns a logo path (pack, DB, or type fallback).
 */
export function matchDirectoryBrands(
  draft: IngestEventDraft,
  businesses: Business[],
  opts?: MatchDirectoryBrandsOpts,
): DirectoryBrand[] {
  const active = businesses.filter(b => b.active !== false);
  const brands: DirectoryBrand[] = [];
  const seen = new Set<number>();

  const venueName = stripHtml(draft.venueName || "");
  const title = stripHtml(draft.title || "");
  const description = stripHtml(draft.description || "");
  const address = draft.address || "";
  const sourceLabel = cleanSourceLabel(opts?.sourceLabel || "");
  const venueWeak = isWeakVenueName(venueName);
  // Fallback name for venue matching when feed says TBA / street-only
  const venueProbe = venueWeak ? sourceLabel || venueName : venueName;

  // Score every business
  type Scored = { biz: Business; score: number; reasons: string[]; role: DirectoryBrand["role"] };
  const scored: Scored[] = [];

  for (const biz of active) {
    if (biz.type === "group" || biz.type === "nonprofit") continue; // groups later
    let score = 0;
    const reasons: string[] = [];

    if (venueName && !isAddressLikeVenueName(venueName) && nameLooselyMatch(venueName, biz.name)) {
      score += 55;
      reasons.push("Venue name match");
    } else if (venueProbe && nameLooselyMatch(venueProbe, biz.name)) {
      score += venueWeak ? 50 : 55;
      reasons.push(venueWeak ? "Source label venue match" : "Venue name match");
    } else if (venueProbe) {
      // token overlap
      const vt = new Set(normalizeVenueKey(venueProbe).split(" ").filter(t => t.length > 2));
      const bt = normalizeVenueKey(biz.name).split(" ").filter(t => t.length > 2);
      const shared = bt.filter(t => vt.has(t)).length;
      if (shared >= 2) {
        score += 30;
        reasons.push("Partial venue name");
      } else if (shared === 1 && bt.some(t => t.length >= 5 && vt.has(t))) {
        // "Sanctuary" → Sanctuary Club when feed venue is TBA
        score += venueWeak ? 45 : 28;
        reasons.push("Venue token match");
      }
    }

    if (addressesLooselyMatch(address, biz.address)) {
      score += 50;
      reasons.push("Address match");
    }
    // Street-only venueName is also an address signal
    if (isAddressLikeVenueName(venueName) && addressesLooselyMatch(venueName, biz.address)) {
      score += 50;
      reasons.push("Street LOCATION = directory address");
    }

    // Website host overlap (pdxsanctuary.com ICS → Sanctuary Club)
    if (hostsMatch(draft.sourceUrl, biz.website || undefined)) {
      score += 45;
      reasons.push("Website host match");
    }
    // Source id hint: sanctuary-ics
    const sid = String(opts?.sourceId || "").toLowerCase();
    const bKey = normalizeVenueKey(biz.name).replace(/\s+/g, "");
    if (sid && bKey.length >= 5 && sid.includes(bKey.slice(0, Math.min(8, bKey.length)))) {
      score += 40;
      reasons.push("Source id venue hint");
    }

    if (score < 40) continue;
    scored.push({
      biz,
      score,
      reasons,
      role: isVenueLike(biz.type) ? "venue" : "place",
    });
  }

  scored.sort((a, b) => {
    const av = a.role === "venue" ? 1 : 0;
    const bv = b.role === "venue" ? 1 : 0;
    if (av !== bv) return bv - av;
    return b.score - a.score;
  });

  if (scored[0]) {
    const top = scored[0];
    seen.add(top.biz.id);
    brands.push({
      businessId: top.biz.id,
      name: top.biz.name,
      type: top.biz.type,
      logoUrl: logoFor(top.biz),
      color: directoryTypeColor(top.biz.type),
      role: top.role,
      score: top.score,
      reasons: top.reasons,
    });
  }

  // Groups / orgs named in title or description
  const text = `${title} ${description}`.toLowerCase();
  const titleKey = normalizeVenueKey(title);

  for (const biz of active) {
    if (biz.type !== "group" && biz.type !== "nonprofit") continue;
    if (seen.has(biz.id)) continue;
    const nameKey = normalizeVenueKey(biz.name);
    if (!nameKey || nameKey.length < 3) continue;
    const nameLow = biz.name.toLowerCase();
    const mentioned =
      text.includes(nameLow) ||
      (nameKey.length >= 4 && (titleKey.includes(nameKey) || text.replace(/[^a-z0-9]+/g, " ").includes(nameKey))) ||
      nameLooselyMatch(title, biz.name);

    if (!mentioned) continue;
    if (biz.type === "nonprofit" && !text.includes(nameLow) && !nameLooselyMatch(title, biz.name)) {
      continue;
    }

    seen.add(biz.id);
    brands.push({
      businessId: biz.id,
      name: biz.name,
      type: biz.type,
      logoUrl: logoFor(biz),
      color: directoryTypeColor(biz.type),
      role: biz.type === "group" ? "group" : "place",
      score: text.includes(nameLow) ? 80 : 55,
      reasons: ["Named in event title/description"],
    });
  }

  // Order: group first, then venue (UI: Group - Venue - Flyer)
  const group = brands.find(b => b.role === "group");
  const venue = brands.find(b => b.role === "venue") || brands.find(b => b.role === "place");
  const out: DirectoryBrand[] = [];
  if (group) out.push(group);
  if (venue && (!group || venue.businessId !== group.businessId)) out.push(venue);
  if (!out.length) return brands.slice(0, 2);
  // Always ensure logoUrl is a usable path (pack → DB → type fallback)
  return out.map(b => ({
    ...b,
    logoUrl: b.logoUrl || directoryFallbackLogo(b.type || "venue"),
  }));
}

/** Re-resolve logos on stored brands (pack paths may improve after logo map updates). */
export function rehydrateDirectoryBrands(
  brands: DirectoryBrand[] | null | undefined,
  draft: IngestEventDraft,
  businesses: Business[],
  opts?: MatchDirectoryBrandsOpts,
): DirectoryBrand[] {
  // Always rematch so fuzzy/address improvements apply to old queue rows
  const fresh = matchDirectoryBrands(draft, businesses, opts);
  if (fresh.length) return fresh;
  if (!brands?.length) return [];
  return brands.map(b => {
    const biz = businesses.find(x => x.id === b.businessId);
    return {
      ...b,
      logoUrl: biz
        ? logoFor(biz)
        : b.logoUrl || directoryFallbackLogo(b.type || "venue"),
      color: b.color || directoryTypeColor(b.type || "venue"),
    };
  });
}
