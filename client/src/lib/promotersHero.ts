import type { PageHeroProps } from "@/components/PageHero";

export const promotersHeroContent = {
  kicker: "Portland Pride 2026 · Community submissions",
  titleLine1: "Promoters",
  lede: "Throwing something? Want the verified badge? Notice we missed one? Pick a door below.",
  tagline: "Submit it. Claim it. Keep Portland queer.",
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