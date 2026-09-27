import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import AuthModal from "./AuthModal";
import type { CommunitySummary } from "@shared/community";

export default function CommunityPageInvitation({ community }: { community: CommunitySummary }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"manage" | "remove" | null>(null);
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [notice, setNotice] = useState("");
  const request = useMutation({
    mutationFn: async () => {
      if (mode === "manage") return (await apiRequest("POST", `/api/communities/${encodeURIComponent(community.slug)}/claim`, { claimReason: reason })).json();
      return (await apiRequest("POST", "/api/feedback", {
        category: "PAGE_REMOVAL", severity: "MEDIUM", pageUrl: `/z/${community.slug}`,
        message: `Request to remove Z/List page: ${community.name}\n${reason}`, email,
      })).json();
    },
    onSuccess: async () => {
      setNotice(mode === "manage" ? "Request received. We’ll review your connection to the group before granting page access." : "Removal request received. ZayList will review it and follow up by email.");
      setMode(null); setReason("");
      await queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
    },
  });
  if (!community.sourcePlaceId || community.canManage) return null;
  const choose = (next: "manage" | "remove") => { setMode(next); setReason(""); setNotice(""); request.reset(); };
  return <section className="z-community-card__claim-area" aria-label={`Page options for ${community.name}`}>
    {community.isClaimable && <p>Part of {community.name}? Run your page here. Share updates, connect your events, and make it your own.</p>}
    {notice && <p role="status">{notice}</p>}
    {mode ? <form onSubmit={event => { event.preventDefault(); if (mode === "manage" && !user) { setShowAuth(true); return; } request.mutate(); }}>
      <label htmlFor={`page-request-${community.id}`}>{mode === "manage" ? "Tell us your role with this group" : "Tell us your connection to this group and why this page should be removed"}</label>
      <textarea id={`page-request-${community.id}`} value={reason} onChange={event => setReason(event.target.value)} minLength={10} maxLength={500} required autoFocus disabled={request.isPending}/>
      {mode === "remove" && <label>Contact email<input type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={180} required disabled={request.isPending}/></label>}
      <p>{mode === "manage" ? "Page access is reviewed before approval." : "This sends a request to ZayList for review. It does not immediately remove the page."}</p>
      {request.isError && <p role="alert">{parseApiError(request.error, "Could not send your request. Please try again.")}</p>}
      <div><button type="submit" disabled={request.isPending}>{request.isPending ? "SENDING…" : "SEND REQUEST"}</button><button type="button" disabled={request.isPending} onClick={() => setMode(null)}>CANCEL</button></div>
    </form> : <div className="z-community-page-options">
      {community.isClaimable && (community.hasPendingClaim ? <span className="z-community-card__claim-pending">Page management request under review</span> : <button type="button" className="z-community-card__claim" onClick={() => choose("manage")}>Run your page here</button>)}
      <button type="button" onClick={() => choose("remove")}>Request page removal</button>
    </div>}
    {showAuth && <AuthModal onClose={() => setShowAuth(false)}/>}
  </section>;
}
