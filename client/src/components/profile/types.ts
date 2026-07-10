export type ProfileEvent = {
  id: number;
  title: string;
  venueName?: string | null;
  dayOfWeek?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  admission?: string | null;
  ticketUrl?: string | null;
  posterImageUrl?: string | null;
  eventTypes?: string[];
  goingCount?: number;
};

export type ProfileBoardPost = {
  id: number;
  board: "spotted" | "gifting" | "gigs";
  title: string;
  body: string;
  location?: string | null;
  when?: string | null;
  href?: string;
};

export type ProfileEmbed = { id: string; src: string; title: string };

export type ProfilePackUser = {
  id: number;
  username: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
};

export type ProfileBusiness = {
  id: number;
  name: string;
  type?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  logoUrl?: string | null;
};

export type ProfileMarquee = {
  items: string[];
  speed?: number;
  color?: string;
};

export type ProfileMediaItem = {
  id: string;
  label: string;
  title: string;
  meta?: string;
  audioUrl?: string;
};

export type ProfileMedia = {
  title: string;
  tag: string;
  coverText?: string;
  blurb?: string;
  platformLinks?: Partial<Record<"spotify" | "apple" | "amazon" | "soundcloud", string>>;
  items: ProfileMediaItem[];
};

export type ProfilePup = {
  name: string;
  hood?: string;
  role?: string;
  lookingFor?: string;
};

export type PublicProfile = {
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
  isPromoter?: boolean;
  roles?: string[];
  socialLinks?: Record<string, string>;
  profileEmbeds?: ProfileEmbed[];
  profilePhotos?: unknown[];
  accentColor?: string | null;
  profileBanner?: string | null;
  talents?: string[];
  standFor?: string[];
  marquee?: ProfileMarquee | null;
  profileMedia?: ProfileMedia | null;
  businessPlace?: ProfileBusiness | null;
  linkedVenues?: ProfileBusiness[];
  pup?: ProfilePup | null;
  packmates?: ProfilePackUser[];
  handlers?: ProfilePackUser[];
  stats?: {
    events?: number;
    hosting?: number;
    shows?: number;
    estYear?: number | null;
    gigs?: number;
    gifting?: number;
    going?: number;
    checkIns?: number;
    followers?: number;
  };
  isOwner?: boolean;
  isFollowing?: boolean;
  activity?: {
    hostedEvents?: ProfileEvent[];
    hostingUpcoming?: ProfileEvent[];
    hostingPast?: ProfileEvent[];
    goingTo?: ProfileEvent[];
    attendedPast?: ProfileEvent[];
    gigs?: unknown[];
    gifting?: unknown[];
  };
  boardPosts?: ProfileBoardPost[];
};

export type ProfileTabId = "events" | "media" | "board" | "about";
