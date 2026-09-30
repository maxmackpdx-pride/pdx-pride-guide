import { useState } from "react";
import { Check, Palette, Share2, Ticket } from "lucide-react";
import { Button } from "@/components/ds";
import type { ProfileBanner } from "@shared/profileTheme";
import AccentBannerPopover from "./AccentBannerPopover";
import SharePopover from "./SharePopover";
import type { MemberProfileData } from "./types";

function CheckIcon({ size = 14 }: { size?: number }) {
  return <Check size={size} strokeWidth={3} aria-hidden="true" />;
}
function PaletteIcon() {
  return <Palette size={18} aria-hidden="true" />;
}
function ShareIcon() {
  return <Share2 size={16} aria-hidden="true" />;
}
function TicketIcon() {
  return <Ticket size={16} aria-hidden="true" />;
}

export default function ProfileActionRow({
  data,
  username,
  isOwner,
  following,
  followPending,
  onFollow,
  onSavePatch,
  onSwitchToEvents,
  onOpenMessage,
  ticketHref,
}: {
  data: MemberProfileData;
  username: string;
  isOwner: boolean;
  following: boolean;
  followPending: boolean;
  onFollow: () => void;
  onSavePatch: (patch: Record<string, unknown>) => Promise<boolean>;
  onSwitchToEvents: () => void;
  onOpenMessage: () => void;
  ticketHref?: string | null;
}) {
  const [accentOpen, setAccentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const isPromoter = !!data.showPromoterVariant;
  const profileUrl = typeof window !== "undefined" ? window.location.href : `https://www.zaylist.com/u/${username}`;

  return (
    <div className="mp-actions">
      {!isOwner && (
        <button
          type="button"
          className={`mp-follow-btn${following ? " mp-follow-btn--on" : ""}`}
          onClick={onFollow}
          disabled={followPending}
          data-testid="profile-follow"
        >
          {following && <CheckIcon />}
          {following ? "Following" : "Follow"}
        </button>
      )}

      <div className="mp-action-popover-wrap">
        <button
          type="button"
          className="mp-accent-btn"
          aria-label="Profile accent"
          onClick={() => { setAccentOpen(v => !v); setShareOpen(false); }}
          data-testid="profile-accent-trigger"
        >
          <PaletteIcon />
        </button>
        {accentOpen && (
          <AccentBannerPopover
            accentColor={data.accentColor}
            banner={data.banner as ProfileBanner | undefined}
            onClose={() => setAccentOpen(false)}
            onSave={patch => onSavePatch(patch)}
          />
        )}
      </div>

      <div className="mp-action-popover-wrap">
        <button
          type="button"
          className="mp-share-btn"
          onClick={() => { setShareOpen(v => !v); setAccentOpen(false); }}
          data-testid="profile-share-trigger"
        >
          <ShareIcon />
          Share
        </button>
        {shareOpen && (
          <SharePopover
            profileUrl={profileUrl}
            onClose={() => setShareOpen(false)}
            onOpenMessage={isOwner ? undefined : onOpenMessage}
          />
        )}
      </div>

      {isPromoter && (
        ticketHref ? (
          <a href={ticketHref} target="_blank" rel="noopener noreferrer" className="mp-tickets-btn">
            <TicketIcon />
            Tickets
          </a>
        ) : (
          <Button variant="neon" accent="cyan" size="md" leadingIcon={<TicketIcon />} onClick={onSwitchToEvents}>
            Tickets
          </Button>
        )
      )}
    </div>
  );
}
