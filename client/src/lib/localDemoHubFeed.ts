/**
 * Scene-feed + right-rail demo data for local Hub review (no session).
 * Shape matches live APIs so card/rail styling is real.
 */
import type { HubFeedItem, HubFeedResponse, HubFeedTab } from "@shared/hubFeed";
import { filterHubFeedItems, filterHubFeedPinned } from "@shared/hubFeed";
import type { PeopleHubUser } from "@shared/peopleHub";
import type { HubEventRow } from "@/components/hub/sections/HubEvents";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

/** Prefer real local DB ids when present (see /api/events). */
const STANK_EVENT_ID = 13;
const DANCE_EVENT_ID = 85;

/** Two cards that match the design-system hub feed examples (RSVP + submitted). */
export function getLocalDemoHubFeedItems(): HubFeedItem[] {
  return [
    {
      id: "demo-rsvp-joel",
      kind: "rsvp",
      badge: "RSVP",
      action: "is going",
      text: "I'll be there",
      createdAt: hoursAgo(4),
      author: {
        displayName: "Joel Kimmel-Staebler",
        username: "joel_ks",
        avatarChoice: 2,
        avatarRing: "pride",
      },
      event: {
        id: STANK_EVENT_ID,
        title: "Stank x Yes Coach: Pride Weekend",
        venueName: "Sanctuary",
        dayOfWeek: "SAT",
        dateStart: "2026-07-18T20:00:00",
        admission: "TICKETED",
        goingCount: 3,
      },
    },
    {
      id: "demo-event-norse",
      kind: "event",
      badge: "Submitted",
      action: "submitted a new event",
      text:
        "We're in the Grand Ballroom tonight at Norse Hall! Join our raffle at the event. 50% of our raffle proceeds will be donated to SMYRC. The remaining donations are put back into Stomptown Dance Association's (a 5013c non-profit) event funds.",
      createdAt: hoursAgo(28),
      author: {
        displayName: "Norse Hall",
        username: "norsehall",
        avatarChoice: 4,
        avatarRing: "none",
        venueLogo: false,
      },
      event: {
        id: DANCE_EVENT_ID,
        title: "Stomptown Pride Dance",
        venueName: "Norse Hall",
        dayOfWeek: "SAT",
        dateStart: "2026-07-18T21:00:00",
        admission: "TICKETED",
        goingCount: 0,
      },
    },
  ];
}

export function getLocalDemoHubFeed(tab: HubFeedTab = "all"): HubFeedResponse {
  const all = getLocalDemoHubFeedItems();
  return {
    items: filterHubFeedItems(all, tab),
    pinned: filterHubFeedPinned([], tab),
    nextCursor: null,
  };
}

/**
 * Right-rail “Your next moves” — design shows featured datetime row + day-dot row.
 * First row: full when-line (no day dot). Second: day chip + short venue line.
 */
export function getLocalDemoNextMoves(): HubEventRow[] {
  return [
    {
      id: "demo-stank-featured",
      title: "Stank x Yes Coach: Pride Weekend",
      when: "Sanctuary · 7/18/2026, 8:00:00 PM",
      // no dayOfWeek → no day-dot (featured line)
      neighborhood: "Pearl",
    },
    {
      id: STANK_EVENT_ID,
      title: "Stank x Yes Coach: Pride Weekend",
      when: "Sat · Sanctuary",
      dayOfWeek: "SAT",
      neighborhood: "Pearl",
      going: 3,
    },
  ];
}

/** Right-rail “Who to follow” — verified hosts matching design mock. */
export function getLocalDemoWhoToFollow(): PeopleHubUser[] {
  return [
    {
      id: -101,
      username: "Stomptown",
      displayName: "Stomptown",
      photoUrl: null,
      avatarChoice: 1,
      avatarRing: "pride",
      bio: null,
      verifiedHost: true,
      followers: 128,
      isFollowing: false,
      subtitle: "Verified host",
    },
    {
      id: -102,
      username: "repeatbehavior",
      displayName: "Repeat Behavior",
      photoUrl: null,
      avatarChoice: 3,
      avatarRing: "pride",
      bio: null,
      verifiedHost: true,
      followers: 96,
      isFollowing: false,
      subtitle: "Verified host",
    },
    {
      id: -103,
      username: "djsappho",
      displayName: "DJ Sappho",
      photoUrl: null,
      avatarChoice: 5,
      avatarRing: "pride",
      bio: null,
      verifiedHost: true,
      followers: 210,
      isFollowing: false,
      subtitle: "Verified host",
    },
  ];
}
