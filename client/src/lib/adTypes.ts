/** Client types for Ad Manager + public serve payloads. */

export type AdFormat = "feed" | "poster";
export type AdStatus = "live" | "scheduled" | "paused" | "ended";
export type AdSource = "template" | "custom" | "manual";
export type AdMediaMode = "single" | "slideshow";
export type AdAudience = "everyone" | "members" | "guests";

export type AdRecord = {
  id: number;
  format: AdFormat;
  business: string;
  pillLabel: string;
  title: string;
  body: string;
  ctaTitle: string;
  ctaCopy: string;
  logoText: string;
  logoImg: string | null;
  tag1: string;
  tag2: string;
  destUrl: string;
  primaryColor: string;
  secondaryColor: string;
  mediaMode: AdMediaMode;
  singleSrc: string | null;
  slides: string[];
  slideAuto: boolean;
  slideMs: number;
  slideArrows: boolean;
  placeAll: boolean;
  placeFollowing: boolean;
  placeEvents: boolean;
  placeSpotted: boolean;
  cadence: number;
  pinTop: boolean;
  scrollDepths: number[];
  audience: AdAudience;
  dismissible: boolean;
  maxImpr: number;
  maxPerDay: number;
  minEvents: number;
  scatterPct: number;
  onePerDay: boolean;
  neverFirst: boolean;
  noAdjacent: boolean;
  weight: number;
  freqCap: number;
  startDate: string | null;
  endDate: string | null;
  days: string[];
  status: AdStatus;
  impressions: number;
  clicks: number;
  contact?: string;
  billing?: string;
  templateKey: string | null;
  source: AdSource;
  ownerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdServePayload = Omit<AdRecord, "contact" | "billing" | "ownerId">;

export type AdStats = {
  liveCount: number;
  impressions: number;
  clicks: number;
  avgCtr: number;
  ads: Array<{
    id: number;
    business: string;
    title: string;
    status: AdStatus;
    format: AdFormat;
    source: AdSource;
    templateKey: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
    startDate: string | null;
    endDate: string | null;
    contact: string;
    billing: string;
    primaryColor: string;
  }>;
};

/** Draft shape used by the builder (may not have id yet). */
export type AdDraft = Omit<AdRecord, "id" | "impressions" | "clicks" | "createdAt" | "updatedAt"> & {
  id?: number;
  impressions?: number;
  clicks?: number;
};

export function emptyAdDraft(format: AdFormat = "feed"): AdDraft {
  return {
    format,
    business: "",
    pillLabel: "Affiliate",
    title: "",
    body: "",
    ctaTitle: "",
    ctaCopy: "",
    logoText: "",
    logoImg: null,
    tag1: "",
    tag2: "",
    destUrl: "",
    primaryColor: format === "poster" ? "#39ff14" : "#ff1f1f",
    secondaryColor: "#ffffff",
    mediaMode: "single",
    singleSrc: null,
    slides: [],
    slideAuto: true,
    slideMs: format === "poster" ? 3200 : 2600,
    slideArrows: false,
    placeAll: true,
    placeFollowing: true,
    placeEvents: true,
    placeSpotted: false,
    cadence: 0,
    pinTop: false,
    scrollDepths: format === "feed" ? [40] : [],
    audience: "everyone",
    dismissible: format === "feed",
    maxImpr: 0,
    maxPerDay: 5,
    minEvents: 2,
    scatterPct: 45,
    onePerDay: true,
    neverFirst: true,
    noAdjacent: true,
    weight: 1,
    freqCap: 0,
    startDate: null,
    endDate: null,
    days: [],
    status: "scheduled",
    templateKey: null,
    source: "custom",
    contact: "",
    billing: "",
  };
}

/** CockBlock + Mr S templates for the builder pickers. */
export function templateDraft(key: "cockblock-feed" | "mrs-feed" | "cockblock-poster" | "mrs-poster"): AdDraft {
  if (key === "cockblock-feed") {
    return {
      ...emptyAdDraft("feed"),
      business: "CockBlock",
      title: "Meet CockBlock Stroke",
      body: "The only frot toy for people with a penis · new hand-held design · gay owned",
      ctaTitle: "10% Off · Code: TUCKERMAX",
      ctaCopy: "cockblocktoys.com · free US & CA shipping",
      logoText: "CockBlock",
      logoImg: "/affiliate/feed/cb-logo-white.png",
      destUrl: "https://cockblocktoys.com/tucker060",
      primaryColor: "#ff1f1f",
      mediaMode: "slideshow",
      slides: [
        "/affiliate/feed/cb-social.png",
        "/affiliate/feed/cb-handhold.jpg",
        "/affiliate/feed/cb-models.png",
      ],
      scrollDepths: [40],
      templateKey: "cockblock-feed",
      source: "template",
      contact: "affiliate@cockblocktoys.com",
      billing: "Affiliate · code TUCKERMAX",
    };
  }
  if (key === "mrs-feed") {
    return {
      ...emptyAdDraft("feed"),
      business: "Mr. S Leather",
      title: "Gear Up at Mr S Leather",
      body: "Leather · rubber · fetish gear · made in San Francisco since 1979",
      ctaTitle: "Get your gear for Dore & Folsom",
      ctaCopy: "mr-s-leather.com · ships worldwide",
      logoText: "Mr. S Leather",
      logoImg: "/affiliate/feed/mrs-logo.webp",
      destUrl: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
      primaryColor: "#ff0033",
      mediaMode: "single",
      singleSrc: "/affiliate/feed/mrs-logo.webp",
      scrollDepths: [80],
      templateKey: "mrs-feed",
      source: "template",
      contact: "affiliate@mr-s-leather.com",
      billing: "Affiliate · code TUCKERMAX",
    };
  }
  if (key === "cockblock-poster") {
    return {
      ...emptyAdDraft("poster"),
      business: "CockBlock Toys",
      title: "CockBlock Toys",
      body: "The original frot toy, made for two",
      ctaTitle: "Code TUCKERMAX for 10% off",
      ctaCopy: "Shop Now →",
      tag1: "Toys & Play",
      tag2: "Gay-Owned",
      destUrl: "https://cockblocktoys.com/tucker060",
      primaryColor: "#ff0033",
      mediaMode: "slideshow",
      slides: ["/affiliate/cb1.jpg", "/affiliate/cb2.png", "/affiliate/cb3.png"],
      slideMs: 3200,
      templateKey: "cockblock-poster",
      source: "template",
      contact: "affiliate@cockblocktoys.com",
      billing: "Affiliate · code TUCKERMAX",
    };
  }
  return {
    ...emptyAdDraft("poster"),
    business: "Mr. S Leather",
    title: "Mr. S Leather",
    body: "Harnesses, restraints & fetish gear, made in SF",
    ctaTitle: "Shop the link, support the guide",
    ctaCopy: "Shop Now →",
    tag1: "Leather & Gear",
    tag2: "Ships Worldwide",
    destUrl: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
    primaryColor: "#ff0033",
    mediaMode: "single",
    singleSrc: "/affiliate/mrs.webp",
    templateKey: "mrs-poster",
    source: "template",
    contact: "affiliate@mr-s-leather.com",
    billing: "Affiliate · code TUCKERMAX",
  };
}
