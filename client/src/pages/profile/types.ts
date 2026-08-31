/* Contract types for GET /api/users/:username (server/storage.ts:getPublicProfile). */

export type ProfileEvent = {
  id: number;
  title: string;
  venueName?: string | null;
  neighborhood?: string | null;
  dayOfWeek?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  admission?: string | null;
  ticketUrl?: string | null;
  posterImageUrl?: string | null;
};

export type ProfileGig = {
  id: number;
  title: string;
  venueText?: string | null;
  compensation?: string | null;
  status?: string | null;
  createdAt?: string | null;
  description?: string | null;
  likes?: number;
  replies?: number;
};

export type ProfileGifting = {
  id: number;
  title: string;
  neighborhood?: string | null;
  createdAt?: string | null;
  description?: string | null;
  likes?: number;
  replies?: number;
};

export type ProfileSpotted = {
  id: number;
  title: string;
  body: string;
  dayOfWeek?: string | null;
  venueHint?: string | null;
  createdAt?: string | null;
  likes?: number;
  replies?: number;
};

/** Public profile Updates / board cards with engagement counts. */
export type ProfileBoardPostWire = {
  id: number;
  board: string;
  contentType?: "GIG" | "GIFTING" | "SPOTTED" | "HUB" | string;
  color?: string;
  where?: string;
  title?: string | null;
  text: string;
  createdAt?: string | null;
  likes?: number;
  replies?: number;
};

export type ProfileVenue = {
  id: number;
  name: string;
  type?: string | null;
  address?: string | null;
};

export type ProfileEmbed = { id: string; src: string; title: string };
export type ProfilePhoto = { url: string; caption?: string };

export type PackLinkUser = {
  id: number;
  username: string;
  displayName: string | null;
  avatarChoice: number;
  avatarRing: string;
  photoUrl: string | null;
};

export type ProfileMediaItem = {
  id: number | string;
  label: string | null;
  title: string;
  meta: string | null;
  audioUrl: string;
  isEmbed: boolean;
};

export type ProfileMediaData = {
  kind: "podcast" | "playlist";
  title: string;
  tag: string | null;
  cadence: string | null;
  blurb: string | null;
  coverUrl: string | null;
  platformLinks: { label: string; url: string }[];
  items: ProfileMediaItem[];
};

export type ProfileMarquee = { items: string[]; speed: number; color: string };

export type ProfileTop8Entry =
  | { kind: "user"; id: number; username: string; displayName: string; photoUrl: string | null; avatarChoice?: number; avatarRing?: string | null }
  | { kind: "place"; id: number; name: string; logoUrl: string | null };
export type ProfilePup = { name: string; hood: string; role: string; lookingFor: string };

export type OwnedBusiness = {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string | null;
  neighborhood: string | null;
  website: string | null;
  instagram: string | null;
  donateUrl: string | null;
  hours: string | null;
  phone: string | null;
  imageUrl: string | null;
};

export type MemberProfileData = {
  username: string;
  displayName: string | null;
  pronouns?: string | null;
  location?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  avatarCrop?: string | null;
  memberSince?: string | null;
  verifiedHost?: boolean;
  showPromoterVariant?: boolean;
  roles?: string[];
  talents?: string[];
  standFor?: string[];
  affiliatedVenues?: ProfileVenue[];
  ownedBusiness?: OwnedBusiness | null;
  accentColor?: string | null;
  banner?: "accent-gradient" | "sticker-wall" | "pride-guide-social";
  coverImageUrl?: string | null;
  coverCrop?: string | null;
  marquee?: ProfileMarquee | null;
  top8?: ProfileTop8Entry[];
  pup?: ProfilePup | null;
  packmates?: PackLinkUser[];
  handlers?: PackLinkUser[];
  media?: ProfileMediaData | null;
  socialLinks?: Record<string, string> | string | null;
  profileEmbeds?: ProfileEmbed[];
  profilePhotos?: ProfilePhoto[];
  stats?: { events: number; hosting: number; going: number; posts: number; gigs: number; gifting: number; checkIns: number; followers: number };
  isOwner?: boolean;
  /** Site admin (env list, site_admin_grants, or subAdmin). */
  isAdmin?: boolean;
  /** Primary site owner - OWNER sticker instead of ADMIN. */
  isSiteOwner?: boolean;
  /** True when the signed-in viewer is a site admin viewing someone else's profile. */
  viewerIsAdmin?: boolean;
  isFollowing?: boolean;
  blockStatus?: { blockedByViewer: boolean; blockedViewer: boolean; interactionBlocked: boolean };
  activity?: {
    hostedEvents?: ProfileEvent[];
    hostedEventsPast?: ProfileEvent[];
    gigs?: ProfileGig[];
    gifting?: ProfileGifting[];
    spotted?: ProfileSpotted[];
    goingTo?: ProfileEvent[];
    attendedPast?: ProfileEvent[];
  };
  /** Updates rail posts with live likes / replies when present. */
  boardPosts?: ProfileBoardPostWire[];
  linkedVenues?: ProfileVenue[];
};

export type ProfileTabKey = "events" | "media" | "board" | "about";
