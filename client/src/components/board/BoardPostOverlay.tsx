import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import GiftListingCard, { type GiftingPost } from "./GiftListingCard";
import { GigListingCard, type GigPost } from "@/pages/PrideWork";

/**
 * Opens a board post (gig or gift) as an overlay on top of whatever's behind
 * it — tapped from the hub feed, it shows the real, fully-interactive board
 * card (Say Hi / Raise Hand / owner actions) without navigating away, so
 * closing returns you to your exact scroll spot. Portaled to <body> so the
 * fixed overlay escapes the feed's transformed wrappers.
 */
const GIG_ACCENT = { POSTING_GIG: "#b06bff", LOOKING_FOR_WORK: "#19e3ff" } as const;

type Props = {
  kind: "gig" | "gifting";
  postId: number;
  onClose: () => void;
};

export default function BoardPostOverlay({ kind, postId, onClose }: Props) {
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

  const query = kind === "gifting" ? giftQuery : gigQuery;
  const post = kind === "gifting"
    ? giftQuery.data?.find(p => p.id === postId)
    : gigQuery.data?.find(g => g.id === postId);

  // If the post is gone after a load (deleted, marked done, expired), close.
  useEffect(() => {
    if (!query.isLoading && query.data && !post) onClose();
  }, [query.isLoading, query.data, post, onClose]);

  let card: React.ReactNode = null;
  if (post && kind === "gifting") {
    card = (
      <GiftListingCard
        post={post as GiftingPost}
        expanded
        onToggle={() => {}}
        onRequireAuth={() => {}}
        onDeleted={onClose}
      />
    );
  } else if (post && kind === "gig") {
    const gig = post as GigPost;
    const isLooking = gig.postType === "LOOKING_FOR_WORK";
    const skills = gig.skills ? gig.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    card = (
      <GigListingCard
        gig={gig}
        accent={isLooking ? GIG_ACCENT.LOOKING_FOR_WORK : GIG_ACCENT.POSTING_GIG}
        expanded
        skills={skills}
        isLooking={isLooking}
        onToggle={() => {}}
      />
    );
  }

  return createPortal(
    <div className="board-detail-backdrop" onClick={onClose}>
      <div
        className="board-post-overlay"
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", position: "relative" }}
      >
        <button
          type="button"
          className="gifting-close"
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}
        >
          <X size={18} />
        </button>
        {card ?? (
          <div className="board-listing-card board-listing-card--makeover" style={{ padding: 28, textAlign: "center" }}>
            <p className="board-copy-sm">Loading…</p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
