import { StickerBadge } from "@/components/ds/StickerBadge";
import "./RoleStickers.css";

/** Known site-admin usernames (matches SITE_ADMIN_GIG_OWNER_USERNAME on the server). */
const SITE_ADMIN_USERNAMES = new Set(["tucker_pdmax"]);

export type RoleStickersProps = {
  isPromoter?: boolean;
  /** Explicit admin flag when the public profile API provides it. */
  isAdmin?: boolean;
  username?: string;
  /** Talent/role labels; a role matching /admin/i counts as admin. */
  roles?: string[];
  className?: string;
};

/**
 * True when the profile should show an ADMIN sticker.
 * Public profile may not yet expose isAdmin; fall back to username allowlist + roles.
 */
export function isSiteAdminProfile(opts: {
  isAdmin?: boolean;
  username?: string;
  roles?: string[];
}): boolean {
  if (opts.isAdmin) return true;
  const handle = (opts.username || "").trim().toLowerCase();
  if (handle && SITE_ADMIN_USERNAMES.has(handle)) return true;
  if (opts.roles?.some(r => /admin/i.test(String(r)))) return true;
  return false;
}

/**
 * Role sticker badges next to the display name (PROMOTER lime, ADMIN cyan).
 * Only renders stickers the member earned. Brand sticker: Barlow Condensed,
 * black on neon, 2px black border, hard offset shadow, slight rotation.
 */
export default function RoleStickers({
  isPromoter,
  isAdmin,
  username,
  roles,
  className = "",
}: RoleStickersProps) {
  const showPromoter = !!isPromoter;
  const showAdmin = isSiteAdminProfile({ isAdmin, username, roles });
  if (!showPromoter && !showAdmin) return null;

  return (
    <span className={`pp-role-stickers${className ? ` ${className}` : ""}`}>
      {showPromoter && (
        <StickerBadge color="yellow" size="sm" rotate={-3} className="pp-role-sticker">
          PROMOTER
        </StickerBadge>
      )}
      {showAdmin && (
        <StickerBadge color="cyan" size="sm" rotate={2} className="pp-role-sticker">
          ADMIN
        </StickerBadge>
      )}
    </span>
  );
}
