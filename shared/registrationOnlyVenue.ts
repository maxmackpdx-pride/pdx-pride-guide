/** Venues whose organizers send the location only to registered guests. */
const privateVenueNames = new Set(["subrosapdx", "subrosaportland", "meetrack", "meetrackatdarkroom", "themeetrackatdarkroom"]);
export const REGISTRATION_ADDRESS = "Register for address";

export function hasRegistrationOnlyLocation(event: { venueName?: unknown; address?: unknown }): boolean {
  const venue = String(event.venueName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const address = String(event.address ?? "").trim();
  return privateVenueNames.has(venue) || /^register for (?:the )?address[.!]?$/i.test(address);
}
