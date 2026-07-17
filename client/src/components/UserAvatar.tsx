import type { CSSProperties, MouseEvent } from "react";
import { Link } from "wouter";
import { AVATAR_EMOJI_OPTIONS, normalizeAvatarRing } from "@shared/avatarRings";

export interface UserAvatarProps {
  photoUrl?: string | null;
  avatarChoice?: number;
  displayName?: string | null;
  username?: string;
  avatarRing?: string | null;
  size?: number;
  className?: string;
  title?: string;
  /** Glow shimmer (light-only sweep). Default true when a ring/glow is present. Never on ring=none. */
  shimmer?: boolean;
  /** Directory venue logo — contained with padding inside the circle. */
  logoFit?: boolean;
  /**
   * When set, avatar navigates here (member profile or directory place).
   * Use avatarHrefFor() / memberProfileHref() from @/lib/avatarLinks.
   */
  href?: string | null;
  /** Optional click hook (e.g. stop parent card expand). Fires for both link and plain. */
  onClick?: (e: MouseEvent) => void;
}

export default function UserAvatar({
  photoUrl,
  avatarChoice = 1,
  displayName,
  username,
  avatarRing,
  size,
  className = "",
  title,
  shimmer = true,
  logoFit = false,
  href,
  onClick,
}: UserAvatarProps) {
  const emoji = AVATAR_EMOJI_OPTIONS.find(a => a.id === (avatarChoice || 1)) || AVATAR_EMOJI_OPTIONS[0];
  const initial = (displayName || username || "?").trim().slice(0, 1).toUpperCase();
  const ring = normalizeAvatarRing(avatarRing);
  const label = title || displayName || username || "Profile";
  const showShimmer = shimmer && ring !== "none";
  const navHref = href?.trim() || null;

  const classNames = [
    "user-avatar",
    showShimmer ? "user-avatar--shimmer" : "",
    logoFit ? "user-avatar--logo" : "",
    navHref ? "user-avatar--link" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties | undefined =
    size !== undefined ? ({ "--avatar-size": `${size}px` } as CSSProperties) : undefined;

  const face = (
    <>
      <div className="user-avatar__inner">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="user-avatar__photo" />
        ) : emoji.img ? (
          <img src={emoji.img} alt="" className="user-avatar__photo" />
        ) : (
          <span
            className="user-avatar__fallback display"
            style={{ background: emoji.bg || "#00FFFF", color: "#000" }}
          >
            {initial}
          </span>
        )}
      </div>
      {showShimmer && (
        <span
          className={`user-avatar__shimmer${ring === "chain" ? " user-avatar__shimmer--chain" : ""}`}
          aria-hidden="true"
        />
      )}
      {ring === "chain" && <span className="user-avatar__padlock" aria-hidden="true">🔒</span>}
    </>
  );

  if (navHref) {
    return (
      <Link
        href={navHref}
        className={classNames}
        data-ring={ring}
        style={style}
        title={label}
        aria-label={label}
        onClick={onClick}
      >
        {face}
      </Link>
    );
  }

  return (
    <div
      className={classNames}
      data-ring={ring}
      style={style}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {face}
    </div>
  );
}
