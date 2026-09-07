import { useState, type ReactNode } from "react";
import { MessageCircle, UserRound } from "lucide-react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useAuth } from "@/context/AuthContext";
import MessageModal from "@/pages/profile/MessageModal";
import type { MemberProfileData } from "@/pages/profile/types";

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
  const { user } = useAuth();
  const [messageOpen, setMessageOpen] = useState(false);
  const name = displayName?.trim() || username;
  const isSelf = user?.username?.toLowerCase() === username.toLowerCase();
  const modalData: MemberProfileData = {
    username,
    displayName: displayName || username,
    photoUrl,
    avatarChoice: avatarChoice ?? undefined,
    avatarRing,
  };
  return <>
    <HoverCard openDelay={260} closeDelay={140}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent className="identity-peek pdx-glass-card pdx-glass-rebind pdx-liquid-overlay" sideOffset={8} align="start">
        <div className="identity-peek__head">
          <UserAvatar photoUrl={photoUrl} avatarChoice={avatarChoice ?? undefined} avatarRing={avatarRing ?? undefined} displayName={displayName} username={username} size={52} />
          <div><strong>{name}</strong><span>@{username}</span></div>
        </div>
        {verifiedHost ? <span className="identity-peek__signal">Verified host</span> : null}
        <p>{bio?.trim() || "Open their profile to learn more."}</p>
        <div className="identity-peek__actions">
          <Link href={`/u/${encodeURIComponent(username)}`} className="identity-peek__action"><UserRound size={15} aria-hidden="true" />VIEW PROFILE</Link>
          {user && !isSelf ? <button type="button" className="identity-peek__action identity-peek__action--message" onClick={() => setMessageOpen(true)}><MessageCircle size={15} aria-hidden="true" />MESSAGE</button> : null}
        </div>
      </HoverCardContent>
    </HoverCard>
    {messageOpen ? <MessageModal data={modalData} username={username} onClose={() => setMessageOpen(false)} /> : null}
  </>;
}
