import { whiteCompanyLogo } from "@shared/whiteCompanyLogos";
import { normalizeDirectoryName } from "@/lib/directoryLogos";

// Only exact, known identities with an existing white mark. Never infer a
// venue from words in an event title or reuse a traveling group's last venue.
const VENUE_NAMES = new Set([
  "sanctuaryclub",
  "eagleportland",
  "portlandeagle",
  "badlands",
  "thesportsbra",
  "qcenter",
  "steamportland",
  "campbarpdx",
  "darcellexvshowplace",
  "ccslaughters",
  "hawkspdx",
  "scandalseast",
  "peacockpdx",
  "trianglerecreationcamp",
  "novapdx"
]);

export function fallbackEventLogo(title: string, venueName: string): string | null {
  if (/\bbearracuda\b/i.test(title)) return whiteCompanyLogo("Bearracuda");
  const normalized = normalizeDirectoryName(venueName);
  return VENUE_NAMES.has(normalized) ? whiteCompanyLogo(normalized === "portlandeagle" ? "Eagle Portland" : venueName) : null;
}

export default function EventFallbackLogo({ title, venueName }: { title: string; venueName: string }) {
  const src = fallbackEventLogo(title, venueName);
  return src ? <span className="event-fallback-logo" style={{ backgroundImage: `url("${src}")` }} aria-hidden="true" /> : null;
}
