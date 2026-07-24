/**
 * Prefill directory "Add place" form from venue name + optional website/address.
 * Uses Nominatim geocode + light website scrape (title, description, socials, phone).
 */
import { geocodePortlandLocation } from "../venueCoordinates";
import { assertSafePublicUrl } from "../ingest/ssrf";

export type DirectoryLookupInput = {
  name: string;
  address?: string | null;
  website?: string | null;
  description?: string | null;
};

export type DirectoryLookupResult = {
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  website: string;
  instagram: string;
  phone: string;
  hours: string;
  imageUrl: string;
  lat: number | null;
  lng: number | null;
  type: string;
  sources: string[];
  warnings: string[];
};

function guessType(name: string, text: string): string {
  const hay = `${name} ${text}`.toLowerCase();
  if (/\b(bar|pub|tavern|lounge|club|nightclub|brewery)\b/.test(hay)) return "bar";
  if (/\b(theater|theatre|venue|ballroom|hall|arena)\b/.test(hay)) return "venue";
  if (/\b(cafe|coffee|restaurant|diner|kitchen|eatery)\b/.test(hay)) return "restaurant";
  if (/\b(shop|store|boutique|bookstore)\b/.test(hay)) return "shop";
  if (/\b(nonprofit|centre|center|q\s*center|clinic|health)\b/.test(hay)) return "nonprofit";
  return "venue";
}

function extractMeta(html: string, prop: string): string | null {
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i",
  );
  return html.match(re1)?.[1] || html.match(re2)?.[1] || null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractInstagram(html: string): string {
  const m =
    html.match(/instagram\.com\/([A-Za-z0-9._]{2,30})/i) ||
    html.match(/@([A-Za-z0-9._]{2,30})\b[^<]{0,40}instagram/i);
  if (!m) return "";
  const handle = m[1].replace(/\/$/, "");
  if (/^(p|reel|stories|explore|accounts)$/i.test(handle)) return "";
  return `@${handle}`;
}

function extractPhone(html: string): string {
  const m = html.match(
    /(?:tel:|phone|call us)[^0-9+]{0,20}(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i,
  ) || html.match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);
  return m ? String(m[1] || m[0]).trim() : "";
}

function extractNeighborhood(address: string): string {
  // "123 Main St, Pearl District, Portland, OR" or common PDX hoods in address
  const hoods = [
    "Pearl District",
    "Old Town",
    "Alberta",
    "Hawthorne",
    "Division",
    "North Portland",
    "NE Portland",
    "SE Portland",
    "NW Portland",
    "SW Portland",
    "Mississippi",
    "Belmont",
    "Foster",
    "St. Johns",
    "Sellwood",
    "Montavilla",
    "Kerns",
    "Buckman",
    "Lloyd",
    "Downtown",
  ];
  for (const h of hoods) {
    if (new RegExp(h.replace(".", "\\."), "i").test(address)) return h;
  }
  return "";
}

async function scrapeWebsite(website: string): Promise<{
  description: string;
  instagram: string;
  phone: string;
  imageUrl: string;
  title: string;
  warnings: string[];
}> {
  const warnings: string[] = [];
  try {
    const safe = await assertSafePublicUrl(website);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(safe.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Zaylist-DirectoryLookup/1.0; +https://www.zaylist.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(t);
    if (!res.ok) {
      warnings.push(`Website HTTP ${res.status}`);
      return { description: "", instagram: "", phone: "", imageUrl: "", title: "", warnings };
    }
    const html = (await res.text()).slice(0, 800_000);
    const ogDesc =
      extractMeta(html, "og:description") ||
      extractMeta(html, "description") ||
      extractMeta(html, "twitter:description");
    const ogImage = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
    const title =
      extractMeta(html, "og:title") ||
      html.match(/<title[^>]*>([^<]{2,120})<\/title>/i)?.[1] ||
      "";
    return {
      description: ogDesc ? decodeEntities(ogDesc).slice(0, 800) : "",
      instagram: extractInstagram(html),
      phone: extractPhone(html),
      imageUrl: ogImage ? decodeEntities(ogImage).slice(0, 800) : "",
      title: title ? decodeEntities(title).slice(0, 200) : "",
      warnings,
    };
  } catch (err: any) {
    warnings.push(err?.message || "Website fetch failed");
    return { description: "", instagram: "", phone: "", imageUrl: "", title: "", warnings };
  }
}

/**
 * Look up general business info for directory prefill.
 */
export async function lookupDirectoryPlace(
  input: DirectoryLookupInput,
): Promise<DirectoryLookupResult> {
  const name = String(input.name || "").trim();
  const addressIn = String(input.address || "").trim();
  let website = String(input.website || "").trim();
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

  const sources: string[] = [];
  const warnings: string[] = [];

  let description = String(input.description || "").trim();
  let address = addressIn;
  let neighborhood = extractNeighborhood(address);
  let instagram = "";
  let phone = "";
  let hours = "";
  let imageUrl = "";
  let lat: number | null = null;
  let lng: number | null = null;

  // Geocode first (name + address → lat/lng + sometimes better address)
  const coords = await geocodePortlandLocation(address || null, name || null);
  if (coords) {
    lat = coords.lat;
    lng = coords.lng;
    sources.push("nominatim");
  } else {
    warnings.push("Could not geocode - add address manually if needed");
  }

  // Website scrape for blurb / social / phone / logo
  if (website) {
    const web = await scrapeWebsite(website);
    sources.push("website");
    warnings.push(...web.warnings);
    if (web.description && (description.length < 20 || /found via qsearch/i.test(description))) {
      description = web.description;
    }
    if (web.instagram) instagram = web.instagram;
    if (web.phone) phone = web.phone;
    if (web.imageUrl) imageUrl = web.imageUrl;
  }

  if (!description || description.length < 10) {
    description =
      `${name}${address ? ` at ${address}` : ""} - Portland LGBTQ+ friendly place. Edit this blurb before saving.`.slice(
        0,
        500,
      );
    warnings.push("Using placeholder description - edit before save");
  }

  if (!neighborhood && address) neighborhood = extractNeighborhood(address);

  return {
    name,
    description: description.slice(0, 800),
    address,
    neighborhood,
    website,
    instagram,
    phone,
    hours,
    imageUrl,
    lat,
    lng,
    type: guessType(name, description),
    sources,
    warnings,
  };
}
