import DetailActions from "@/components/DetailActions";
import { useCallback, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useModalA11y } from "@/hooks/useModalA11y";
import { Button } from "@/components/ds";
import { BoardGlassMotif } from "@/components/board/GiftListingCard";

/**
 * The MIZZED CONNECTION detail card - the same overlay you get when you tap a
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
  isMine?: boolean;
  status?: string;
  source?: { label: string; title: string; image: string | null; href: string; note: string } | null;
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
  isMine = false,
  status = "ACTIVE",
  source,
}: SpottedDetailModalProps) {
  const { toast } = useToast();
  const [replyBody, setReplyBody] = useState("");
  const handleClose = useCallback(() => onClose(), [onClose]);
  const dialogRef = useModalA11y({ onClose: handleClose });

  const [editing,setEditing]=useState(false);
  const [editTitle,setEditTitle]=useState(title);
  const [editBody,setEditBody]=useState(body);
  const [reportReason,setReportReason]=useState("");
  const ownerMutation=useMutation({
    mutationFn:({method,data}:{method:"PUT"|"DELETE";data?:Record<string,string>})=>apiRequest(method,`/api/missed-connections/${postId}`,data),
    onSuccess:()=>{void queryClient.invalidateQueries({queryKey:["/api/missed-connections"]});void queryClient.invalidateQueries({queryKey:["/api/missed-connections/mine"]});setEditing(false);toast({title:"Connection updated"});},
    onError:(error:Error)=>toast({title:"Could not update",description:error.message,variant:"destructive"}),
  });
  const reportMutation=useMutation({mutationFn:()=>apiRequest("POST",`/api/missed-connections/${postId}/report`,{reason:reportReason}),onSuccess:()=>{setReportReason("");toast({title:"Report sent"});},onError:(error:Error)=>toast({title:"Could not report",description:error.message,variant:"destructive"})});
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
        <DetailActions label="listing" onClose={onClose} />
        <div className="board-detail-modal__meta" style={{ position: "relative", zIndex: 1 }}>
          <span className="board-detail-modal__live-dot" aria-hidden="true" />
          <span className="board-detail-modal__meta-line" style={{ color: kindColor || MC_GLASS }}>
            MIZZED CONNECTION · {kindLabel}
            {place ? ` · ${place}` : ""}
          </span>
        </div>
        <h3 className="display section-heading board-detail-modal__quote-title" style={{ position: "relative", zIndex: 1 }}>
          “{title || body.slice(0, 80)}”
        </h3>
        <p className="board-copy-sm board-detail-modal__body" style={{ position: "relative", zIndex: 1 }}>
          {body}
        </p>
        {source && <div className="mizzed-source-link"><span>FROM THE {source.label.toUpperCase()} CARD</span><div>{source.image && <img src={source.image} alt="" />}<div><strong>{source.title}</strong><small>{source.note}</small><a href={source.href}>Open source card ↗</a></div></div></div>}
        {isMine ? <div className="board-detail-modal__actions" style={{position:"relative",zIndex:1}}>
          {editing ? <form onSubmit={e=>{e.preventDefault();ownerMutation.mutate({method:"PUT",data:{title:editTitle,body:editBody}});}}><label>Title<input className="board-text-field" maxLength={80} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></label><label>Message<textarea className="board-text-field" maxLength={500} rows={5} required value={editBody} onChange={e=>setEditBody(e.target.value)}/></label><Button type="submit" disabled={ownerMutation.isPending||!editBody.trim()}>Save changes</Button><Button type="button" onClick={()=>setEditing(false)}>Cancel</Button></form> : <Button onClick={()=>setEditing(true)}>Edit connection</Button>}
          {status==="ACTIVE" && <Button disabled={ownerMutation.isPending} onClick={()=>ownerMutation.mutate({method:"PUT",data:{status:"ARCHIVED"}})}>Close connection</Button>}
          <Button disabled={ownerMutation.isPending} onClick={()=>{if(confirm("Delete this connection?"))ownerMutation.mutate({method:"DELETE"},{onSuccess:onClose});}}>Delete</Button>
        </div> : status !== "ACTIVE" ? <p role="status">This connection is closed.</p> : <div className="board-detail-modal__actions" style={{ position: "relative", zIndex: 1 }}>
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
          <details><summary>Report this connection</summary><label>Reason<input className="board-text-field" value={reportReason} onChange={e=>setReportReason(e.target.value)}/></label><Button disabled={!reportReason.trim()||reportMutation.isPending} onClick={()=>reportMutation.mutate()}>Send report</Button></details>
        </div>}
      </div>
    </div>,
    document.body,
  );
}
