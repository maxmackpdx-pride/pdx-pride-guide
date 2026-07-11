import type { PageHeroProps } from "@/components/PageHero";

export const spottedHeroContent = {
  kicker: "Anonymous board · Pride season 2026",
  titleLine1: "Missed a connection?",
  titleLine1Accent: "magenta",
  lede: "Missed connections from Portland Pride. Caught a glance across the dance floor, shared a moment at the parade, or clocked someone cute around town? Post it. You stay anonymous. Replies open a private thread.",
  tagline: "Stay kind · stay anonymous · reveal when ready",
  taglineAccent: "magenta",
  bgImage: "/motifs/hero-spotted.jpg",
  bgPosition: "center 42%",
} as const satisfies Partial<PageHeroProps>;

export function spottedHeroProps(overrides: Partial<PageHeroProps> = {}): PageHeroProps {
  return {
    flush: true,
    ...spottedHeroContent,
    ...overrides,
  } as PageHeroProps;
}