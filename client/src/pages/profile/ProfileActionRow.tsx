import { useState } from "react";
import { Button } from "@/components/ds";
import type { ProfileBanner } from "@shared/profileTheme";
import AccentBannerPopover from "./AccentBannerPopover";
import SharePopover from "./SharePopover";
import type { MemberProfileData } from "./types";

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r="1.3" />
      <circle cx="17" cy="10" r="1.3" />
      <circle cx="8" cy="7" r="1.3" />
      <circle cx="6.5" cy="12" r="1.3" />
      <path d="M12 2a10 10 0 1 0 0 20 2 2 0 0 0 2-2 2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 10 10 0 0 0-10-10z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v13" />
    </svg>
  );
}
function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
    </svg>
  );
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
