/**
 * Map LIVE GET /api/users/:username (MemberProfileData / activity.*) into the
 * reimagined profile view-model (PublicProfileData). Does not invent server fields.
 */
import {
  DEFAULT_PROFILE_BANNER,
  PROFILE_BANNER_IMAGES,
  type ProfileBanner,
  isProfileBanner,
} from "@shared/profileTheme";
import { BOARD_COLORS } from "@shared/profileConstants";
import type { MemberProfileData, ProfileEvent as WireEvent } from "@/pages/profile/types";
import type {
  ProfileBoardPost,
  ProfileEvent,
  PublicProfileData,
} from "./types";

export type GoingCountMap = Record<number | string, { count?: number } | number>;

/** Resolve profileTheme banner key to a display image path (null = accent gradient). */
export function resolveProfileBannerSrc(banner?: string | null): string | null {
  const key = isProfileBanner(banner) ? banner : DEFAULT_PROFILE_BANNER;
  if (key === "accent-gradient") return null;
  return PROFILE_BANNER_IMAGES[key as Exclude<ProfileBanner, "accent-gradient">] ?? null;
}

/** Map AccentPicker path (or null) back to a server-valid banner enum. */
export function bannerPathToThemeKey(path: string | null | undefined): ProfileBanner {
  if (!path) return "accent-gradient";
  for (const [key, img] of Object.entries(PROFILE_BANNER_IMAGES)) {
    if (img === path) return key as ProfileBanner;
  }
  // Legacy sticker/social paths already match theme images.
  if (path.includes("banner-stickers")) return "sticker-wall";
  if (path.includes("banner-social")) return "pride-guide-social";
  return "accent-gradient";
}

function goingCountFor(id: number, counts?: GoingCountMap): number | undefined {
  if (!counts) return undefined;
  const raw = counts[id] ?? counts[String(id)];
  if (raw == null) return undefined;
  if (typeof raw === "number") return raw;
  return typeof raw.count === "number" ? raw.count : undefined;
}

function mapEvent(e: WireEvent, counts?: GoingCountMap, isPast?: boolean): ProfileEvent {
  return {
    id: e.id,
    title: e.title,
    venueName: e.venueName ?? null,
    neighborhood: e.neighborhood ?? null,
    dayOfWeek: e.dayOfWeek ?? null,
    dateStart: e.dateStart ?? null,
    dateEnd: e.dateEnd ?? null,
    admission: e.admission ?? null,
    ticketUrl: e.ticketUrl ?? null,
    // posterImageUrl present after server SELECT patch
    posterImageUrl: e.posterImageUrl ?? null,
    goingCount: goingCountFor(e.id, counts),
    isPast,
  };
}

function contentTypeForBoard(board: string): ProfileBoardPost["contentType"] {
  const b = board.toLowerCase();
  if (b === "gigs") return "GIG";
  if (b === "gifting") return "GIFTING";
  if (b === "spotted") return "SPOTTED";
  if (b === "updates" || b === "hub") return "HUB";
  return undefined;
}

function isSpottedBoardPost(p: { board?: string; contentType?: string }): boolean {
  const type = String(p.contentType || "").toUpperCase();
  if (type === "SPOTTED") return true;
  const board = String(p.board || "").toLowerCase();
  return board === "spotted" || board === "missed connections";
}

function publicBoardName(board: string): string {
  const key = board.trim().toLowerCase();
  if (key === "gigs" || key === "gig board" || key === "gig werk") return "GIGZ";
  if (key === "gifting") return "GIFTZ";
  if (key === "spotted" || key === "missed connections") return "MIZZED CONNECTION";
  return board;
}

/** Prefer server boardPosts (with likes/replies); fall back to activity merge. */
export function boardPostsFromActivity(
  activity: MemberProfileData["activity"] | undefined,
  wirePosts?: MemberProfileData["boardPosts"],
): ProfileBoardPost[] {
  if (wirePosts?.length) {
    // Defense in depth: never surface missed connections on profiles.
    return wirePosts
      .filter(p => !isSpottedBoardPost(p))
      .map(p => ({
        id: p.id,
        board: publicBoardName(p.board),
        contentType: p.contentType || contentTypeForBoard(p.board),
        color: p.color || BOARD_COLORS[p.board as keyof typeof BOARD_COLORS] || "var(--neon-cyan)",
        where: p.where || "Portland",
        title: p.title ?? null,
        text: p.text,
        createdAt: p.createdAt ?? undefined,
        likes: typeof p.likes === "number" ? p.likes : 0,
        replies: typeof p.replies === "number" ? p.replies : 0,
      }));
  }

  if (!activity) return [];
  const posts: ProfileBoardPost[] = [];

  for (const g of activity.gigs ?? []) {
    posts.push({
      id: g.id,
      board: "GIGZ",
      contentType: "GIG",
      color: BOARD_COLORS.Gigs,
      where: g.venueText || "Portland",
      title: g.title ?? null,
      text: g.description || g.title,
      createdAt: g.createdAt ?? undefined,
      likes: g.likes ?? 0,
      replies: g.replies ?? 0,
    });
  }
  for (const g of activity.gifting ?? []) {
    posts.push({
      id: g.id,
      board: "GIFTZ",
      contentType: "GIFTING",
      color: BOARD_COLORS.Gifting,
      where: g.neighborhood || "Portland",
      title: g.title ?? null,
      text: g.description || g.title,
      createdAt: g.createdAt ?? undefined,
      likes: g.likes ?? 0,
      replies: g.replies ?? 0,
    });
  }
  // activity.spotted intentionally ignored - anonymity.

  posts.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });
  return posts;
}

export function normalizePublicProfile(
  api: MemberProfileData,
  opts?: { goingCounts?: GoingCountMap },
): PublicProfileData {
  const isPromoter = !!(api.verifiedHost || api.showPromoterVariant);
  const a = api.activity ?? {};
  const counts = opts?.goingCounts;
  const memberYear =
    api.memberSince && !Number.isNaN(Date.parse(api.memberSince))
      ? new Date(api.memberSince).getFullYear()
      : null;

  const hostingUpcoming = (a.hostedEvents ?? []).map(e => mapEvent(e, counts, false));
  const hostingPast = (a.hostedEventsPast ?? []).map(e => mapEvent(e, counts, true));
  const goingUpcoming = (a.goingTo ?? []).map(e => mapEvent(e, counts, false));
  const goingPast = (a.attendedPast ?? []).map(e => mapEvent(e, counts, true));

  return {
    username: api.username,
    displayName: api.displayName,
    pronouns: api.pronouns,
    location: api.location,
    bio: api.bio,
    photoUrl: api.photoUrl,
    avatarChoice: api.avatarChoice,
    avatarRing: api.avatarRing,
    memberSince: api.memberSince,
    verifiedHost: api.verifiedHost,
    isPromoter,
    isAdmin: !!api.isAdmin,
    isSiteOwner: !!api.isSiteOwner,
    roles: api.roles,
    accentColor: api.accentColor?.toUpperCase() === "#00EE44" ? "#39FF14" : (api.accentColor || "#FF00CC"),
    profileBanner: resolveProfileBannerSrc(api.banner),
    coverImageUrl: api.coverImageUrl ?? null,
    coverCrop: api.coverCrop ?? null,
    talents: api.talents,
    standFor: api.standFor,
    affiliatedVenues: api.affiliatedVenues,
    businessPlace: api.ownedBusiness
      ? {
          id: api.ownedBusiness.id,
          name: api.ownedBusiness.name,
          type: api.ownedBusiness.type,
          description: api.ownedBusiness.description,
          address: api.ownedBusiness.address,
          neighborhood: api.ownedBusiness.neighborhood,
          website: api.ownedBusiness.website,
          instagram: api.ownedBusiness.instagram,
          imageUrl: api.ownedBusiness.imageUrl,
          hours: api.ownedBusiness.hours,
          phone: api.ownedBusiness.phone,
        }
      : null,
    marquee: api.marquee ?? undefined,
    top8: Array.isArray(api.top8) ? api.top8 : [],
    media: api.media
      ? {
          title: api.media.title,
          tag: api.media.tag ?? undefined,
          meta: api.media.cadence ?? undefined,
          blurb: api.media.blurb ?? undefined,
          coverText: api.media.coverUrl ?? undefined,
          platformLinks: (api.media.platformLinks ?? []).map(l => ({
            label: l.label,
            dot: "var(--neon-cyan)",
            href: l.url,
          })),
          items: (api.media.items ?? []).map(it => ({
            id: String(it.id),
            label: it.label || "",
            title: it.title,
            meta: it.meta ?? undefined,
            audioUrl: it.isEmbed ? null : it.audioUrl,
            embedSrc: it.isEmbed ? it.audioUrl : null,
          })),
        }
      : null,
    socialLinks: api.socialLinks,
    boardPosts: boardPostsFromActivity(api.activity, api.boardPosts),
    pup: api.pup,
    packmates: api.packmates?.map(p => ({
      id: p.id,
      username: p.username,
      displayName: p.displayName,
      photoUrl: p.photoUrl,
      avatarChoice: p.avatarChoice,
      avatarRing: p.avatarRing,
    })),
    handlers: api.handlers?.map(p => ({
      id: p.id,
      username: p.username,
      displayName: p.displayName,
      photoUrl: p.photoUrl,
      avatarChoice: p.avatarChoice,
      avatarRing: p.avatarRing,
    })),
    events: {
      hosting: { upcoming: hostingUpcoming, past: hostingPast },
      going: { upcoming: goingUpcoming, past: goingPast },
    },
    stats: {
      followers: api.stats?.followers ?? 0,
      hosting: api.stats?.hosting ?? hostingUpcoming.length,
      shows: api.stats?.events ?? hostingUpcoming.length + hostingPast.length,
      // "Attended" in the design strip = past RSVPs (or check-ins as fallback)
      checkIns: api.stats?.checkIns ?? goingPast.length,
      going: api.stats?.going ?? goingUpcoming.length,
      events: api.stats?.events,
      gigs: api.stats?.gigs,
      gifting: api.stats?.gifting,
      estYear: memberYear,
    },
    ticketUrl: hostingUpcoming[0]?.ticketUrl ?? null,
    isOwner: api.isOwner,
    viewerIsAdmin: !!api.viewerIsAdmin,
    isFollowing: api.isFollowing,
    blockStatus: api.blockStatus,
    linkedVenues: api.linkedVenues,
  };
}

/** Headline hosted event: featured flag first, else soonest upcoming. */
export function pickTheBigOne(data: PublicProfileData): ProfileEvent | null {
  const upcoming = data.events?.hosting?.upcoming ?? [];
  if (!upcoming.length) return null;
  const featured = upcoming.find(e => e.featured);
  if (featured) return featured;
  return [...upcoming].sort((a, b) => {
    const ta = a.dateStart ? Date.parse(a.dateStart) : Number.POSITIVE_INFINITY;
    const tb = b.dateStart ? Date.parse(b.dateStart) : Number.POSITIVE_INFINITY;
    return ta - tb;
  })[0] ?? null;
}
