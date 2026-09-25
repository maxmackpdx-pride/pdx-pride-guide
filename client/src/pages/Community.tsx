import { ArrowUpRight } from "lucide-react";
import PageRecovery from "@/components/PageRecovery";
import { useState } from "react";
import { ArrowBigDown, ArrowBigUp, ArrowLeft, CalendarDays, Check, MessageCircle, Plus, Search, Share2, SlidersHorizontal } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ds";
import SpectrumLoader from "@/components/SpectrumLoader";
import { communityLogo } from "@shared/communityLogos";
import { parsePacificDateTime } from "@shared/missedConnections";
import type { CommunityDetail, CommunityEvent, CommunityPost } from "@shared/community";
import RedgifsMedia from "@/components/RedgifsMedia";
import "./ZIndex.css";

export default function Community({ params }: { params: { communitySlug: string } }) {
  const slug = params.communitySlug.toLowerCase();
  const { user } = useAuth();
  const { toast } = useToast();
  const [postBody, setPostBody] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [feedTab, setFeedTab] = useState<"posts" | "upcoming" | "past">("posts");
  const [composerOpen, setComposerOpen] = useState(false);
  const [sort, setSort] = useState<"new" | "top" | "discussed">("new");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openReplies, setOpenReplies] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [managing, setManaging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [editPostBody, setEditPostBody] = useState("");
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostMediaUrl, setEditPostMediaUrl] = useState("");
  const [reportPostId, setReportPostId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [relationshipUrl, setRelationshipUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const key = `/api/communities/${encodeURIComponent(slug)}`;
  const community = useQuery<CommunityDetail>({ queryKey: [key], retry: false });
  const manage = useQuery<any>({ queryKey: [`${key}/manage`], enabled: managing });
  usePageSeo(community.data ? `${community.data.name} | Z/ Communities` : "Z/ Community | Zaylist", community.data?.description || "A Zaylist community.");
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: [key] }); await queryClient.invalidateQueries({ queryKey: ["/api/communities"] }); };
  const membership = useMutation({
    mutationFn: async () => community.data?.viewerRole ? apiRequest("DELETE", `${key}/membership`) : apiRequest("POST", `${key}/join`, {}),
    onSuccess: async () => { await refresh(); await queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] }); }, onError: err => setError(parseApiError(err, "Membership could not be updated.")),
  });
  const follow = useMutation({
    mutationFn: async (following: boolean) => apiRequest("PUT", `${key}/follow`, { following }),
    onSuccess: async () => { setError(""); await refresh(); await queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] }); },
    onError: err => setError(parseApiError(err, "Feed following could not be updated.")),
  });
  const post = useMutation({
    mutationFn: () => apiRequest("POST", `${key}/posts`, { title: postTitle, body: postBody, mediaUrl: postMediaUrl }),
    onSuccess: async () => { setPostTitle(""); setPostBody(""); setPostMediaUrl(""); setComposerOpen(false); setError(""); setSort("new"); await refresh(); await queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] }); },
    onError: err => setError(parseApiError(err, "Post could not be published.")),
  });
  const act = useMutation({
    mutationFn: async ({ method, path, body }: { method: "POST" | "PATCH" | "DELETE"; path: string; body?: any }) => apiRequest(method, `${key}${path}`, body),
    onSuccess: async (_response, action) => { if (action.path.endsWith("/report")) toast({ title: "Report sent", description: "Community moderators will review it." }); setError(""); setNotice(action.path.endsWith("/report") ? "Report sent. Community moderators will review it." : action.path.endsWith("/replies") ? "Reply posted." : "Changes saved."); setReplyTo(null); setReplyBody(""); setEditPostId(null); setReportPostId(null); setReportReason(""); await refresh(); await queryClient.invalidateQueries({ queryKey: [`${key}/manage`] }); await queryClient.invalidateQueries({ queryKey: ["/api/hub/feed"] }); },
    onError: err => setError(parseApiError(err, "Community action could not be completed.")),
  });
  const vote = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: -1 | 0 | 1 }) => apiRequest("PUT", `${key}/posts/${id}/vote`, { value }),
    onSuccess: refresh,
    onError: err => setError(parseApiError(err, "Vote could not be saved.")),
  });
  if (community.isLoading) return <SpectrumLoader variant="full" label="Loading community" />;
  if (!community.data) {
    const missing = /^(403|404):/.test(community.error?.message || "");
    return <PageRecovery section="Z/ List" title={missing ? "This community isn’t available." : "We couldn’t load this community."}
      description={missing ? "The link may have changed, or this community may be private. Explore Z/ List to find a community you can join." : "Your connection to this community was interrupted. Try again, or browse the community list."}
      href="/z" label="Explore Z/ List" missing={missing} retry={missing ? undefined : () => { void community.refetch(); }} />;
  }
  const item = community.data;
  const logo = communityLogo(item);
  const visiblePosts = item.posts.filter(entry => `${entry.title} ${entry.body} ${entry.author.displayName || ""} ${entry.author.username}`.toLowerCase().includes(searchTerm.trim().toLowerCase())).sort((a, b) => sort === "top" ? b.score - a.score || b.id - a.id : sort === "discussed" ? b.replies.length - a.replies.length || b.id - a.id : b.id - a.id);
  function renderEvent(entry: CommunityEvent) {
    const date=parsePacificDateTime(entry.dateStart);
    return <Link key={entry.id} href={entry.url} className="z-community-event"><div className="z-community-event__poster">{entry.posterImageUrl ? <img src={entry.posterImageUrl} alt="" loading="lazy"/> : <CalendarDays size={30}/>}</div><div><time dateTime={entry.dateStart}>{date==null ? entry.dateStart.slice(0,10) : new Date(date).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric",timeZone:"America/Los_Angeles"})}</time><h2>{entry.title}</h2><p>{entry.venueName}</p></div><span aria-hidden="true"><ArrowUpRight size={14} aria-hidden="true" /></span></Link>;
  }
  const share = async (url: string) => {
    try {
      if (navigator.share) await navigator.share({ title: item.name, url });
      else { await navigator.clipboard.writeText(url); setNotice("Link copied."); }
    } catch (err) { if ((err as Error).name !== "AbortError") setError("The link could not be shared."); }
  };
  const pageUrl = `${window.location.origin}/z/${item.slug}`;
  function voteButtons(entry: CommunityPost) {
    return <div className="z-community-votes" aria-label={`Score ${entry.score}`}>
      <button type="button" aria-label={`Upvote ${entry.author.username}'s post`} aria-pressed={entry.viewerVote === 1} disabled={!item.viewerRole || vote.isPending} onClick={() => vote.mutate({ id: entry.id, value: entry.viewerVote === 1 ? 0 : 1 })}><ArrowBigUp size={20}/></button>
      <span>{entry.score}</span>
      <button type="button" aria-label={`Downvote ${entry.author.username}'s post`} aria-pressed={entry.viewerVote === -1} disabled={!item.viewerRole || vote.isPending} onClick={() => vote.mutate({ id: entry.id, value: entry.viewerVote === -1 ? 0 : -1 })}><ArrowBigDown size={20}/></button>
    </div>;
  }
  function renderPost(entry: CommunityPost) {
    return <>
      <div className="z-community-post__byline"><Link href={`/u/${entry.author.username}`} className="z-community-post__avatar">{entry.author.photoUrl ? <img src={entry.author.photoUrl} alt=""/> : (entry.author.displayName || entry.author.username).slice(0, 1).toUpperCase()}</Link><Link href={`/u/${entry.author.username}`}>@{entry.author.username}</Link><span>·</span><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}{entry.updatedAt && entry.updatedAt !== entry.createdAt ? " · edited" : ""}</time></div>
      {editPostId === entry.id ? <form className="z-community-composer" onSubmit={event => { event.preventDefault(); act.mutate({ method: "PATCH", path: `/posts/${entry.id}`, body: { title: editPostTitle, body: editPostBody, mediaUrl: editPostMediaUrl } }); }}>
        {entry.title ? <label>Edit title<input value={editPostTitle} onChange={event => setEditPostTitle(event.target.value)} maxLength={160}/></label> : null}<label>Edit your message<textarea value={editPostBody} onChange={event => setEditPostBody(event.target.value)} maxLength={2000}/></label>{entry.mediaUrl ? <label>RedGIFs link<input type="url" value={editPostMediaUrl} onChange={event => setEditPostMediaUrl(event.target.value)} maxLength={500}/></label> : null}<div><Button type="submit" disabled={act.isPending || (!editPostTitle.trim() && !editPostBody.trim() && !editPostMediaUrl.trim())}>SAVE</Button><Button type="button" onClick={() => setEditPostId(null)}>CANCEL</Button></div>
      </form> : <>{entry.title ? <h2 className="z-community-post__title">{entry.title}</h2> : null}{entry.body ? <p className="z-community-post__body">{entry.body}</p> : null}{entry.mediaUrl ? <RedgifsMedia url={entry.mediaUrl} title={entry.title || "Community post"}/> : null}</>}
      <div className="z-community-post__actions">
        {entry.canEdit ? <button type="button" onClick={() => { setEditPostId(entry.id); setEditPostTitle(entry.title); setEditPostBody(entry.body); setEditPostMediaUrl(entry.mediaUrl||""); }}>Edit</button> : null}
        {entry.canEdit || entry.canModerate ? <button type="button" disabled={act.isPending} onClick={() => act.mutate({ method: "DELETE", path: `/posts/${entry.id}` })}>Remove</button> : null}
        {item.viewerRole && !entry.canEdit ? <button type="button" onClick={() => { setReportPostId(entry.id); setNotice(""); }}>Report</button> : null}
      </div>
      {reportPostId === entry.id ? <form onSubmit={event => { event.preventDefault(); act.mutate({ method: "POST", path: `/posts/${entry.id}/report`, body: { reason: reportReason } }); }}><label>Why are you reporting this message?<textarea value={reportReason} onChange={event => setReportReason(event.target.value)} minLength={5} maxLength={500} required/></label><Button type="submit" disabled={act.isPending}>SEND REPORT</Button><Button type="button" onClick={() => setReportPostId(null)}>CANCEL</Button></form> : null}
    </>;
  }
  return <div className="z-communities z-community-detail">
    <div className="z-community-detail__toolbar"><Link href="/z" className="z-community-detail__back"><ArrowLeft size={19}/> Z/ LIST</Link><div className="z-community-detail__tools"><button type="button" aria-label="Search posts" aria-expanded={searchOpen} onClick={() => { setFeedTab("posts"); setSearchOpen(value => !value); }}><Search size={19}/></button><button type="button" aria-label="Create post" onClick={() => { setFeedTab("posts"); setComposerOpen(true); document.querySelector(".z-community-feed__compose")?.scrollIntoView({ behavior: "smooth" }); }}><Plus size={20}/></button><button type="button" aria-label="Share community" onClick={() => void share(pageUrl)}><Share2 size={19}/></button></div></div>
    <header className="z-community-detail__hero">
      <div className="z-community-detail__image" style={logo ? { backgroundImage: `url(${logo})`, backgroundSize: item.slug === "yes-coach-productions" && (!item.imageUrl || item.imageUrl === "/directory-logos/Yes_Coach_Productions.png") ? "75% auto" : !item.imageUrl || logo === "/community-logos/pink-ponies.jpeg" ? "contain" : undefined, backgroundColor: !item.imageUrl && item.slug === "lesbian-culture-club" ? "#f5f1e9" : undefined } : undefined}>{!logo ? <span aria-hidden="true">Z/</span> : null}</div>
      <div className="z-community-detail__identity"><p className="z-community-card__address">z/{item.slug}</p><h1>{item.name}</h1><p className="z-community-detail__count">{item.memberCount} {item.memberCount === 1 ? "member" : "members"} · {item.posts.length} recent {item.posts.length === 1 ? "post" : "posts"}</p><p className="z-community-detail__description">{item.description}</p><div className="z-community-detail__membership">
        {user ? item.viewerMembershipStatus === "pending" ? <Button disabled accent="cyan">REQUEST PENDING</Button> : item.viewerRole === "owner" ? <p>You own this community. <button type="button" onClick={() => { setManaging(true); setTimeout(() => document.getElementById("community-members")?.scrollIntoView({ behavior: "smooth" }), 0); }}>Transfer ownership in Members</button> before leaving.</p> : <Button onClick={() => membership.mutate()} disabled={membership.isPending} accent="cyan">{item.viewerRole ? "LEAVE COMMUNITY" : item.membershipPolicy === "request" ? "REQUEST TO JOIN" : "JOIN COMMUNITY"}</Button> : <Link href="/dashboard"><Button as="span" accent="cyan">SIGN IN TO JOIN</Button></Link>}
        {item.viewerRole ? <button type="button" className="z-community-follow" aria-pressed={item.viewerFollowing} disabled={follow.isPending} onClick={() => follow.mutate(!item.viewerFollowing)}>{item.viewerFollowing ? <Check size={17}/> : <Plus size={17}/>} {item.viewerFollowing ? "Following feed" : "Follow feed"}</button> : null}
        {item.canManage ? <Button onClick={() => setManaging(value => !value)}>{managing ? "CLOSE MODERATOR DESK" : "MANAGE COMMUNITY"}</Button> : null}</div>
      </div>
    </header>
    {error ? <p className="z-community-detail__error" role="alert">{error}</p> : null}
    {notice ? <p role="status">{notice}</p> : null}
    <nav className="z-community-tabs" aria-label="Community content">{(["posts","upcoming","past"] as const).map(tab => <button type="button" key={tab} aria-current={feedTab===tab?"page":undefined} onClick={() => setFeedTab(tab)}>{tab==="posts"?"Posts":tab==="upcoming"?`Upcoming events (${item.events.upcoming.length})`:`Past events (${item.events.past.length})`}</button>)}</nav>
    {feedTab==="posts" ? <div className="z-community-feedbar"><label htmlFor="community-sort"><SlidersHorizontal size={18}/> POSTS</label><select id="community-sort" value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="new">New posts</option><option value="top">Top posts</option><option value="discussed">Most discussed</option></select><span>{visiblePosts.length} shown</span></div> : null}
    {feedTab==="posts"&&searchOpen ? <div className="z-community-search"><Search size={18}/><input type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search posts and authors" aria-label="Search community posts" autoFocus/></div> : null}
    <div className="z-community-detail__columns"><main className="z-community-feed"><section className="z-community-feed__compose">
      {feedTab==="posts" ? item.viewerRole ? composerOpen ? <form onSubmit={event => { event.preventDefault(); post.mutate(); }} className="z-community-composer"><label htmlFor="community-post-title">Title</label><input id="community-post-title" value={postTitle} onChange={event => setPostTitle(event.target.value)} maxLength={160} required autoFocus placeholder="Give your post a title"/><label htmlFor="community-post">Details (optional)</label><textarea id="community-post" value={postBody} onChange={event => setPostBody(event.target.value)} maxLength={2000} placeholder="What would you like to share?"/><div className="z-community-composer__media"><a href="https://www.redgifs.com/" target="_blank" rel="noopener noreferrer">Photos / videos <ArrowUpRight size={14} aria-hidden="true" /> RedGIFs</a><label htmlFor="community-post-media">Paste your RedGIFs link<input id="community-post-media" type="url" value={postMediaUrl} onChange={event => setPostMediaUrl(event.target.value)} maxLength={500} placeholder="https://www.redgifs.com/watch/…"/></label></div><div><Button type="submit" disabled={post.isPending || !postTitle.trim()} variant="solid">POST</Button><Button type="button" onClick={() => setComposerOpen(false)}>CANCEL</Button></div></form> : <div className="z-community-compose-actions"><button type="button" className="z-community-compose-trigger" onClick={() => setComposerOpen(true)}><Plus size={20}/> Share something with this community</button><a href="https://www.redgifs.com/" target="_blank" rel="noopener noreferrer">Photos / videos <ArrowUpRight size={14} aria-hidden="true" /></a></div> : <p>Join this community to post and vote.</p> : <p>{feedTab==="upcoming"?"Events connected to this community appear here.":"Past connected events appear here while their listings are retained."}</p>}
    </section>
      {feedTab==="posts" ? <div className="z-community-posts">{item.posts.length === 0 ? <p className="z-community-posts__empty">No posts yet. Start the conversation.</p> : visiblePosts.length === 0 ? <p className="z-community-posts__empty">No posts match your search.</p> : visiblePosts.map(entry => <article key={entry.id} id={`post-${entry.id}`}>
        {renderPost(entry)}
        <div className="z-community-post__engagement">{voteButtons(entry)}<button type="button" onClick={() => setOpenReplies(current => current === entry.id ? null : entry.id)} aria-expanded={openReplies === entry.id}><MessageCircle size={18}/> {entry.replies.length} {entry.replies.length === 1 ? "reply" : "replies"}</button><button type="button" onClick={() => void share(`${pageUrl}#post-${entry.id}`)}><Share2 size={18}/> Share</button></div>
        {openReplies === entry.id ? <div className="z-community-thread"><div className="z-community-replies" aria-label="Replies">{entry.replies.length ? entry.replies.map(reply => <div className="z-community-reply" key={reply.id}>{renderPost(reply)}{voteButtons(reply)}</div>) : <p>No replies yet.</p>}</div>
        {item.viewerRole ? replyTo === entry.id ? <form className="z-community-composer" onSubmit={event => { event.preventDefault(); act.mutate({ method: "POST", path: `/posts/${entry.id}/replies`, body: { body: replyBody } }); }}>
          <label htmlFor={`reply-${entry.id}`}>Reply to {entry.author.displayName || entry.author.username}</label><textarea id={`reply-${entry.id}`} value={replyBody} onChange={event => setReplyBody(event.target.value)} maxLength={2000} required/>
          <Button type="submit" disabled={act.isPending || !replyBody.trim()}>POST REPLY</Button><Button type="button" onClick={() => setReplyTo(null)}>CANCEL</Button>
        </form> : <button type="button" className="z-community-thread__reply" onClick={() => { setReplyTo(entry.id); setReplyBody(""); }}>Write a reply</button> : <p>Join this community to reply.</p>}</div> : null}
      </article>)}</div> : <div className="z-community-events">{(feedTab==="upcoming"?item.events.upcoming:item.events.past).length ? (feedTab==="upcoming"?item.events.upcoming:item.events.past).map(renderEvent) : <p className="z-community-posts__empty">{feedTab==="upcoming"?"No upcoming events connected yet.":"No past events connected yet."}</p>}</div>}
    </main><aside>
      <section className="z-community-panel"><h2>RULES</h2><ol>{item.rules.map(rule => <li key={rule}>{rule}</li>)}</ol></section>
      <section className="z-community-panel"><h2>MODERATORS</h2>{item.moderators.length ? item.moderators.map(mod => <Link key={mod.id} href={`/u/${mod.username}`}>{mod.displayName || mod.username}</Link>) : <p>Managed by Zaylist until ownership is claimed.</p>}</section>
      <section className="z-community-panel"><h2>RELATED PRODUCTS</h2>{item.related.map(entry => <Link key={`${entry.type}-${entry.id}`} href={entry.url}><strong>{entry.type === "event" ? "EVENTZ" : entry.type === "sellz" ? "SELLZ" : entry.type === "gig" ? "GIGZ" : entry.type === "place" ? "PLACE" : "GUIDE"}:</strong> {entry.name}</Link>)}{item.related.length === 0 ? <p>No related products yet.</p> : null}</section>
    </aside></div>
    {managing ? <section className="z-community-panel z-community-manage"><h2>MODERATOR DESK</h2>
      <Button onClick={() => setEditing(value => !value)}>{editing ? "CLOSE EDITOR" : "EDIT COMMUNITY"}</Button>
      {editing ? <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); act.mutate({ method: "PATCH", path: "", body: { name: form.get("name"), description: form.get("description"), neighborhood: form.get("neighborhood"), visibility: form.get("visibility"), membershipPolicy: form.get("membershipPolicy"), rules: String(form.get("rules") || "").split("\n").filter(Boolean) } }); }}><label>Name<input name="name" defaultValue={item.name} required/></label><label>Description<textarea name="description" defaultValue={item.description} required/></label><label>Neighborhood<input name="neighborhood" defaultValue={item.neighborhood || ""}/></label><label>Visibility<select name="visibility" defaultValue={item.visibility}><option value="public">Public</option><option value="discoverable">Discoverable</option><option value="private">Private</option></select></label><p className="z-community-visibility-help">Public and Discoverable communities appear in search and the directory; anyone can read their posts. Private communities are hidden from nonmembers, and only active members can read their posts. Joining rules are set separately.</p><label>Joining<select name="membershipPolicy" defaultValue={item.membershipPolicy}><option value="open">Open</option><option value="request">Request approval</option><option value="invite">Invite only</option></select></label><label>Rules, one per line<textarea name="rules" defaultValue={item.rules.join("\n")}/></label><Button type="submit" variant="solid">SAVE COMMUNITY</Button></form> : null}
      <h3 id="community-members">MEMBERS</h3>{item.viewerRole === "owner" && !manage.data?.members?.some((member: any) => member.role !== "owner" && member.status === "active") ? <p>Ownership can be transferred to another active member. Once someone joins, their transfer action appears here.</p> : null}{manage.isLoading ? <p>Loading moderator tools…</p> : manage.data?.members?.map((member: any) => <div className="z-community-manage__row" key={member.id}><span><strong>@{member.username}</strong> · {member.role} · {member.status}</span>{member.role !== "owner" ? <span>{member.status === "pending" ? <button onClick={() => act.mutate({ method: "PATCH", path: `/members/${member.id}`, body: { status: "active" } })}>Approve</button> : null}<button onClick={() => act.mutate({ method: "PATCH", path: `/members/${member.id}`, body: { status: "removed" } })}>Remove</button>{item.viewerRole === "owner" ? <><button onClick={() => act.mutate({ method: "PATCH", path: `/members/${member.id}`, body: { role: member.role === "moderator" ? "member" : "moderator" } })}>{member.role === "moderator" ? "Remove moderator" : "Make moderator"}</button>{member.status === "active" ? <button onClick={() => act.mutate({ method: "POST", path: "/transfer-ownership", body: { userId: member.id } })}>Transfer ownership</button> : null}</> : null}</span> : null}</div>)}
      <h3>RELATED LINKS</h3><form onSubmit={event => { event.preventDefault(); act.mutate({ method: "POST", path: "/relationships", body: { url: relationshipUrl } }); }}><label>Zaylist link<input value={relationshipUrl} onChange={event => setRelationshipUrl(event.target.value)} placeholder="https://www.zaylist.com/events/…" required aria-describedby="community-related-help"/></label><p id="community-related-help">Open an event, place, listing, or OUTZ guide and paste its Zaylist page link here. For SELLZ or GIGZ, use the listing’s share link.</p><Button type="submit" disabled={act.isPending || !relationshipUrl.trim()}>CONNECT</Button></form>{manage.data?.relationships?.map((entry: any) => <div className="z-community-manage__row" key={`${entry.type}-${entry.id}`}><Link href={entry.url}>{entry.name}</Link>{entry.relationshipType === "related" ? <button onClick={() => act.mutate({ method: "DELETE", path: `/relationships/${entry.type}/${entry.id}` })}>Disconnect</button> : null}</div>)}
      <h3>REPORTS</h3>{manage.data?.reports?.length ? manage.data.reports.map((report: any) => <div className="z-community-manage__row" key={report.id}><span>Post {report.post_id} · @{report.reporterUsername}: {report.reason} · {report.status}</span>{report.status === "pending" ? <span><button onClick={() => act.mutate({ method: "PATCH", path: `/reports/${report.id}`, body: { status: "actioned" } })}>Actioned</button><button onClick={() => act.mutate({ method: "PATCH", path: `/reports/${report.id}`, body: { status: "dismissed" } })}>Dismiss</button></span> : null}</div>) : <p>No reports.</p>}
      <details><summary>Moderation audit history</summary>{manage.data?.audit?.map((entry: any) => <p key={entry.id}><time>{new Date(entry.created_at).toLocaleString()}</time> · @{entry.actorUsername} · {entry.action} · {entry.target_type} {entry.target_id || ""}</p>)}</details>
    </section> : null}
  </div>;
}
