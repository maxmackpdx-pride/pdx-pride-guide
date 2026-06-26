export type InboxPartyAvatar = {
  photoUrl?: string | null;
  avatarChoice?: number | null;
  avatarRing?: string | null;
  displayName?: string | null;
  username?: string | null;
};

type MessageRow = Record<string, unknown>;

export function counterpartyAvatar(msg: MessageRow, tab: "inbox" | "sent"): InboxPartyAvatar {
  if (tab === "inbox") {
    return {
      photoUrl: (msg.from_photo_url ?? msg.fromPhotoUrl) as string | null | undefined,
      avatarChoice: (msg.from_avatar_choice ?? msg.fromAvatarChoice) as number | null | undefined,
      avatarRing: (msg.from_avatar_ring ?? msg.fromAvatarRing) as string | null | undefined,
      displayName: (msg.from_display_name ?? msg.fromDisplayName) as string | null | undefined,
      username: (msg.from_username ?? msg.fromUsername) as string | null | undefined,
    };
  }
  return {
    photoUrl: (msg.to_photo_url ?? msg.toPhotoUrl) as string | null | undefined,
    avatarChoice: (msg.to_avatar_choice ?? msg.toAvatarChoice) as number | null | undefined,
    avatarRing: (msg.to_avatar_ring ?? msg.toAvatarRing) as string | null | undefined,
    displayName: (msg.to_display_name ?? msg.toDisplayName) as string | null | undefined,
    username: (msg.to_username ?? msg.toUsername) as string | null | undefined,
  };
}

export function senderAvatar(msg: MessageRow): InboxPartyAvatar {
  return {
    photoUrl: (msg.from_photo_url ?? msg.fromPhotoUrl) as string | null | undefined,
    avatarChoice: (msg.from_avatar_choice ?? msg.fromAvatarChoice) as number | null | undefined,
    avatarRing: (msg.from_avatar_ring ?? msg.fromAvatarRing) as string | null | undefined,
    displayName: (msg.from_display_name ?? msg.fromDisplayName) as string | null | undefined,
    username: (msg.from_username ?? msg.fromUsername) as string | null | undefined,
  };
}