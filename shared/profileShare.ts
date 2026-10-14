/** Versioned public social-card path shared by client metadata and server crawlers. */
export const PROFILE_SHARE_IMAGE_VERSION = '3';
export function profileShareImagePath(username: string): string {
  return `/api/og/profile/${encodeURIComponent(username.trim().replace(/^@/, ''))}?v=${PROFILE_SHARE_IMAGE_VERSION}`;
}
