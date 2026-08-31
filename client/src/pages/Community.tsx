import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ds";
import SpectrumLoader from "@/components/SpectrumLoader";
import type { CommunityDetail } from "@shared/community";
import "./ZIndex.css";

export default function Community({ params }: { params: { communitySlug: string } }) {
  const slug = params.communitySlug.toLowerCase();
  const { user } = useAuth();
  const [postBody, setPostBody] = useState("");
  const [error, setError] = useState("");
  const key = `/api/communities/${encodeURIComponent(slug)}`;
  const community = useQuery<CommunityDetail>({ queryKey: [key], retry: false });
  usePageSeo(community.data ? `${community.data.name} | Z/ Communities` : "Z/ Community | Zaylist", community.data?.description || "A Zaylist community.");
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: [key] }); await queryClient.invalidateQueries({ queryKey: ["/api/communities"] }); };
  const membership = useMutation({
    mutationFn: async () => community.data?.viewerRole ? apiRequest("DELETE", `${key}/membership`) : apiRequest("POST", `${key}/join`, {}),
    onSuccess: refresh, onError: err => setError(parseApiError(err, "Membership could not be updated.")),
  });
  const post = useMutation({
    mutationFn: () => apiRequest("POST", `${key}/posts`, { body: postBody }),
    onSuccess: async () => { setPostBody(""); setError(""); await refresh(); },
    onError: err => setError(parseApiError(err, "Post could not be published.")),
  });
  if (community.isLoading) return <SpectrumLoader variant="full" label="Loading community" />;
  if (!community.data) return <div className="z-communities"><section className="z-communities__state"><h1>Community not found</h1><Link href="/z">BACK TO Z/</Link></section></div>;
  const item = community.data;
  return <div className="z-communities z-community-detail">
    <Link href="/z" className="z-community-detail__back">← ALL COMMUNITIES</Link>
    <header className="z-community-detail__hero">
      <div className="z-community-detail__image" style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}>{!item.imageUrl ? <span aria-hidden="true">Z/</span> : null}</div>
      <div><p className="z-community-card__address">z/{item.slug}</p><h1>{item.name}</h1><p>{item.description}</p><p className="z-community-detail__count">{item.memberCount} {item.memberCount === 1 ? "member" : "members"}</p>
        {user ? <Button onClick={() => membership.mutate()} disabled={membership.isPending} accent="cyan">{item.viewerRole ? "LEAVE COMMUNITY" : "JOIN COMMUNITY"}</Button> : <Link href="/dashboard"><Button as="span" accent="cyan">SIGN IN TO JOIN</Button></Link>}
      </div>
    </header>
    {error ? <p className="z-community-detail__error" role="alert">{error}</p> : null}
    <div className="z-community-detail__columns"><main><section className="z-community-panel"><h2>COMMUNITY POSTS</h2>
      {item.viewerRole ? <form onSubmit={event => { event.preventDefault(); post.mutate(); }} className="z-community-composer"><label htmlFor="community-post">Share with {item.name}</label><textarea id="community-post" value={postBody} onChange={event => setPostBody(event.target.value)} maxLength={2000} required/><Button type="submit" disabled={post.isPending || !postBody.trim()} variant="solid">POST</Button></form> : <p>Join this community to post.</p>}
      <div className="z-community-posts">{item.posts.length === 0 ? <p>No posts yet.</p> : item.posts.map(entry => <article key={entry.id}><Link href={`/u/${entry.author.username}`}>{entry.author.displayName || entry.author.username}</Link><p>{entry.body}</p><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString()}</time></article>)}</div>
    </section></main><aside>
      <section className="z-community-panel"><h2>RULES</h2><ol>{item.rules.map(rule => <li key={rule}>{rule}</li>)}</ol></section>
      <section className="z-community-panel"><h2>MODERATORS</h2>{item.moderators.length ? item.moderators.map(mod => <Link key={mod.id} href={`/u/${mod.username}`}>{mod.displayName || mod.username}</Link>) : <p>Managed by Zaylist until ownership is claimed.</p>}</section>
      <section className="z-community-panel"><h2>RELATED</h2>{item.related.place ? <Link href={item.related.place.url}>PLACE: {item.related.place.name}</Link> : null}{item.related.events.map(event => <Link key={event.id} href={event.url}>{event.title}</Link>)}{!item.related.place && item.related.events.length === 0 ? <p>No related products yet.</p> : null}</section>
    </aside></div>
  </div>;
}
