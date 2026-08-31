import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ds";
import SpectrumLoader from "@/components/SpectrumLoader";
import type { CommunitySummary } from "@shared/community";
import "./ZIndex.css";

export default function ZIndex() {
  usePageSeo("Z/ Communities | Zaylist", "Find Portland queer communities, their rules, people, posts, and related EVENTZ.");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ name: "", description: "", neighborhood: "", visibility: "public", membershipPolicy: "open" });
  const communities = useQuery<CommunitySummary[]>({ queryKey: ["/api/communities"] });
  const create = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/communities", draft)).json(),
    onSuccess: async (item: CommunitySummary) => { await queryClient.invalidateQueries({ queryKey: ["/api/communities"] }); navigate(`/z/${item.slug}`); },
    onError: err => setError(parseApiError(err, "Community could not be created.")),
  });
  return <div className="z-communities">
    <header className="z-communities__hero">
      <p className="z-communities__eyebrow">ZAYLIST COMMUNITIES</p>
      <h1><span>Z/</span> IS WHERE PEOPLE BELONG</h1>
      <p>Products help you find things. Communities connect you with the people, rules, conversations, and gatherings around them.</p>
      {user ? <Button accent="cyan" onClick={() => setCreating(value => !value)} aria-expanded={creating} aria-controls="z-community-create">{creating ? "CANCEL" : "CREATE A COMMUNITY"}</Button> : <Link href="/dashboard"><Button as="span" accent="cyan">SIGN IN TO CREATE</Button></Link>}
    </header>
    {creating ? <form id="z-community-create" className="z-community-panel z-community-create" onSubmit={event => { event.preventDefault(); create.mutate(); }} aria-busy={create.isPending}>
      <h2>CREATE A COMMUNITY</h2><p>The creator becomes the owner and is responsible for rules and moderation.</p>
      <label>Name<input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} minLength={3} maxLength={100} required /></label>
      <label>Description<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} minLength={10} maxLength={1200} required /></label>
      <label>Neighborhood<input value={draft.neighborhood} onChange={event => setDraft({ ...draft, neighborhood: event.target.value })} maxLength={100} /></label>
      <label>Visibility<select value={draft.visibility} onChange={event => setDraft({ ...draft, visibility: event.target.value })}><option value="public">Public</option><option value="discoverable">Discoverable</option><option value="private">Private</option></select></label>
      <label>Joining<select value={draft.membershipPolicy} onChange={event => setDraft({ ...draft, membershipPolicy: event.target.value })}><option value="open">Open</option><option value="request">Request approval</option><option value="invite">Invite only</option></select></label>
      {error ? <p className="z-community-detail__error" role="alert">{error}</p> : null}<Button type="submit" variant="solid" disabled={create.isPending}>CREATE COMMUNITY</Button>
    </form> : null}
    {communities.isLoading ? <SpectrumLoader label="Loading communities" /> : null}
    {communities.isError ? <section className="z-communities__state"><h2>Communities could not load.</h2><button type="button" onClick={() => communities.refetch()}>TRY AGAIN</button></section> : null}
    {!communities.isLoading && !communities.isError && communities.data?.length === 0 ? <section className="z-communities__state"><h2>The doors are being set.</h2><p>No public communities are ready yet. Nothing fake is being shown in their place.</p></section> : null}
    <section className="z-communities__grid" aria-label="Communities">
      {communities.data?.map(community => <Link key={community.id} href={`/z/${community.slug}`} className="z-community-card">
        <div className="z-community-card__image" style={community.imageUrl ? { backgroundImage: `url(${community.imageUrl})` } : undefined}>{!community.imageUrl ? <span aria-hidden="true">Z/</span> : null}</div>
        <div className="z-community-card__body">
          <p className="z-community-card__address">z/{community.slug}</p><h2>{community.name}</h2><p>{community.description}</p>
          <div className="z-community-card__meta"><span>{community.memberCount} {community.memberCount === 1 ? "member" : "members"}</span>{community.neighborhood ? <span>{community.neighborhood}</span> : null}</div>
        </div>
      </Link>)}
    </section>
  </div>;
}
