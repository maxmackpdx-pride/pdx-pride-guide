import type { ReactNode } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

type IdentityPeekProps = {
  trigger: ReactNode;
  username: string;
  displayName?: string | null;
  photoUrl?: string | null;
  avatarChoice?: number | null;
  avatarRing?: string | null;
  bio?: string | null;
  verifiedHost?: boolean;
};

export default function IdentityPeek({ trigger, username, displayName, photoUrl, avatarChoice, avatarRing, bio, verifiedHost }: IdentityPeekProps) {
  const name = displayName?.trim() || username;
  return <HoverCard openDelay={260} closeDelay={100}>
    <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
    <HoverCardContent className="identity-peek pdx-glass-card pdx-glass-rebind" sideOffset={8} align="start">
      <div className="identity-peek__head">
        <UserAvatar photoUrl={photoUrl} avatarChoice={avatarChoice ?? undefined} avatarRing={avatarRing ?? undefined} displayName={displayName} username={username} size={52} />
        <div><strong>{name}</strong><span>@{username}</span></div>
      </div>
      {verifiedHost ? <span className="identity-peek__signal">Verified host</span> : null}
      <p>{bio?.trim() || "Open their profile to learn more."}</p>
      <Link href={`/u/${encodeURIComponent(username)}`} className="identity-peek__action">VIEW PROFILE →</Link>
    </HoverCardContent>
  </HoverCard>;
}
