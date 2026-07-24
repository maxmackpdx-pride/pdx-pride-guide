import { StickerBadge } from "@/components/ds/StickerBadge";
import "./RoleStickers.css";

export type RoleStickersProps = {
  isPromoter?: boolean;
  /** From GET /api/users/:username isAdmin (env admins, grants, subAdmin). */
  isAdmin?: boolean;
  /** Primary site owner (Tucker) - shows OWNER instead of ADMIN. */
  isSiteOwner?: boolean;
  className?: string;
};

/**
 * Role sticker badges next to the display name (PROMOTER yellow, OWNER/ADMIN cyan).
 * Only renders stickers the member earned. Driven by live API flags only.
 */
export default function RoleStickers({
  isPromoter,
  isAdmin,
  isSiteOwner,
  className = "",
}: RoleStickersProps) {
  const showPromoter = !!isPromoter;
  const showOwner = !!isSiteOwner;
  const showAdmin = !!isAdmin && !showOwner;
  if (!showPromoter && !showOwner && !showAdmin) return null;

  return (
    <span className={`pp-role-stickers${className ? ` ${className}` : ""}`}>
      {showPromoter && (
        <StickerBadge color="yellow" size="sm" rotate={-3} className="pp-role-sticker">
          PROMOTER
        </StickerBadge>
      )}
      {showOwner && (
        <StickerBadge color="cyan" size="sm" rotate={2} className="pp-role-sticker">
          OWNER
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
