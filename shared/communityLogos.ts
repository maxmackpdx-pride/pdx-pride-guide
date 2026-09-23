import type { CommunitySummary } from "./community";

// Artwork is sourced from the named organizations' own sites. Keep this list
// explicit so a Placez name fallback cannot masquerade as a verified logo.
const COMMUNITY_LOGOS: Record<string, string> = {
  "bad-girls-pdx": "/community-logos/bad-girls-pdx.webp", // pdxbadgirls.net
  "bearracuda": "/directory-logos/Bearracuda.png", // bearracuda.com
  "black-and-beyond-the-binary-collective": "/community-logos/black-and-beyond-the-binary-collective.webp", // blackbeyondthebinarycollective.org
  "brown-girl-rise": "/community-logos/brown-girl-rise.webp", // browngirlriseportland.org
  "fertile-ground-festival": "/community-logos/fertile-ground-festival.webp", // fertilegroundpdx.org
  "lavender-league": "/community-logos/lavender-league.webp", // lavenderleaguepdx.org
  "lesbian-culture-club": "/directory-logos/place-lesbiancultureclub.svg", // lesbiancultureclub.com
  "oregon-pride-in-business": "/community-logos/oregon-pride-in-business.webp", // orpib.com
  "oregon-state-leather-contest": "/community-logos/oregon-state-leather-contest.webp", // oslcontest.org
  "pdx-gaymers": "/community-logos/pdx-gaymers.webp", // pdxgaymers.org
  "pdx-pah-portland-pets-and-handlers": "/community-logos/pdx-pah-portland-pets-and-handlers.webp", // pdxpah.com
  "pink-ponies": "/community-logos/pink-ponies.jpeg",
  "portland-area-theatre-alliance": "/directory-logos/place-portlandareatheatrealliance.png", // portlandtheatre.com
  "portland-frontrunners": "/community-logos/portland-frontrunners.webp", // pdxfrontrunners.com
  "portland-leather-alliance": "/community-logos/portland-leather-alliance.webp", // portlandleather.org
  "queer-social-club": "/directory-logos/place-queersocialclub.png",
  "radical-faerie-arts-fest": "/directory-logos/place-radicalfaerieartsfest.png",
  "the-imperial-sovereign-rose-court-of-oregon": "/community-logos/the-imperial-sovereign-rose-court-of-oregon.webp", // rosecourt.org
  "yes-coach-productions": "/directory-logos/Yes_Coach_Productions.png",
};

export function communityLogo(community: Pick<CommunitySummary, "slug" | "imageUrl">): string | null {
  // A community moderator's chosen image takes precedence over curated art.
  // The seeded Placez image is still the yellow version of the Pink Ponies mark.
  if (community.slug === "pink-ponies" && community.imageUrl === "/directory-logos/Pink_Ponies.png") {
    return COMMUNITY_LOGOS[community.slug];
  }
  return community.imageUrl || COMMUNITY_LOGOS[community.slug] || null;
}
