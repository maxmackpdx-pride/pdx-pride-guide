import type { PageHeroProps } from "@/components/PageHero";

export const spottedHeroContent = {
  kicker: "Missed connections · Pride weekend",
  titleLine1: "SPOTTED!",
  titleLine1Accent: "magenta",
  lede: "The missed connections board for Pride weekend. Post who you spotted, where you saw them, and what you remember. Replies never show on the board — they open a private inbox thread.",
  tagline: "Not sure what missed connections are? Grab your nearest daddy.",
  taglineAccent: "magenta",
  bgImage: "/motifs/hero-spotted-bigfoot.jpg",
  bgPosition: "center 42%",
} as const satisfies Partial<PageHeroProps>;

export function spottedHeroProps(overrides: Partial<PageHeroProps> = {}): PageHeroProps {
  return {
    flush: true,
    ...spottedHeroContent,
    ...overrides,
  } as PageHeroProps;
}