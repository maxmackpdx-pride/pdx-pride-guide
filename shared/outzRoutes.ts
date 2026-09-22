/** Preserve destination, query and fragment when opening an old public Outzide link. */
export function legacyOutzRedirect(path: string): string | null {
  return /^\/outz(?=\/|\?|#|$)/i.test(path)
    ? path.replace(/^\/outz/i, "/outzide")
    : null;
}
