export type ProfileEvent = {
  id: number;
  title: string;
  venueName?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  dayOfWeek?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  admission?: string | null;
  ageRequirement?: string | null;
  ticketUrl?: string | null;
  posterImageUrl?: string | null;
  eventTypes?: string[];
  goingCount?: number;
  isPast?: boolean;
  /** Optional featured flag when the API starts returning one. */
  featured?: boolean;
};

export type ProfileBoardPost = {
  id: number;
  board: string;
  color: string;
  where: string;
  title?: string | null;
  text: string;
  createdAt?: string;
  /** Like target type for POST /api/content/:type/:id/like */
  contentType?: "GIG" | "GIFTING" | "SPOTTED" | "HUB" | string;
  likes?: number;
  replies?: number;
};

export type ProfileMediaItem = {
  id: string;
  label: string;
  title: string;
  meta?: string;
  audioUrl?: string | null;
  embedSrc?: string | null;
  latest?: boolean;
};

export type ProfileMedia = {
  kicker?: string;
  tag?: string;
  meta?: string;
  title: string;
  coverText?: string;
  blurb?: string;
  platformLinks?: Array<{ label: string; dot: string; href: string }>;
  items: ProfileMediaItem[];
};

export type ProfileUserChip = {
  id: number;
  username: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
};

export type ProfileVenue = {
  id: number;
  name: string;
  type?: string | null;
  address?: string | null;
};

export type ProfileBusiness = ProfileVenue & {
  description?: string;
  neighborhood?: string | null;
  website?: string | null;
  instagram?: string | null;
  imageUrl?: string | null;
  queerOwned?: boolean;
  queerFriendly?: boolean;
  hours?: string | null;
  phone?: string | null;
};

export type ProfileMarquee = {
  items: string[];
  speed: number;
  color: string;
};

export type ProfilePup = {
  name: string;
  hood: string;
  role: string;
  lookingFor: string;
};

export type ProfileTop8Entry =
  | { kind: "user"; id: number; username: string; displayName: string; photoUrl: string | null; avatarChoice?: number; avatarRing?: string | null }
  | { kind: "place"; id: number; name: string; logoUrl: string | null };

export type PublicProfileData = {
  username: string;
  displayName: string | null;
  pronouns?: string | null;
  location?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  memberSince?: string | null;
  verifiedHost?: boolean;
  isPromoter?: boolean;
  /**
   * Site admin on the public profile. May be absent until the API exposes it;
   * Role stickers also use isSiteOwner for the primary owner badge.
   */
  isAdmin?: boolean;
  /** Primary site owner - OWNER sticker instead of ADMIN. */
  isSiteOwner?: boolean;
  roles?: string[];
  accentColor?: string;
  profileBanner?: string | null;
  coverImageUrl?: string | null;
  coverCrop?: string | null;
  talents?: string[];
  standFor?: string[];
  affiliatedVenues?: ProfileVenue[];
  businessPlace?: ProfileBusiness | null;
  marquee?: ProfileMarquee;
  top8?: ProfileTop8Entry[];
  media?: ProfileMedia | null;
  socialLinks?: Record<string, string> | string | null;
  boardPosts?: ProfileBoardPost[];
  pup?: ProfilePup | null;
  packmates?: ProfileUserChip[];
  handlers?: ProfileUserChip[];
  events?: {
    hosting?: { upcoming: ProfileEvent[]; past: ProfileEvent[] };
    going?: { upcoming: ProfileEvent[]; past: ProfileEvent[] };
  };
  stats?: {
    followers?: number;
    hosting?: number;
    shows?: number | string;
    estYear?: number | null;
    going?: number;
    checkIns?: number;
    saved?: number;
    events?: number;
    gigs?: number;
    gifting?: number;
  };
  ticketUrl?: string | null;
  isOwner?: boolean;
  /** True when the signed-in viewer is a site admin viewing someone else's profile. */
  viewerIsAdmin?: boolean;
  isFollowing?: boolean;
  linkedVenues?: ProfileVenue[];
};

export type ProfileTabId = "events" | "media" | "board" | "about";