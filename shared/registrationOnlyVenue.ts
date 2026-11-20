/** Venues whose organizers send the location only to registered guests. */
const registrationOnlyVenueKeys = new Map<string, string>([
  ["subrosapdx", "sub rosa pdx"],
  ["subrosaportland", "sub rosa pdx"],
  ["meetrack", "the meet rack at darkroom"],
  ["themeetrack", "the meet rack at darkroom"],
  ["meetrackatdarkroom", "the meet rack at darkroom"],
  ["themeetrackatdarkroom", "the meet rack at darkroom"],
]);

export function registrationOnlyVenueKey(name: unknown): string | undefined {
  const key = String(name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return registrationOnlyVenueKeys.get(key);
}

export const REGISTRATION_ADDRESS = "Register for address";

export function hasRegistrationOnlyLocation(event: { venueName?: unknown; address?: unknown }): boolean {
  const address = String(event.address ?? "").trim();
  return Boolean(registrationOnlyVenueKey(event.venueName)) || /^register for (?:the )?address[.!]?$/i.test(address);
}
