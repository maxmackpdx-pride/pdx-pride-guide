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
  /** Ring shimmer (light-only). Default true when a ring is present. Never on ring=none. */
  shimmer?: boolean;
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
}: UserAvatarProps) {
  const emoji = AVATAR_EMOJI_OPTIONS.find(a => a.id === (avatarChoice || 1)) || AVATAR_EMOJI_OPTIONS[0];
  const initial = (displayName || username || "?").trim().slice(0, 1).toUpperCase();
  const ring = normalizeAvatarRing(avatarRing);
  const label = title || displayName || username || "Profile";
  const showShimmer = shimmer && ring !== "none";

  return (
    <div
      className={`user-avatar ${showShimmer ? "user-avatar--shimmer" : ""} ${className}`.trim()}
      data-ring={ring}
      style={size !== undefined ? ({ "--avatar-size": `${size}px` } as React.CSSProperties) : undefined}
      title={label}
      aria-label={label}
    >
      <div className="user-avatar__inner">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="user-avatar__photo" />
        ) : (
          <span
            className="user-avatar__fallback display"
            style={{ background: emoji.bg, color: emoji.bg === "#fff" ? "#000" : "#000" }}
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
    </div>
  );
}