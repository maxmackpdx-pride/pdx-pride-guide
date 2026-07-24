import type { PageHeroProps } from "@/components/PageHero";

export const promotersHeroContent = {
  kicker: "Portland Pride 2026 · Community submissions",
  titleLine1: "Promoter hub",
  lede: "Got an event? Want to be a verified promoter? Spotted something we are missing? Pick your path below.",
  tagline: "Submit it. Claim it. Keep the nights ours.",
  taglineAccent: "lime",
  bgImage: "/motifs/hero-promoters.jpg",
  bgPosition: "center 42%",
} as const satisfies Partial<PageHeroProps>;

export function promotersHeroProps(overrides: Partial<PageHeroProps> = {}): PageHeroProps {
  return {
    flush: true,
    compact: true,
    overlayPreset: false,
    ...promotersHeroContent,
    ...overrides,
  } as PageHeroProps;
}
