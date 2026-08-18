import type { PageHeroProps } from "@/components/PageHero";

export const gigsHeroContent = {
  kicker: "Pride season & beyond",
  titleLine1: "GIGZ",
  lede: "Two-way board for Pride season and beyond. Post your availability, post a gig, or browse both. Workers and hosts in one place.",
  tagline: "Need work? Need help? Both belong here.",
  taglineAccent: "cyan",
  bgImage: "/motifs/hero-gigs.jpg",
  bgPosition: "center 42%",
} as const satisfies Partial<PageHeroProps>;

export function gigsHeroProps(overrides: Partial<PageHeroProps> = {}): PageHeroProps {
  return {
    flush: true,
    compact: true,
    overlayPreset: false,
    ...gigsHeroContent,
    ...overrides,
  } as PageHeroProps;
}