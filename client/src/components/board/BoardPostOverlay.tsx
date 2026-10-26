import { useInlineBoardCard } from "@/components/board/BoardCardContinuity";
import DetailActions from "@/components/DetailActions";
import { useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useOpenCardClose } from "@/hooks/useOpenCardClose";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import GiftListingCard, { cardAccent, type GiftingPost } from "./GiftListingCard";
import { GigListingCard, type GigPost } from "@/pages/PrideWork";
import SellzListingCard, { type SellzPost } from "./SellzListingCard";
import "./OpenBoardCard.css";

/**
 * Opens a board post (gig or gift) as an overlay on top of whatever's behind
 * it - tapped from the hub feed, it shows the real, fully-interactive board
 * card (Say Hi / Raise Hand / owner actions) without navigating away, so
 * closing returns you to your exact scroll spot. Portaled to <body> so the
 * fixed overlay escapes the feed's transformed wrappers.
 *
 * Deep-glass SoT §2.4: same --glass-card recipe as board cards; accent keyed
 * to the post (Giftz var(--room-giftz) / Gigz var(--board-gigs)).
 */
const GIG_ACCENT = { POSTING_GIG: "var(--board-gigs)", LOOKING_FOR_WORK: "var(--board-gigs)" } as const;

type Props = {
  kind: "gig" | "gifting" | "sellz";
  postId: number;
  onClose: () => void;
  presentation?: "eventz";
};

export default function BoardPostOverlay({ kind, postId, onClose, presentation }: Props) {
  const inline = useInlineBoardCard();
  const [showAuth, setShowAuth] = useState(false);
  const { dialogRef, requestClose } = useOpenCardClose(onClose, !showAuth);

  const {user}=useAuth();
  const client = useQueryClient();
  const endpoint=kind==="gig"?"/api/gigs":kind==="gifting"?"/api/gifting":"/api/sellz";
  const query=useQuery<GiftingPost|GigPost|SellzPost>({queryKey:[endpoint,postId,user?.id],queryFn:()=>apiRequest("GET",`${endpoint}/${postId}`).then(r=>r.json()),retry:1,placeholderData:()=>client.getQueryData<Array<GiftingPost|GigPost|SellzPost>>([endpoint,"all-boards",user?.id])?.find(post=>post.id===postId)});
  const post=query.data;
  const saved=useQuery<number[]>({queryKey:["/api/sellz/saved/ids"],enabled:kind==="sellz"&&!!user,queryFn:()=>apiRequest("GET","/api/sellz/saved/ids").then(r=>r.json())});

  let card: ReactNode = null;
  // Accent tints the panel border + glow, matching the board card's color.
  let accent = "var(--room-mizzed)";
  if (post && kind === "gifting") {
    accent = presentation ? "var(--room-giftz)" : cardAccent(post as GiftingPost);
    card = (
      <GiftListingCard
        post={post as GiftingPost}
        skipLeadPhoto={false}
        expanded
        onToggle={() => {}}
        onRequireAuth={() => setShowAuth(true)}
        onDeleted={onClose}
      />
    );
  } else if (post && kind === "sellz") {
    accent = "var(--room-sellz)";
    card = <SellzListingCard post={post as SellzPost} skipLeadPhoto={false} expanded saved={saved.data?.includes(postId)||false} onToggle={() => {}} onRequireAuth={() => setShowAuth(true)} onDeleted={onClose} />;
  } else if (post && kind === "gig") {
    const gig = post as GigPost;
    const isLooking = gig.postType === "LOOKING_FOR_WORK";
    const skills = gig.skills ? gig.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
    accent = isLooking ? GIG_ACCENT.LOOKING_FOR_WORK : GIG_ACCENT.POSTING_GIG;
    card = (
      <GigListingCard
        gig={gig}
        presentation={presentation}
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

  const content = (
    <>
      <div className="board-detail-backdrop" onClick={requestClose}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal={inline ? undefined : true}
          aria-label={kind === "gig" ? "Gigz listing" : kind === "gifting" ? "Giftz listing" : "Sellz listing"}
          tabIndex={-1}
          className={`boardz-open-surface board-post-overlay board-post-overlay--glass board-open-card--shared pdx-glass-rebind${presentation ? ` ab-open-card${kind === "gig" ? " ab-open-card--gigz" : " ab-open-card--listing"}` : ""}`}
          onClick={e => e.stopPropagation()}
          style={panelStyle}
        >
          <span className="board-open-card__rule" aria-hidden="true" />
          {presentation ? (
            <div className="ab-open-card__chrome">
              <DetailActions label="listing" onClose={requestClose} />
            </div>
          ) : <DetailActions label="listing" onClose={requestClose} />}
          {post?.isDemo && <p className="board-demo-notice" role="note">DEMO · Participation is disabled.</p>}
          <fieldset disabled={post?.isDemo} onClickCapture={event => { if (post?.isDemo) { event.preventDefault(); event.stopPropagation(); } }} onKeyDownCapture={event => { if (post?.isDemo && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.stopPropagation(); } }} style={{border:0,padding:0,margin:0,minWidth:0}}>{card ?? (
            <div className="board-listing-card board-listing-card--makeover pdx-glass-rebind" style={{ padding: 28, textAlign: "center", "--listing-accent": accent, "--c": accent } as CSSProperties}>
              <p className="board-copy-sm" role={query.isError ? "alert" : "status"}>{query.isLoading ? "Loading…" : query.isError ? "This listing could not load." : "This listing is no longer available."}</p>
              {query.isError && <button type="button" onClick={() => void query.refetch()}>Try again</button>}
            </div>
          )}</fieldset>
        </div>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </>
  );
  return inline ? content : createPortal(content, document.body);
}
