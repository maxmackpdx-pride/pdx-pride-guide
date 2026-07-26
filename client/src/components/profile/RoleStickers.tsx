import { Badge } from "@/components/ds/Badge";
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
 * Role tags next to the display name (PROMOTER yellow, OWNER/ADMIN cyan).
 * Uses Badge (not StickerBadge) - stickers are for slogans only.
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
    <span className={`pp-role-tags${className ? ` ${className}` : ""}`}>
      {showPromoter && (
        <Badge variant="outline" size="sm" color="yellow" className="pp-role-tag">
          PROMOTER
        </Badge>
      )}
      {showOwner && (
        <Badge variant="outline" size="sm" color="cyan" className="pp-role-tag">
          OWNER
        </Badge>
      )}
      {showAdmin && (
        <Badge variant="outline" size="sm" color="cyan" className="pp-role-tag">
          ADMIN
        </Badge>
      )}
    </span>
  );
}
