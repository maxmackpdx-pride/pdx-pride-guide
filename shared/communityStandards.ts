/**
 * Community Standards + legal agreement copy.
 * Bump VERSION when the text changes so existing users are re-prompted.
 */

export const COMMUNITY_STANDARDS_VERSION = "2026-07-15";

/** Where users who decline are sent (Portland-area drug / public health support). */
export const COMMUNITY_STANDARDS_DECLINE_URL = "https://www.savelivesoregon.org/";

export type CommunityStandardsBlock = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export const COMMUNITY_STANDARDS_BLOCKS: CommunityStandardsBlock[] = [
  {
    heading: "Community Standards",
    paragraphs: [
      "Pride Guide PDX welcomes lawful, consensual kink, fetish, leather, pup, BDSM, and sex-positive communities. Activities may be discussed, shared, or listed where appropriate, provided they follow these Community Standards and all applicable laws.",
      "Pride Guide PDX is still new. I have to make sure the site follows the rules of the services that keep it running, and I also want it to be a place the whole community can enjoy.",
      "Adult content features are planned, but we are not there yet.",
    ],
  },
  {
    heading: "Prohibited Content",
    paragraphs: [
      "The following content may not be posted, promoted, or used to organize events:",
    ],
    bullets: [
      "Race play or hate-based roleplay",
      "Scat play",
      "Blood play",
      "Knife, gun, or weapon play",
      "Bestiality or animal sexual content",
      "Sexual content involving minors or anyone unable to legally consent",
      "Non-consensual, coercive, or exploitative content",
      "Illegal activities or the promotion or solicitation of illegal activities",
    ],
  },
  {
    heading: "Profile Photos and Adult Content",
    paragraphs: [
      "Pride Guide PDX is sex-positive, but it is not currently built to host explicit profile content.",
      "For now, profile photos and other publicly visible account images cannot include exposed genitals, bare asses, or other explicit sexual content.",
      "You are welcome to link your adult platforms from your profile, as long as the link is lawful and clearly belongs to you. The explicit content just needs to stay on that platform for now.",
      "NSFW profiles and adult content features are coming later. Until the proper controls are built, explicit profile images are not allowed.",
    ],
  },
  {
    heading: "No Bullying or Cyber Mobbing",
    paragraphs: [
      "Bullying, harassment, threats, dogpiling, and coordinated attacks are not allowed.",
      "You are allowed to disagree with someone. You are allowed to tell your friends what happened. You are allowed to share your experience and hold people accountable.",
      "What you are not allowed to do is use Pride Guide PDX to send a mob after someone, encourage mass harassment, or turn a conflict into public humiliation.",
      "There are better ways to educate people, address harm, and protect the community than having 100 people terrorize one person online.",
      "If someone's behavior is serious enough that you believe they should be removed, report it. I can review what happened, remove content, suspend an account, or have a direct human conversation about it.",
      "Accountability is welcome. Cyber mobs are not.",
    ],
  },
  {
    heading: "Moderation",
    paragraphs: [
      "I reserve the right to remove content or suspend accounts that fall outside the intended purpose of Pride Guide PDX or present a safety, legal, platform, or community concern, even when the content is not specifically listed above.",
      "This is a community-monitored platform, but it is currently built and operated by one person. I do my best to make fair and consistent decisions, but I am human and I may occasionally get something wrong.",
      "If you believe something was removed in error, you are welcome to request a review.",
      "That said, posting risky or borderline content comes with the possibility that it may be removed. Even if I later decide I made the wrong call, the original content may not be recoverable. You may get an apology and clarification, but I cannot guarantee the post will be restored.",
    ],
  },
];

/** Compact terms/privacy bullets shown with the Community Standards agreement. */
export const LEGAL_SUMMARY_BLOCKS: CommunityStandardsBlock[] = [
  {
    heading: "Terms of use",
    bullets: [
      "PDX Pride Guide is a free community directory for Portland Pride Week and related queer events.",
      "Listings are submitted by promoters and community members; accuracy is not guaranteed. Verify details with official venues and organizers.",
      "Do not use this site to harass, spam, scrape personal data, or post misleading or harmful content.",
      "We may remove listings or accounts that violate community standards or applicable law.",
    ],
  },
  {
    heading: "Privacy",
    bullets: [
      "We do not sell your personal data.",
      "Account info (email, username, profile fields) is used to run the site: submissions, messaging, RSVPs, and moderation.",
      "Messages and inbox threads are private between participants; hosts and admins only see what the product surfaces for support or review.",
      "Optional Google sign-in shares your verified email and basic profile with us for authentication only.",
      "Use the contact form for privacy questions or removal requests.",
    ],
  },
];

export function userHasCurrentCommunityStandards(
  user: {
    communityStandardsVersion?: string | null;
    communityStandardsAgreedAt?: string | null;
  } | null | undefined,
): boolean {
  if (!user?.communityStandardsAgreedAt) return false;
  return user.communityStandardsVersion === COMMUNITY_STANDARDS_VERSION;
}

export const GUEST_STANDARDS_STORAGE_KEY = "pdxpg_community_standards_v";
