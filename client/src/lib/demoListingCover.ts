const COVERS: Array<{ test: RegExp; src: string }> = [
  { test: /moving box/i, src: "/hausing/demo/gift-boxes.jpg" },
  { test: /pride flag|bunting/i, src: "/hausing/demo/gift-flags.jpg" },
  { test: /mini fridge|minifridge/i, src: "/hausing/demo/gift-fridge.jpg" },
  { test: /trivia/i, src: "/home/flyers/certified-freak-block-party.jpg" },
  { test: /photographer|afterparty/i, src: "/home/flyers/certified-freak-block-party.jpg" },
  { test: /barback|weekend shift/i, src: "/hausing/demo/looking-bg.jpg" },
];

export function demoListingCover(title?: string | null, photoUrl?: string | null): string | null {
  if (photoUrl) return photoUrl;
  const text = String(title || "");
  return COVERS.find((row) => row.test.test(text))?.src ?? null;
}
