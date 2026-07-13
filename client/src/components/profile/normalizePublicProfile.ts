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
  // profileConstants short paths (collage/stickers/social) already match theme images
  if (path.includes("hero-collage")) return "neon-collage";
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

/** Build Updates / board posts from activity gigs, gifting, and spotted. */
export function boardPostsFromActivity(
  activity: MemberProfileData["activity"] | undefined,
): ProfileBoardPost[] {
  if (!activity) return [];
  const posts: ProfileBoardPost[] = [];

  for (const g of activity.gigs ?? []) {
    posts.push({
      id: g.id,
      board: "Gigs",
      color: BOARD_COLORS.Gigs,
      where: g.venueText || "Portland",
      text: g.description || g.title,
      createdAt: g.createdAt ?? undefined,
    });
  }
  for (const g of activity.gifting ?? []) {
    posts.push({
      id: g.id,
      board: "Gifting",
      color: BOARD_COLORS.Gifting,
      where: g.neighborhood || "Portland",
      text: g.description || g.title,
      createdAt: g.createdAt ?? undefined,
    });
  }
  for (const s of activity.spotted ?? []) {
    posts.push({
      id: s.id,
      board: "Spotted",
      color: BOARD_COLORS.Spotted,
      where: s.venueHint || s.dayOfWeek || "Portland",
      text: s.body || s.title,
      createdAt: s.createdAt ?? undefined,
    });
  }

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
    roles: api.roles,
    accentColor: api.accentColor || "#FF00CC",
    profileBanner: resolveProfileBannerSrc(api.banner),
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
    boardPosts: boardPostsFromActivity(api.activity),
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
    isFollowing: api.isFollowing,
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
