export type DirectoryMatchConfidence = "high" | "medium" | "low";

export type DirectoryMatchCandidate = {
  businessId: number;
  name: string;
  type: string;
  address: string | null;
  neighborhood: string | null;
  score: number;
  confidence: DirectoryMatchConfidence;
  reasons: string[];
};

type MatchableDirectoryListing = {
  name: string;
  type?: string | null;
  address?: string | null;
  neighborhood?: string | null;
};

function normalizePlaceName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^the\s+/, "")
    .replace(/[''`]/g, "")
    .replace(/\b(club|bar|theatre|theater|lounge|pdx|portland)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddressKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/,?\s*portland,?\s*(or|oregon)?\s*\d{0,5}(-\d{4})?/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2),
  );
}

function tokenOverlapScore(a: string, b: string): number {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const token of Array.from(ta)) {
    if (tb.has(token)) shared += 1;
  }
  const union = new Set([...Array.from(ta), ...Array.from(tb)]).size;
  return union === 0 ? 0 : shared / union;
}

function namesMatch(a: string, b: string): boolean {
  const ak = normalizePlaceName(a);
  const bk = normalizePlaceName(b);
  if (!ak || !bk) return false;
  if (ak === bk) return true;
  if (ak.length >= 4 && bk.length >= 4 && (ak.includes(bk) || bk.includes(ak))) return true;
  return false;
}

function addressesMatch(a?: string | null, b?: string | null): boolean {
  const ak = a ? normalizeAddressKey(a) : "";
  const bk = b ? normalizeAddressKey(b) : "";
  return Boolean(ak && bk && ak === bk);
}

function neighborhoodsMatch(a?: string | null, b?: string | null): boolean {
  const ak = a?.trim().toLowerCase();
  const bk = b?.trim().toLowerCase();
  return Boolean(ak && bk && ak === bk);
}

function confidenceFromScore(score: number): DirectoryMatchConfidence {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function scoreDirectoryListingAgainstBusiness(
  listing: MatchableDirectoryListing,
  business: MatchableDirectoryListing & { id: number },
): DirectoryMatchCandidate | null {
  const reasons: string[] = [];
  let score = 0;

  if (namesMatch(listing.name, business.name)) {
    score += 50;
    reasons.push("Same name");
  } else {
    const titleScore = tokenOverlapScore(listing.name, business.name);
    if (titleScore >= 0.45) {
      score += Math.round(titleScore * 35);
      reasons.push("Similar name");
    }
  }

  if (addressesMatch(listing.address, business.address)) {
    score += 40;
    reasons.push("Same address");
  }

  if (neighborhoodsMatch(listing.neighborhood, business.neighborhood)) {
    score += 10;
    reasons.push("Same neighborhood");
  }

  if (listing.type && business.type && listing.type === business.type) {
    score += 5;
    reasons.push("Same category");
  }

  if (score < 30) return null;

  return {
    businessId: business.id,
    name: business.name,
    type: business.type || "venue",
    address: business.address ?? null,
    neighborhood: business.neighborhood ?? null,
    score,
    confidence: confidenceFromScore(score),
    reasons,
  };
}

export function findDirectoryMatches(
  listing: MatchableDirectoryListing,
  businesses: Array<MatchableDirectoryListing & { id: number }>,
  opts?: { minScore?: number; limit?: number; excludeBusinessId?: number | null },
): DirectoryMatchCandidate[] {
  const minScore = opts?.minScore ?? 30;
  const limit = opts?.limit ?? 5;
  const excludeId = opts?.excludeBusinessId ?? null;

  const ranked = businesses
    .filter(biz => biz.id !== excludeId)
    .map(biz => scoreDirectoryListingAgainstBusiness(listing, biz))
    .filter((m): m is DirectoryMatchCandidate => m != null && m.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}

export function directoryHasStrongDuplicate(
  matches: DirectoryMatchCandidate[],
): DirectoryMatchCandidate | undefined {
  return matches.find(m => m.confidence === "high");
}

export type DirectoryMergePayload = {
  description?: string;
  hours?: string | null;
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
  neighborhood?: string | null;
  queerOwned?: boolean;
  queerFriendly?: boolean;
};

export function buildDirectoryMergePatch(
  mergePayload: DirectoryMergePayload,
): Record<string, string | boolean | null> {
  const patch: Record<string, string | boolean | null> = {};
  const stringFields = ["description", "hours", "phone", "website", "instagram", "neighborhood"] as const;
  for (const key of stringFields) {
    const value = mergePayload[key];
    if (typeof value === "string" && value.trim()) {
      patch[key] = value.trim();
    }
  }
  if (mergePayload.queerOwned !== undefined) patch.queerOwned = mergePayload.queerOwned;
  if (mergePayload.queerFriendly !== undefined) patch.queerFriendly = mergePayload.queerFriendly;
  return patch;
}