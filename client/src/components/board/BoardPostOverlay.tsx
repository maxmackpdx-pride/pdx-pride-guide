import DetailActions from "@/components/DetailActions";
import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useModalA11y } from "@/hooks/useModalA11y";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import GiftListingCard, { cardAccent, type GiftingPost } from "./GiftListingCard";
import { GigListingCard, type GigPost } from "@/pages/PrideWork";
import SellzListingCard, { type SellzPost } from "./SellzListingCard";

/**
 * Opens a board post (gig or gift) as an overlay on top of whatever's behind
 * it - tapped from the hub feed, it shows the real, fully-interactive board
 * card (Say Hi / Raise Hand / owner actions) without navigating away, so
 * closing returns you to your exact scroll spot. Portaled to <body> so the
 * fixed overlay escapes the feed's transformed wrappers.
 *
 * Deep-glass SoT §2.4: same --glass-card recipe as board cards; accent keyed
 * to the post (Gifting #CCFF00 / Gigs var(--board-gigs)).
 */
const GIG_ACCENT = { POSTING_GIG: "var(--board-gigs)", LOOKING_FOR_WORK: "var(--board-gigs)" } as const;

type Props = {
  kind: "gig" | "gifting" | "sellz";
  postId: number;
  onClose: () => void;
};

export default function BoardPostOverlay({ kind, postId, onClose }: Props) {
  const [showAuth, setShowAuth] = useState(false);
  const dialogRef = useModalA11y({ onClose, enabled: !showAuth });

  const {user}=useAuth();
  const endpoint=kind==="gig"?"/api/gigs":kind==="gifting"?"/api/gifting":"/api/sellz";
  const query=useQuery<GiftingPost|GigPost|SellzPost>({queryKey:[endpoint,postId,user?.id],queryFn:()=>apiRequest("GET",`${endpoint}/${postId}`).then(r=>r.json()),retry:1});
  const post=query.data;
  const saved=useQuery<number[]>({queryKey:["/api/sellz/saved/ids"],enabled:kind==="sellz"&&!!user,queryFn:()=>apiRequest("GET","/api/sellz/saved/ids").then(r=>r.json())});

  let card: ReactNode = null;
  // Accent tints the panel border + glow, matching the board card's color.
  let accent = "#FF00CC";
  if (post && kind === "gifting") {
    accent = cardAccent(post as GiftingPost);
    card = (
      <GiftListingCard
        post={post as GiftingPost}
        expanded
        onToggle={() => {}}
        onRequireAuth={() => setShowAuth(true)}
        onDeleted={onClose}
      />
    );
  } else if (post && kind === "sellz") {
    accent = "#39ff14";
    card = <SellzListingCard post={post as SellzPost} expanded saved={saved.data?.includes(postId)||false} onToggle={() => {}} onRequireAuth={() => setShowAuth(true)} onDeleted={onClose} />;
  } else if (post && kind === "gig") {
    const gig = post as GigPost;
    const isLooking = gig.postType === "LOOKING_FOR_WORK";
    const skills = gig.skills ? gig.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    accent = isLooking ? GIG_ACCENT.LOOKING_FOR_WORK : GIG_ACCENT.POSTING_GIG;
    card = (
      <GigListingCard
        gig={gig}
        accent={accent}
        expanded
        skills={skills}
        isLooking={isLooking}
        onToggle={() => {}}
      />
    );
  }

  const panelStyle = {
    width: "100%",
    maxWidth: 560,
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    borderRadius: 14,
    "--listing-accent": accent,
    "--c": accent,
    "--_c": accent,
  } as CSSProperties;

  return createPortal(
    <>
      <div className="board-detail-backdrop" onClick={onClose}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={kind === "gig" ? "Gigz listing" : kind === "gifting" ? "Giftz listing" : "Sellz listing"}
          tabIndex={-1}
          className="board-post-overlay board-post-overlay--glass"
          onClick={e => e.stopPropagation()}
          style={panelStyle}
        >
          <DetailActions label="listing" onClose={onClose} />
          {card ?? (
            <div className="board-listing-card board-listing-card--makeover pdx-glass-rebind" style={{ padding: 28, textAlign: "center", "--listing-accent": accent, "--c": accent } as CSSProperties}>
              <p className="board-copy-sm" role={query.isError ? "alert" : "status"}>{query.isLoading ? "Loading…" : query.isError ? "This listing could not load." : "This listing is no longer available."}</p>
              {query.isError && <button type="button" onClick={() => void query.refetch()}>Try again</button>}
            </div>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </>,
    document.body,
  );
}
