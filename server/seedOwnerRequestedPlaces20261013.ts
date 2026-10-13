import type Database from "better-sqlite3";

/** Tucker-requested additions. Contacts and services checked against first-party pages on 2026-10-13. */
export const OWNER_REQUESTED_PLACES_20261013 = [
  {
    name: "Black Hole Body Piercing & Tattoo",
    aliases: ["Black Hole", "Black Hole Tattoo and Piercing", "Black Hole Body Piercing", "Black Hole Body Piercing and Tattoo"],
    type: "service",
    description: "Two studios serving the Portland area since 1994, offering professional body piercing, jewelry and custom tattoos. Book through the website or call your chosen studio. Piercing fees exclude jewelry. Piercing walk-ins are for clients 13 and older; ages 8–12 require appointments. Availability varies and appointments take priority. Bring valid ID; minors need a parent or legal guardian with ID. Confirm age and anatomy requirements for the requested service.\n\nPortland: 2946 NE Glisan St · 503-231-0712 · 11 am–7 pm daily.\nBeaverton: 12550 SW 1st St · 503-672-9399 · 11 am–7 pm Friday–Tuesday; call for Wednesday–Thursday hours.\n\nServices, contacts and hours checked October 13, 2026: https://www.blackholebodypiercing.com/",
    address: "2946 NE Glisan St, Portland, OR 97232",
    neighborhood: "Portland / Beaverton",
    website: "https://www.blackholebodypiercing.com/",
    phone: "503-231-0712",
    hours: "Portland: 11 am–7 pm daily. Beaverton: 11 am–7 pm Friday–Tuesday; call for Wednesday–Thursday hours.",
    imageUrl: "/directory-logos/blackholebodypiercingandtattoo-white.svg",
    sourceUrls: ["https://www.blackholebodypiercing.com/"],
    locations: [
      { label: "Portland", address: "2946 NE Glisan St, Portland, OR 97232", phone: "503-231-0712", hours: "11 am–7 pm daily" },
      { label: "Beaverton", address: "12550 SW 1st St, Beaverton, OR 97005", phone: "503-672-9399", hours: "11 am–7 pm Friday–Tuesday; call for Wednesday–Thursday hours" },
    ],
  },
  {
    name: "Cockeye Kink",
    aliases: ["Cockeyekink", "CockEye Kink", "Cockeye-Kink"],
    type: "shop",
    description: "Custom fetish-gear maker supporting the local kink community, based in Lake Tapps, Washington. Designs harnesses, suspenders, pendants and other custom pieces using water-jet cutting. Call or use the contact form to arrange a design appointment and discuss your order. Visits are by appointment; this is outside the Portland area. Confirm pricing, lead time and delivery or pickup options directly.\n\nContacts and services checked October 13, 2026: https://cockeyekink.com/contact-us · https://cockeyekink.com/about-us-1",
    address: null,
    neighborhood: "Local community support · Contact by appointment",
    website: "https://cockeyekink.com/",
    phone: "360-791-6528",
    hours: "By appointment, Monday–Sunday; arrange a visit in advance.",
    imageUrl: "/directory-logos/cockeyekink-white.svg",
    sourceUrls: ["https://cockeyekink.com/about-us-1", "https://cockeyekink.com/contact-us"],
    // Owner direction: a grid listing for local support, with no street address or map pin.
    locations: [],
  },
];

const normalizedName = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
const normalizedWebsite = (value: string | null) => (value || "").toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** Insert missing identities only. Re-running preserves existing owner-edited records. */
export function seedOwnerRequestedPlaces20261013(sqlite: Database.Database): string[] {
  return sqlite.transaction(() => {
    const existing = sqlite.prepare("SELECT name, website FROM businesses").all() as { name: string; website: string | null }[];
    const insert = sqlite.prepare(`INSERT INTO businesses
      (name, type, description, address, neighborhood, website, phone, hours, image_url, locations,
       queer_owned, queer_friendly, active, ingest_events, status, is_new, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, 0, 'OPEN', 0, ?)`);
    const added: string[] = [];
    for (const place of OWNER_REQUESTED_PLACES_20261013) {
      const names = new Set([place.name, ...place.aliases].map(normalizedName));
      if (existing.some(row => names.has(normalizedName(row.name)) || normalizedWebsite(row.website) === normalizedWebsite(place.website))) continue;
      insert.run(place.name, place.type, place.description, place.address, place.neighborhood, place.website,
        place.phone, place.hours, place.imageUrl, JSON.stringify(place.locations), new Date().toISOString());
      existing.push({ name: place.name, website: place.website });
      added.push(place.name);
    }
    return added;
  })();
}
