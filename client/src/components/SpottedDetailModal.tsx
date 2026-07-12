import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ds";

/**
 * The Missed Connections detail card — the same overlay you get when you tap a
 * post on the board. Shared so the hub feed can open the identical card instead
 * of bouncing to the board page. Self-contained: owns the private-reply flow.
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

  // Portal to <body> so the fixed-position overlay escapes any transformed
  // ancestor (e.g. the feed's ScrollReveal wrappers) and centers on the viewport.
  return createPortal(
    <div className="board-detail-backdrop" onClick={onClose}>
      <div
        className="board-detail-modal board-detail-modal--spotted"
        onClick={e => e.stopPropagation()}
        style={{ "--listing-accent": "#ff1fa0" } as React.CSSProperties}
      >
        <button type="button" className="gifting-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <span className="board-detail-modal__quote" aria-hidden="true">&rdquo;</span>
        <div className="board-detail-modal__tags">
          <span className="board-detail-modal__kind" style={{ color: kindColor }}>
            {kindLabel}
          </span>
        </div>
        <h3 className="display section-heading" style={{ marginTop: 12 }}>
          {title || body.slice(0, 80)}
        </h3>
        <p className="board-copy-sm" style={{ marginTop: 12, lineHeight: 1.62, whiteSpace: "pre-line" }}>
          {body}
        </p>
        <div className="board-section-kicker board-section-kicker--magenta" style={{ marginTop: 14, fontSize: 11 }}>
          {place} · Anonymous
        </div>
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #1c1c22" }}>
          <textarea
            className="board-text-field"
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            rows={3}
            placeholder="Was this you, or were you there? Reply privately. Kind and specific goes far."
          />
          <Button
            variant="solid"
            accent="magenta"
            size="lg"
            arrow
            block
            style={{ marginTop: 12 }}
            disabled={!replyBody.trim() || replyMutation.isPending}
            onClick={() => replyMutation.mutate()}
          >
            {replyMutation.isPending ? "Sending…" : "Send private reply"}
          </Button>
          <p className="board-copy-sm" style={{ marginTop: 12, color: "#6a675f", fontSize: "0.72rem" }}>
            Replies open a private, anonymous inbox thread. Reveal your profile only when you are both ready.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
