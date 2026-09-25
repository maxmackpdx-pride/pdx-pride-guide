import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ds";
import AuthModal from "@/components/AuthModal";
import SectionBreadcrumb from "@/components/SectionBreadcrumb";
import SpectrumLoader from "@/components/SpectrumLoader";
import { communityLogo } from "@shared/communityLogos";
import type { CommunitySummary } from "@shared/community";
import "./ZIndex.css";

export default function ZIndex() {
  usePageSeo("Z/ List · Communities | Zaylist", "Find your people in queer Portland. Join communities, share conversations, and make plans together on Zaylist.");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [claimSlug, setClaimSlug] = useState<string | null>(null);
  const [claimReason, setClaimReason] = useState("");
  const [claimError, setClaimError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "", neighborhood: "", visibility: "public", membershipPolicy: "open" });
  const communities = useQuery<CommunitySummary[]>({ queryKey: ["/api/communities"] });
  const create = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/communities", draft)).json(),
    onSuccess: async (item: CommunitySummary) => { await queryClient.invalidateQueries({ queryKey: ["/api/communities"] }); navigate(`/z/${item.slug}`); },
    onError: err => setError(parseApiError(err, "Community could not be created.")),
  });
  const claim = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/communities/${encodeURIComponent(claimSlug || "")}/claim`, { claimReason })).json(),
    onSuccess: async () => { setClaimSlug(null); setClaimReason(""); setClaimError(""); await queryClient.invalidateQueries({ queryKey: ["/api/communities"] }); },
    onError: err => setClaimError(parseApiError(err, "Could not submit this claim.")),
  });
  return <div className="z-communities">
    <header className="z-communities__hero">
      <SectionBreadcrumb section="Communities" />
      <h1><span>Z/</span> List</h1>
      <p className="z-communities__intro">Find your people. Join a conversation, share what matters, and make plans together. Every community has its own voice and its own rules.</p>
      {user ? <Button accent="cyan" onClick={() => setCreating(value => !value)} aria-expanded={creating} aria-controls="z-community-create">{creating ? "CANCEL" : "CREATE A COMMUNITY"}</Button> : <Link href="/dashboard"><Button as="span" accent="cyan">SIGN IN TO CREATE</Button></Link>}
    </header>
    {creating ? <form id="z-community-create" className="z-community-panel z-community-create" onSubmit={event => { event.preventDefault(); create.mutate(); }} aria-busy={create.isPending}>
      <h2>CREATE A COMMUNITY</h2><p>The creator becomes the owner and is responsible for rules and moderation.</p>
      <label>Name<input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} minLength={3} maxLength={100} required /></label>
      <label>Description<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} minLength={10} maxLength={1200} required /></label>
      <label>Neighborhood<input value={draft.neighborhood} onChange={event => setDraft({ ...draft, neighborhood: event.target.value })} maxLength={100} /></label>
      <label>Visibility<select value={draft.visibility} onChange={event => setDraft({ ...draft, visibility: event.target.value })}><option value="public">Public</option><option value="discoverable">Discoverable</option><option value="private">Private</option></select></label>
      <p className="z-community-visibility-help">Public and Discoverable communities appear in search and the directory; anyone can read their posts. Private communities are hidden from nonmembers, and only active members can read their posts. Joining rules are set separately.</p><label>Joining<select value={draft.membershipPolicy} onChange={event => setDraft({ ...draft, membershipPolicy: event.target.value })}><option value="open">Open</option><option value="request">Request approval</option><option value="invite">Invite only</option></select></label>
      {error ? <p className="z-community-detail__error" role="alert">{error}</p> : null}<Button type="submit" variant="solid" disabled={create.isPending}>CREATE COMMUNITY</Button>
    </form> : null}
    {communities.isLoading ? <SpectrumLoader label="Loading communities" /> : null}
    {communities.isError ? <section className="z-communities__state"><h2>Communities could not load.</h2><button type="button" onClick={() => communities.refetch()}>TRY AGAIN</button></section> : null}
    {!communities.isLoading && !communities.isError && communities.data?.length === 0 ? <section className="z-communities__state"><h2>No public communities yet.</h2><p>Check back soon, or start a community.</p></section> : null}
    <section className="z-communities__grid" aria-label="Communities">
      {communities.data?.map(community => { const logo = communityLogo(community); return <article key={community.id} className="z-community-card">
        <Link href={`/z/${community.slug}`} className="z-community-card__link">
        <div className="z-community-card__image" style={logo ? { backgroundImage: `url(${logo})`, backgroundSize: community.slug === "yes-coach-productions" && (!community.imageUrl || community.imageUrl === "/directory-logos/Yes_Coach_Productions.png") ? "75% auto" : !community.imageUrl || logo === "/community-logos/pink-ponies.jpeg" ? "contain" : undefined, backgroundColor: !community.imageUrl && community.slug === "lesbian-culture-club" ? "#f5f1e9" : undefined } : undefined}>{!logo ? <span aria-hidden="true">Z/</span> : null}</div>
        <div className="z-community-card__body">
          <p className="z-community-card__address">z/{community.slug}</p><h2>{community.name}</h2><p>{community.description}</p>
          <div className="z-community-card__meta"><span>{community.memberCount} {community.memberCount === 1 ? "member" : "members"}</span>{community.neighborhood ? <span>{community.neighborhood}</span> : null}</div>
        </div>
        </Link>
        {community.isClaimable ? <div className="z-community-card__claim-area">
          {community.hasPendingClaim ? <span className="z-community-card__claim-pending">Claim pending review</span> : claimSlug === community.slug ? <form onSubmit={event => { event.preventDefault(); claim.mutate(); }}>
            <label htmlFor={`claim-${community.id}`}>How are you connected to {community.name}?</label>
            <textarea id={`claim-${community.id}`} value={claimReason} onChange={event => setClaimReason(event.target.value)} minLength={10} maxLength={500} required autoFocus />
            {claimError ? <p role="alert">{claimError}</p> : null}
            <div><button type="submit" disabled={claim.isPending}>SEND FOR REVIEW</button><button type="button" onClick={() => { setClaimSlug(null); setClaimReason(""); setClaimError(""); }}>CANCEL</button></div>
          </form> : <button type="button" className="z-community-card__claim" onClick={() => { if (!user) { setShowAuth(true); return; } setClaimSlug(community.slug); setClaimReason(""); setClaimError(""); }}>Claim me <ArrowRight size={14} aria-hidden="true" /></button>}
        </div> : null}
      </article>; })}
    </section>
    {showAuth ? <AuthModal onClose={() => setShowAuth(false)} /> : null}
  </div>;
}
