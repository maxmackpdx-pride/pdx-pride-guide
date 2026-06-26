import UserAvatar from "@/components/UserAvatar";
import { attendanceBubbleGradient, attendanceInitials } from "@/lib/attendanceBubble";

type AttendanceBubbleFaceProps = {
  handle: string;
  displayName?: string | null;
  username?: string;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
  avatarSeed?: string;
  masked?: boolean;
  size: number;
  className?: string;
};

/** Face inside an attendance bubble — pride ring follows the user when not masked. */
export default function AttendanceBubbleFace({
  handle,
  displayName,
  username,
  photoUrl,
  avatarChoice,
  avatarRing,
  avatarSeed,
  masked = false,
  size,
  className = "",
}: AttendanceBubbleFaceProps) {
  if (!masked) {
    return (
      <UserAvatar
        photoUrl={photoUrl}
        avatarChoice={avatarChoice}
        avatarRing={avatarRing}
        displayName={displayName}
        username={username || handle}
        size={size}
        className={`attendance-bubble-face${className ? ` ${className}` : ""}`}
      />
    );
  }

  const seed = avatarSeed || handle;
  return (
    <span
      className={`attendance-bubble-face attendance-bubble-face--masked${className ? ` ${className}` : ""}`}
      style={{
        width: size,
        height: size,
        background: attendanceBubbleGradient(seed),
        fontSize: size * 0.34,
      }}
      aria-hidden="true"
    >
      {attendanceInitials(handle)}
    </span>
  );
}