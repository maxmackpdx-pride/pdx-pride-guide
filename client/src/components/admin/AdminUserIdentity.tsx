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

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`.trim()}>
      <UserAvatar
        photoUrl={profile.photoUrl}
        avatarChoice={profile.avatarChoice}
        avatarRing={profile.avatarRing}
        displayName={profile.displayName}
        username={profile.username}
        size={size}
      />
      <div className="min-w-0">
        <p className="text-white text-sm font-medium truncate">
          {profile.username ? `@${profile.username}` : label}
          {profile.displayName && profile.username ? ` · ${profile.displayName}` : ""}
        </p>
        {showEmail && profile.email && (
          <p className="text-white/40 text-xs mt-0.5 truncate break-all">{profile.email}</p>
        )}
      </div>
    </div>
  );
}