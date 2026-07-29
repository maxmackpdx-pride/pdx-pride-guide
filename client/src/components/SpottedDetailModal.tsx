import { useCallback, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useModalA11y } from "@/hooks/useModalA11y";
import { Button } from "@/components/ds";
import { BoardGlassMotif } from "@/components/board/GiftListingCard";

/**
 * The Missed Connections detail card - the same overlay you get when you tap a
 * post on the board. Shared so the hub feed can open the identical card instead
 * of bouncing to the board page. Self-contained: owns the private-reply flow.
 *
 * Deep-glass SoT §2.4: --glass-card with magenta accent (#FF00CC) + quote motif.
 */
export type SpottedDetailModalProps = {
  postId: number;
  title: string;
  body: string;
  place: string;
  kindLabel: string;
  kindColor: string;
  onClose: () => void;
};

const MC_GLASS = "#FF00CC";

export default function SpottedDetailModal({
  postId,
  title,
  body,
  place,
  kindLabel,
  kindColor,
  onClose,
}: SpottedDetailModalProps) {
  const { toast } = useToast();
  const [replyBody, setReplyBody] = useState("");
  const handleClose = useCallback(() => onClose(), [onClose]);
  const dialogRef = useModalA11y({ onClose: handleClose });

  const replyMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/missed-connections/${postId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: replyBody }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not send reply");
        return data;
      }),
    onSuccess: () => {
      setReplyBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({ title: "Private reply sent", description: "Thread is private. Reveal yourself in inbox when you're ready." });
      onClose();
    },
    onError: (err: Error) => toast({ title: "Could not send reply", description: err.message, variant: "destructive" }),
  });

  const glassVars = {
    "--listing-accent": MC_GLASS,
    "--spotted-accent": MC_GLASS,
    "--c": MC_GLASS,
    "--_c": MC_GLASS,
  } as CSSProperties;

  // Portal to <body> so the fixed-position overlay escapes any transformed
  // ancestor (e.g. the feed's ScrollReveal wrappers) and centers on the viewport.
  return createPortal(
    <div className="board-detail-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Missed connection"}
        tabIndex={-1}
        className="board-detail-modal board-detail-modal--spotted board-detail-modal--glass"
        onClick={e => e.stopPropagation()}
        style={glassVars}
      >
        <BoardGlassMotif variant="quote-pair" />
        <button type="button" className="gifting-close" onClick={onClose} aria-label="Close" style={{ position: "relative", zIndex: 3 }}>
          <X size={18} />
        </button>
        <div className="board-detail-modal__meta" style={{ position: "relative", zIndex: 1 }}>
          <span className="board-detail-modal__live-dot" aria-hidden="true" />
          <span className="board-detail-modal__meta-line" style={{ color: kindColor || MC_GLASS }}>
            Missed Connection · {kindLabel}
            {place ? ` · ${place}` : ""}
          </span>
        </div>
        <h3 className="display section-heading board-detail-modal__quote-title" style={{ position: "relative", zIndex: 1 }}>
          “{title || body.slice(0, 80)}”
        </h3>
        <p className="board-copy-sm board-detail-modal__body" style={{ position: "relative", zIndex: 1 }}>
          {body}
        </p>
        <div className="board-detail-modal__actions" style={{ position: "relative", zIndex: 1 }}>
          <textarea
            className="board-text-field"
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            rows={3}
            placeholder="Was this you, or were you there? Reply privately. Kind and specific goes far."
          />
          <div className="board-detail-modal__cta-row">
            <Button
              variant="solid"
              accent="magenta"
              size="md"
              disabled={!replyBody.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate()}
            >
              {replyMutation.isPending ? "Sending…" : "This is me"}
            </Button>
            <Button
              variant="outline"
              accent="magenta"
              size="md"
              disabled={!replyBody.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate()}
            >
              Reply anonymously
            </Button>
          </div>
          <p className="board-copy-sm" style={{ marginTop: 12, color: "#6a675f", fontSize: "0.72rem" }}>
            Replies open a private, anonymous inbox thread. Reveal your profile only when you are both ready.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
