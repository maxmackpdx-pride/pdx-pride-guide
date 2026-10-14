import { whiteCompanyLogo } from "@shared/whiteCompanyLogos";
import { normalizeDirectoryName } from "@/lib/directoryLogos";

import { companyLogoEntry } from "@shared/whiteCompanyLogos";
import { companyFallbackIcon } from "@shared/serviceIdentity";

// Match only saved company names and aliases; never guess a venue from an event title.
export function fallbackEventLogo(title: string, venueName: string): string | null {
  if (/\bbearracuda\b/i.test(title)) return whiteCompanyLogo("Bearracuda");
  const normalized = normalizeDirectoryName(venueName);
  const name = normalized === "portlandeagle" ? "Eagle Portland" : venueName;
  const reviewed = companyLogoEntry(name);
  return reviewed ? reviewed.kind === "text-fallback" ? companyFallbackIcon({name, type:"venue"}) : whiteCompanyLogo(name) : null;
}

export default function EventFallbackLogo({ title, venueName }: { title: string; venueName: string }) {
  const src = fallbackEventLogo(title, venueName);
  return src ? <span className="event-fallback-logo" style={{ backgroundImage: `url("${src}")` }} aria-hidden="true" /> : null;
}
