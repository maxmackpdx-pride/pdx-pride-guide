import UserAvatar from "@/components/UserAvatar";

export type AdminUserProfile = {
  id?: number;
  username?: string;
  displayName?: string | null;
  email?: string;
  photoUrl?: string | null;
  avatarChoice?: number;
  avatarRing?: string | null;
};

type Props = {
  profile?: AdminUserProfile | null;
  showEmail?: boolean;
  size?: number;
  className?: string;
};

export default function AdminUserIdentity({
  profile,
  showEmail = false,
  size = 40,
  className = "",
}: Props) {
  if (!profile?.username && !profile?.email && !profile?.displayName) return null;

  const label = profile.displayName || profile.username || profile.email || "User";
  const hasBoth = !!(profile.displayName && profile.username);

  return (
    <div className={`flex items-center gap-3 min-w-0 w-full ${className}`.trim()}>
      <UserAvatar
        photoUrl={profile.photoUrl}
        avatarChoice={profile.avatarChoice}
        avatarRing={profile.avatarRing}
        displayName={profile.displayName}
        username={profile.username}
        size={size}
      />
      {/* min-w-0 + flex-1 so names aren't crushed by sibling action buttons on mobile */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {hasBoth ? (
          <>
            <p className="text-white text-sm font-semibold leading-tight break-words">
              {profile.displayName}
            </p>
            <p className="text-white/70 text-xs mt-0.5 leading-tight break-all">
              @{profile.username}
            </p>
          </>
        ) : (
          <p className="text-white text-sm font-medium leading-tight break-words">
            {profile.username ? `@${profile.username}` : label}
          </p>
        )}
        {showEmail && profile.email && (
          <p className="text-white/40 text-xs mt-0.5 break-all">{profile.email}</p>
        )}
      </div>
    </div>
  );
}