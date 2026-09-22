import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  HOUSING_REPORT_REASONS,
  HOUSING_REPORT_REASON_LABEL,
  type HousingPostView,
  type HousingRequestKind,
} from "@shared/housing";
import { HousingCard, type HousingCardHandlers } from "./HousingCards";
import { HousingDetail, type HousingDetailHandlers } from "./HousingDetail";
import { HousingWorkspace } from "./HousingWorkspace";
import { Chip, Mono } from "./HousingPrimitives";
import { useModalA11y } from "@/hooks/useModalA11y";
import { useToast } from "@/hooks/use-toast";
import { useInboxSheet } from "@/context/InboxSheetContext";
import { queryClient } from "@/lib/queryClient";
import {
  applyHousingRequest,
  applyHousingSavedToggle,
  beginInFlight,
  endInFlight,
  HOUSING_KEY,
  restoreQueries,
  snapshotQueries,
} from "@/lib/optimisticCache";
import { trackProductEvent } from "@/lib/analytics";
import "@/pages/Housing.css";

type Props = {
  post: HousingPostView;
  userId?: number | null;
  originRect?: Pick<DOMRect, "left" | "top" | "width" | "height"> | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onSelectPost: (postId: number) => void;
};

/** The complete HOÜS card and detail flow, kept on top of Mapz. */
const TRANSITION_MS = 220;
function motionAllowed() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !document.documentElement.classList.contains("calm-mode") &&
    document.documentElement.dataset.calm !== "true";
}

function markerTransform(source: Pick<DOMRect, "left" | "top" | "width" | "height">, target: DOMRect) {
  if ([source.left, source.top, source.width, source.height, target.left, target.top, target.width, target.height].some(value => !Number.isFinite(value)) || source.width < 8 || source.height < 8 || target.width < 8 || target.height < 8) return null;
  const x = source.left + source.width / 2 - (target.left + target.width / 2);
  const y = source.top + source.height / 2 - (target.top + target.height / 2);
  return `translate3d(${x}px, ${y}px, 0) scale(${source.width / target.width}, ${source.height / target.height})`;
}

export default function HousingPostOverlay({ post: initialPost, userId, originRect, onClose, onRequireAuth, onSelectPost }: Props) {
  const closingRef = useRef(false);
  const panelAnimationRef = useRef<Animation | null>(null);
  const transitionFromRef = useRef<DOMRect | null>(null);
  const latestCloseRef = useRef({ onClose, originRect });
  latestCloseRef.current = { onClose, originRect };
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    const { onClose: finishClose, originRect: closeOrigin } = latestCloseRef.current;
    const panel = dialogRef.current;
    const transform = panel && closeOrigin && motionAllowed() ? markerTransform(closeOrigin, panel.getBoundingClientRect()) : null;
    if (!panel || !transform) { finishClose(); return; }
    closingRef.current = true;
    panelAnimationRef.current?.cancel();
    const animation = panel.animate([{ transform: "none", opacity: 1 }, { transform, opacity: 0 }], { duration: TRANSITION_MS, easing: "cubic-bezier(.4,0,1,1)" });
    animation.onfinish = finishClose;
    animation.oncancel = () => { closingRef.current = false; };
  }, []);
  const dialogRef = useModalA11y({ onClose: requestClose });
  const { toast } = useToast();
  const { openSheet } = useInboxSheet();
  const [detail, setDetail] = useState(false);
  const [reporting, setReporting] = useState(false);
  const savePendingRef = useRef(new Set<number>());
  const requestPendingRef = useRef(new Set<number>());
  const [savePendingIds, setSavePendingIds] = useState<Set<number>>(() => new Set());

  useLayoutEffect(() => {
    const panel = dialogRef.current;
    const transform = panel && originRect && motionAllowed() ? markerTransform(originRect, panel.getBoundingClientRect()) : null;
    if (!panel || !transform) return;
    const animation = panel.animate([{ transform, opacity: 0.45 }, { transform: "none", opacity: 1 }], { duration: TRANSITION_MS, easing: "cubic-bezier(.2,.85,.3,1)" });
    panelAnimationRef.current = animation;
    return () => animation.cancel();
  }, [initialPost.id, originRect]);

  useLayoutEffect(() => {
    const panel = dialogRef.current;
    const from = transitionFromRef.current;
    transitionFromRef.current = null;
    if (!panel || !from) return;
    panel.scrollTop = 0;
    if (!motionAllowed()) return;
    const to = panel.getBoundingClientRect();
    if (Math.abs(from.width - to.width) < 2 && Math.abs(from.height - to.height) < 2) return;
    const animation = panel.animate([{ width: `${from.width}px`, height: `${from.height}px` }, { width: `${to.width}px`, height: `${to.height}px` }], { duration: TRANSITION_MS, easing: "cubic-bezier(.2,.85,.3,1)" });
    panelAnimationRef.current = animation;
    return () => animation.cancel();
  }, [detail]);

  const showDetail = (next: boolean) => {
    panelAnimationRef.current?.cancel();
    transitionFromRef.current = dialogRef.current?.getBoundingClientRect() || null;
    setDetail(next);
  };

  const { data: fetchedPost } = useQuery<HousingPostView>({
    queryKey: ["/api/housing", initialPost.id],
    initialData: initialPost,
    queryFn: async () => {
      const response = await fetch(`/api/housing/${initialPost.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("This HAÜZ post could not load");
      return response.json();
    },
  });
  const post = fetchedPost || initialPost;
  const postId = post.id;
  const signedIn = Boolean(userId);
  const isOwner = Boolean(userId) && userId === post.author.userId;

  useEffect(() => { setDetail(false); setReporting(false); }, [postId]);
  useEffect(() => {
    if (!signedIn || !post.saved) return;
    const timer = window.setTimeout(() => { void fetch(`/api/housing/${postId}/seen`, { method: "POST", credentials: "include" }); }, 400);
    return () => window.clearTimeout(timer);
  }, [postId, post.saved, signedIn]);

  const requireAuth = () => { if (signedIn) return true; onRequireAuth(); return false; };
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["/api/housing", postId] });
    void queryClient.invalidateQueries({ queryKey: ["/api/housing"] });
  };

  const requestMutation = useMutation({
    mutationFn: async (kind: HousingRequestKind) => {
      const response = await fetch(`/api/housing/${postId}/request`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ kind }) });
      if (!response.ok) throw new Error((await response.json())?.error || "Could not send that");
      return response.json();
    },
    onMutate: async (kind) => { const snap = await snapshotQueries(queryClient, HOUSING_KEY); applyHousingRequest(queryClient, postId, { id: -1, kind, status: "PENDING" }); return { snap }; },
    onError: (error: Error, _kind, context) => { restoreQueries(queryClient, context?.snap); toast({ title: "Did not send", description: error.message, variant: "destructive" }); },
    onSettled: () => { endInFlight(requestPendingRef.current, postId); invalidate(); },
  });
  const saveMutation = useMutation({
    mutationFn: async () => { const response = await fetch(`/api/housing/${postId}/save`, { method: "POST", credentials: "include" }); if (!response.ok) throw new Error("Could not save"); return response.json(); },
    onMutate: async () => { const snap = await snapshotQueries(queryClient, HOUSING_KEY); applyHousingSavedToggle(queryClient, postId); return { snap }; },
    onError: (_error, _variables, context) => restoreQueries(queryClient, context?.snap),
    onSettled: () => { endInFlight(savePendingRef.current, postId); savePendingRef.current.delete(postId); setSavePendingIds(new Set(savePendingRef.current)); invalidate(); },
  });
  const convertMutation = useMutation({
    mutationFn: async (to: "LOOKING" | "FORMING") => { const response = await fetch(`/api/housing/${postId}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ to }) }); if (!response.ok) throw new Error((await response.json())?.error || "Could not convert"); return response.json(); },
    onSuccess: () => { invalidate(); toast({ title: "Converted", description: "Same post, same replies. You are the Lead." }); },
  });
  const buildMutation = useMutation({
    mutationFn: async () => { const response = await fetch(`/api/housing/${postId}/build-haus`, { method: "POST", credentials: "include" }); if (!response.ok) throw new Error((await response.json())?.error || "Could not start it"); return response.json(); },
    onSuccess: (data) => { toast({ title: data?.alreadyLeading ? "You already lead one here" : "HAÜZ started", description: data?.alreadyLeading ? undefined : "Nothing is reserved. The listing stays live." }); if (Number.isFinite(Number(data?.postId))) onSelectPost(Number(data.postId)); },
  });
  const reportMutation = useMutation({
    mutationFn: async (reason: string) => { const response = await fetch(`/api/housing/${postId}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ reason }) }); if (!response.ok) throw new Error("Could not report"); return response.json(); },
    onSuccess: () => { trackProductEvent("report_completed", "housing"); setReporting(false); toast({ title: "Reported", description: "An admin will take a look." }); },
  });

  const share = () => {
    const url = `${window.location.origin}${window.location.pathname}?houz=${post.id}`;
    if (navigator.share) { void navigator.share({ title: post.displayName || post.headline, url }).catch(() => undefined); return; }
    void navigator.clipboard?.writeText(url); toast({ title: "Map link copied" });
  };
  const request = (kind: HousingRequestKind) => {
    if (!requireAuth() || isOwner) return;
    if (post.myRequest?.status === "ACCEPTED") { openSheet({ view: "inbox" }); return; }
    if (post.myRequest?.status === "PENDING" || !beginInFlight(requestPendingRef.current, postId)) return;
    requestMutation.mutate(kind);
  };
  const save = () => {
    if (!requireAuth() || !beginInFlight(savePendingRef.current, postId)) return;
    setSavePendingIds(new Set(savePendingRef.current)); saveMutation.mutate();
  };
  const cardHandlers: HousingCardHandlers = {
    onOpen: () => showDetail(true), onSave: save, onShare: share,
    onChat: () => request("CHAT"), onJoin: () => request("JOIN"), onWaitlist: () => request("WAITLIST"),
    onBuildHaus: () => { if (requireAuth()) buildMutation.mutate(); }, savePendingIds,
  };
  const detailHandlers: HousingDetailHandlers = {
    onBack: () => showDetail(false), backLabel: "Back to card", onRequest: request, onSave: save, onShare: share,
    onReport: () => { if (requireAuth()) setReporting(true); },
    onConvert: () => { if (requireAuth()) convertMutation.mutate(post.type === "LOOKING" ? "FORMING" : "LOOKING"); },
    onBuildHaus: () => { if (requireAuth()) buildMutation.mutate(); }, onOpenPost: onSelectPost,
  };
  const panelStyle = {
    width: detail ? "min(960px, calc(100vw - 24px))" : "min(620px, calc(100vw - 24px))", height: "auto", maxHeight: "min(92vh, 980px)", overflow: "auto",
    position: "relative", border: 0, borderRadius: 14, padding: 0, background: "transparent", boxShadow: "none", backdropFilter: "none",
  } as CSSProperties;

  return createPortal(
    <div className="board-detail-backdrop" onClick={requestClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`${post.displayName || post.headline} HAÜZ ${detail ? "details" : "card"}`} tabIndex={-1} className="hz pdx-glass-rebind" style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="gifting-close" onClick={requestClose} aria-label="Close HAÜZ and return to map" style={{ position: "absolute", top: 10, right: 10, zIndex: 30 }}><X size={18} /></button>
        <div key={detail ? "detail" : "card"} className="houz-overlay-content">
          {detail ? <HousingDetail post={post} h={detailHandlers} isOwner={isOwner} workspace={post.type === "FORMING" ? <HousingWorkspace post={post} onOpenThread={() => openSheet({ view: "inbox" })} /> : undefined} /> : <HousingCard post={post} h={cardHandlers} />}
        </div>
        {reporting ? <div className="hz-sheetwrap" onClick={() => setReporting(false)}><div className="hz-sheet pdx-glass-rebind" onClick={(event) => event.stopPropagation()}>
          <div className="hz-sheet__head"><Mono accent>Report this post</Mono><button className="hz-x" onClick={() => setReporting(false)} aria-label="Close">×</button></div>
          <p className="hz-prose">What is wrong with it? An admin sees this, and the poster does not.</p>
          <div className="hz-chiprow" style={{ marginTop: 14 }}>{HOUSING_REPORT_REASONS.map(reason => <Chip key={reason} onClick={() => reportMutation.mutate(reason)}>{HOUSING_REPORT_REASON_LABEL[reason]}</Chip>)}</div>
        </div></div> : null}
      </div>
    </div>, document.body,
  );
}
