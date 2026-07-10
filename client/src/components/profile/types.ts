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
  ticketUrl?: string | null;
  posterImageUrl?: string | null;
  eventTypes?: string[];
  goingCount?: number;
  isPast?: boolean;
};

export type ProfileBoardPost = {
  id: number;
  board: string;
  color: string;
  where: string;
  text: string;
  createdAt?: string;
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
  roles?: string[];
  accentColor?: string;
  profileBanner?: string | null;
  talents?: string[];
  standFor?: string[];
  affiliatedVenues?: ProfileVenue[];
  businessPlace?: ProfileBusiness | null;
  marquee?: ProfileMarquee;
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
  isFollowing?: boolean;
  linkedVenues?: ProfileVenue[];
};

export type ProfileTabId = "events" | "media" | "board" | "about";