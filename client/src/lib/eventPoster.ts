export function isMissingEventFlyer(url: string | null | undefined) {
  if (!url || !url.trim()) return true;
  return url.includes("/placeholders/");
}

export function eventPosterSrc(url: string | null | undefined) {
  if (!url || !url.trim()) return null;
  return url;
}