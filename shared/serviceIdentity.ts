import { companyLogoEntry } from "./whiteCompanyLogos";

export type ServiceKind = "tattoo" | "hair" | "massage" | "graphic-design" | "web-development" | "healthcare" | "general";
export type ServiceIdentitySource = { name: string; type?: string | null; description?: string | null; desc?: string; serviceTags?: string[] };
const key = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const KNOWN_KINDS: Record<string, ServiceKind> = {
  greenhousehaircollective: "hair", limelightsalon: "hair", lovesalonpdx: "hair", lovesalon: "hair", bestcoastbarberco: "hair",
  blackholebodypiercingtattoo: "tattoo", ritualarts: "tattoo", robotpiercingandtattoo: "tattoo", sonnyshouseoftattoosandtreasures: "tattoo", plushtattoointuitivearts: "tattoo",
  thrivetherapeuticmassage: "massage", waywardmassagetherapist: "massage", restandritual: "massage",
  unlockcollective: "web-development", smondaystudios: "web-development", studioanansi: "web-development", dogoodbizstudio: "graphic-design",
};
export const SERVICE_IDENTITIES: Record<ServiceKind, { label: string; icon: string }> = {
  tattoo: { label: "Tattoo & piercing", icon: "/mapz-map/icons/services/tattoo.svg" },
  hair: { label: "Hair services", icon: "/mapz-map/icons/services/hair.svg" },
  massage: { label: "Massage & bodywork", icon: "/mapz-map/icons/services/massage.svg" },
  "graphic-design": { label: "Graphic design", icon: "/mapz-map/icons/services/graphic-design.svg" },
  "web-development": { label: "Web design & development", icon: "/mapz-map/icons/services/web-development.svg" },
  healthcare: { label: "Health care", icon: "/mapz-map/icons/types/healthcare.svg" },
  general: { label: "Services", icon: "/mapz-map/icons/types/service.svg" },
};
export function serviceIdentity(source: ServiceIdentitySource) {
  let kind = KNOWN_KINDS[key(source.name)];
  const label = [source.name, ...(source.type === "service" ? [source.description || source.desc || "", ...(source.serviceTags || [])] : [])].join(" ");
  if (!kind) {
    if (/\b(tattoo|piercing)\b/i.test(label)) kind = "tattoo";
    else if (/\b(haircut|barber|hairstyl\w*|hair (?:salon|studio|collective))\b/i.test(label)) kind = "hair";
    else if (/\b(massage|bodywork)\b/i.test(label)) kind = "massage";
    else if (/\b(web(?:site)? (?:design|development|developer)|wordpress|web dev)\b/i.test(label)) kind = "web-development";
    else if (/\b(graphic design|branding (?:studio|agency)|illustrator)\b/i.test(label)) kind = "graphic-design";
    else if (source.type === "healthcare") kind = "healthcare";
    else if (source.type === "service") kind = "general";
  }
  return kind ? { kind, ...SERVICE_IDENTITIES[kind] } : null;
}
/** Authored text assets are name placeholders, not company artwork. */
export function serviceArtwork(source: ServiceIdentitySource, logo: string | null | undefined) {
  return serviceIdentity(source) && companyLogoEntry(source.name)?.kind === "text-fallback" ? null : logo || null;
}
/** Cards and waypoints share the same service icon whenever company artwork is absent. */
export function serviceWaypointLogo(source: ServiceIdentitySource, logo?: string | null) {
  return serviceArtwork(source, logo) || serviceIdentity(source)?.icon || null;
}
