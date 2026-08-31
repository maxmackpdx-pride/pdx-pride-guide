import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { usePageSeo } from "@/hooks/usePageSeo";
import SpectrumLoader from "@/components/SpectrumLoader";
import type { CommunitySummary } from "@shared/community";
import "./ZIndex.css";

export default function ZIndex() {
  usePageSeo("Z/ Communities | Zaylist", "Find Portland queer communities, their rules, people, posts, and related events.");
  const communities = useQuery<CommunitySummary[]>({ queryKey: ["/api/communities"] });
  return <div className="z-communities">
    <header className="z-communities__hero">
      <p className="z-communities__eyebrow">ZAYLIST COMMUNITIES</p>
      <h1><span>Z/</span> IS WHERE PEOPLE BELONG</h1>
      <p>Products help you find things. Communities connect you with the people, rules, conversations, and gatherings around them.</p>
    </header>
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
