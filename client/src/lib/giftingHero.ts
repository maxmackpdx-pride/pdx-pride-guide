import type { PageHeroProps } from "@/components/PageHero";

export const giftingHeroContent = {
  kicker: "Free board · Pride season 2026",
  titleLine1: "Gift with Pride",
  lede: "A free board for closet chaos, event supplies, outfit saves, furniture, gear, tickets, and whatever else needs a new home. Give what you can. Ask for what you need.",
  tagline: "Keep it free · keep it kind · keep it moving",
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
