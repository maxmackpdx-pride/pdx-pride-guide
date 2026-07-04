import type { PageHeroProps } from "@/components/PageHero";

export const giftingHeroContent = {
  kicker: "Pride season only · Now through July 26",
  titleLine1: "Gifting",
  lede: "A queer Portland free board for Pride-season closet chaos, event supplies, outfit saves, furniture, gear, tickets, décor, and whatever else needs a new home.",
  tagline: "Give gay gifts. Queer homes. Keep it moving.",
  taglineAccent: "magenta",
  bgImage: "/motifs/hero-gifting.jpg",
  bgPosition: "center 42%",
} as const satisfies Partial<PageHeroProps>;

export function giftingHeroProps(overrides: Partial<PageHeroProps> = {}): PageHeroProps {
  return {
    flush: true,
    compact: true,
    overlayPreset: false,
    ...giftingHeroContent,
    ...overrides,
  } as PageHeroProps;
}