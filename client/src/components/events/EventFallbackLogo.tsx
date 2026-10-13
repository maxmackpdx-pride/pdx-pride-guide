import { normalizeDirectoryName } from "@/lib/directoryLogos";

// Only exact, known identities with an existing white mark. Never infer a
// venue from words in an event title or reuse a traveling group's last venue.
const VENUE_LOGOS: Record<string, string> = {
  sanctuaryclub: "/directory-logos/Sanctuary_Club-white.png",
  eagleportland: "/directory-logos/Eagle_Portland-white.png",
  portlandeagle: "/directory-logos/Eagle_Portland-white.png",
  badlands: "/directory-logos/Badlands-white.png",
  thesportsbra: "/directory-logos/The_Sports_Bra-white.png",
  qcenter: "/directory-logos/place-qcenter-white.png",
  steamportland: "/directory-logos/place-steamportland-white.png",
  campbarpdx: "/directory-logos/Camp_Bar_PDX-white.png",
  darcellexvshowplace: "/directory-logos/Darcelle_XV_Showplace-white.png",
  ccslaughters: "/directory-logos/CC_Slaughters-white.png",
  hawkspdx: "/directory-logos/Hawks_PDX-white.png",
  scandalseast: "/directory-logos/Scandals_East-white.png",
  peacockpdx: "/directory-logos/Peacock_PDX-white.png",
  trianglerecreationcamp: "/directory-logos/Triangle_Recreation_Camp-white.png",
  novapdx: "/directory-logos/Nova_PDX-white.png",
};

export function fallbackEventLogo(title: string, venueName: string): string | null {
  if (/\bbearracuda\b/i.test(title)) return "/directory-logos/Bearracuda-white.png";
  return VENUE_LOGOS[normalizeDirectoryName(venueName)] || null;
}

export default function EventFallbackLogo({ title, venueName }: { title: string; venueName: string }) {
  const src = fallbackEventLogo(title, venueName);
  return src ? <span className="event-fallback-logo" style={{ backgroundImage: `url("${src}")` }} aria-hidden="true" /> : null;
}
