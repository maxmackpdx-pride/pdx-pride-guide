import UserAvatar from "@/components/UserAvatar";
import IdentityPeek from "@/components/IdentityPeek";
import { memberProfileHref } from "@/lib/avatarLinks";
import type { InboxPartyAvatar } from "@/lib/inboxAvatar";
import { normalizeAvatarRing } from "@shared/avatarRings";

interface ThreadAvatarProps {
  party?: InboxPartyAvatar;
  masked?: boolean;
  size: number;
  ring?: string;
}

export default function ThreadAvatar({ party, masked = false, size, ring }: ThreadAvatarProps) {
  if (masked || !party) {
    return (
      <UserAvatar
        displayName="?"
        username="anonymous"
        avatarRing="none"
        size={size}
      />
    );
  }

  const avatarRing = ring && ring !== "none" ? normalizeAvatarRing(ring) : normalizeAvatarRing(party.avatarRing);
  const avatar = (
    <UserAvatar
      photoUrl={party.photoUrl}
      avatarChoice={party.avatarChoice ?? undefined}
      avatarRing={avatarRing}
      displayName={party.displayName ?? undefined}
      username={party.username ?? undefined}
      href={memberProfileHref(party.username)}
      size={size}
    />
  );
  // Same identity peek as the Hub. Anonymous threads (Mizzed) never get one.
  if (!party.username) return avatar;
  return (
    <IdentityPeek
      username={party.username}
      displayName={party.displayName}
      photoUrl={party.photoUrl}
      avatarChoice={party.avatarChoice}
      avatarRing={avatarRing}
      trigger={<span className="thread-avatar-peek">{avatar}</span>}
    />
  );
}
