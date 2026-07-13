import UserAvatar from "@/components/UserAvatar";
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

  return (
    <UserAvatar
      photoUrl={party.photoUrl}
      avatarChoice={party.avatarChoice ?? undefined}
      avatarRing={ring && ring !== "none" ? normalizeAvatarRing(ring) : normalizeAvatarRing(party.avatarRing)}
      displayName={party.displayName ?? undefined}
      username={party.username ?? undefined}
      href={memberProfileHref(party.username)}
      size={size}
    />
  );
}