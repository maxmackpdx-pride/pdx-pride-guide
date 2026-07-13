/**
 * Resolve where a face/avatar should navigate.
 * Members → /u/:username. Directory venues → /directory?place=id (or ?q= name).
 * Anonymous / missing identity → null (not clickable).
 */

export function memberProfileHref(username?: string | null): string | null {
  const handle = String(username || "").trim().replace(/^@/, "");
  if (!handle) return null;
  return `/u/${encodeURIComponent(handle)}`;
}

export function directoryPlaceHref(opts: {
  businessId?: number | null;
  name?: string | null;
}): string | null {
  const id = opts.businessId;
  if (id != null && Number.isFinite(Number(id)) && Number(id) > 0) {
    return `/directory?place=${Number(id)}`;
  }
  const name = String(opts.name || "").trim();
  if (name) return `/directory?q=${encodeURIComponent(name)}`;
  return null;
}

export type AvatarLinkTarget = {
  username?: string | null;
  anonymous?: boolean | null;
  venueLogo?: boolean | null;
  businessId?: number | null;
  displayName?: string | null;
};

/** Prefer member profile; venues (logo avatars) go to the directory entry. */
export function avatarHrefFor(target: AvatarLinkTarget | null | undefined): string | null {
  if (!target || target.anonymous) return null;
  if (target.venueLogo) {
    return directoryPlaceHref({
      businessId: target.businessId,
      name: target.displayName,
    });
  }
  return memberProfileHref(target.username);
}
