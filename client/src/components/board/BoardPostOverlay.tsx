import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
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

  const giftQuery = useQuery<GiftingPost[]>({
    queryKey: ["/api/gifting"],
    queryFn: async () => {
      const r = await fetch("/api/gifting", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: kind === "gifting",
  });

  const gigQuery = useQuery<GigPost[]>({
    queryKey: ["/api/gigs"],
    queryFn: async () => {
      const r = await fetch("/api/gigs", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: kind === "gig",
  });
  const sellzQuery = useQuery<SellzPost[]>({
    queryKey: ["/api/sellz"],
    queryFn: async () => {
      const r = await fetch("/api/sellz", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    enabled: kind === "sellz",
  });

  const query = kind === "gifting" ? giftQuery : kind === "sellz" ? sellzQuery : gigQuery;
  const post = kind === "gifting"
    ? giftQuery.data?.find(p => p.id === postId)
    : kind === "sellz"
      ? sellzQuery.data?.find(p => p.id === postId)
      : gigQuery.data?.find(g => g.id === postId);

  // If the post is gone after a load (deleted, marked done, expired), close.
  useEffect(() => {
    if (!query.isLoading && query.data && !post) onClose();
  }, [query.isLoading, query.data, post, onClose]);

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
    card = <SellzListingCard post={post as SellzPost} expanded saved={false} onToggle={() => {}} onRequireAuth={() => setShowAuth(true)} onDeleted={onClose} />;
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
          className="board-post-overlay board-post-overlay--glass"
          onClick={e => e.stopPropagation()}
          style={panelStyle}
        >
          <button
            type="button"
            className="gifting-close"
            onClick={onClose}
            aria-label="Close"
            style={{ position: "absolute", top: 10, right: 10, zIndex: 3 }}
          >
            <X size={18} />
          </button>
          {card ?? (
            <div className="board-listing-card board-listing-card--makeover" style={{ padding: 28, textAlign: "center", "--listing-accent": accent, "--c": accent } as CSSProperties}>
              <p className="board-copy-sm">Loading…</p>
            </div>
          )}
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </>,
    document.body,
  );
}
