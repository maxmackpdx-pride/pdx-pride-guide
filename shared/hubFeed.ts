export type HubFeedKind =
  | "event"
  | "event_update"
  | "rsvp"
  | "checkin"
  | "gifting"
  | "spotted"
  | "gig"
  | "beach"
  | "feedback"
  | "feed_text"
  | "feed_photo";

export type HubFeedTab = "all" | "events" | "posts" | "rsvps" | "boards";

export type HubFeedAuthor = {
  displayName: string;
  username?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  anonymous?: boolean;
};

export type HubFeedEventEmbed = {
  id: number;
  title: string;
  venueName: string;
  dayOfWeek?: string | null;
  dateStart: string;
  admission: string;
  goingCount?: number;
};

export type HubFeedItem = {
  id: string;
  kind: HubFeedKind;
  badge: string;
  action: string;
  text?: string | null;
  createdAt: string;
  author: HubFeedAuthor;
  event?: HubFeedEventEmbed | null;
  link?: string | null;
  beachId?: string | null;
  beachLabel?: string | null;
  /** Subject line for missed-connection cards (shown in the display font). */
  title?: string | null;
  /** Place hint for missed-connection cards (venue or "around town"). */
  place?: string | null;
  /** Payload for opening the Missed Connections detail card from the feed. */
  spotted?: {
    id: number;
    kindLabel: string;
    kindColor: string;
  } | null;
  /** Numeric board post id for gig/gift cards, used to open the board overlay. */
  boardPostId?: number | null;
  photoUrl?: string | null;
  /** Pinned scene cards sit below live activity; new posts stack above them. */
  pinned?: boolean;
  /** Opens the site feedback modal when set to "feedback". */
  ctaAction?: "feedback" | null;
  ctaLabel?: string | null;
};

export type HubFeedResponse = {
  items: HubFeedItem[];
  pinned: HubFeedItem[];
  nextCursor: string | null;
};

export const HUB_FEED_TABS: Array<{ key: HubFeedTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "events", label: "Events" },
  { key: "posts", label: "Posts" },
  { key: "rsvps", label: "RSVPs" },
  { key: "boards", label: "Boards" },
];

const TAB_PREDICATES: Record<HubFeedTab, (item: HubFeedItem) => boolean> = {
  all: () => true,
  events: (item) => item.kind === "event" || item.kind === "event_update",
  posts: (item) =>
    item.kind === "checkin"
    || item.kind === "beach"
    || item.kind === "feed_text"
    || item.kind === "feed_photo",
  rsvps: (item) => item.kind === "rsvp",
  boards: (item) => ["gifting", "spotted", "gig"].includes(item.kind),
};

export function filterHubFeedPinned(items: HubFeedItem[], tab: HubFeedTab): HubFeedItem[] {
  return items.filter((item) => {
    if (item.kind === "feedback") return tab === "all";
    if (tab === "all") return true;
    if (tab === "events") return item.kind === "event";
    if (tab === "posts") return item.kind === "beach";
    if (tab === "boards") return item.kind === "gig";
    return false;
  });
}

export function filterHubFeedItems(items: HubFeedItem[], tab: HubFeedTab): HubFeedItem[] {
  const pred = TAB_PREDICATES[tab] ?? TAB_PREDICATES.all;
  return items.filter(pred);
}

export function hubFeedBadgeColor(kind: HubFeedKind): string {
  const map: Record<HubFeedKind, string> = {
    event: "var(--panel-cyan)",
    event_update: "var(--panel-orange)",
    rsvp: "var(--status-good)",
    checkin: "var(--status-good)",
    gifting: "var(--panel-lime)",
    spotted: "var(--panel-magenta)",
    gig: "var(--panel-purple)",
    beach: "var(--panel-orange)",
    feedback: "var(--panel-lime)",
    feed_text: "var(--panel-cyan)",
    feed_photo: "var(--panel-magenta)",
  };
  return map[kind] ?? "var(--panel-cyan)";
}

export function parseHubFeedTab(raw: string | null | undefined): HubFeedTab {
  if (raw && (HUB_FEED_TABS as Array<{ key: string }>).some((t) => t.key === raw)) {
    return raw as HubFeedTab;
  }
  return "all";
}