import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, parseApiError, queryClient } from "@/lib/queryClient";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ds";
import SpectrumLoader from "@/components/SpectrumLoader";
import { resolveDirectoryLogo } from "@/lib/directoryLogos";
import type { CommunityDetail, CommunityPost } from "@shared/community";
import "./ZIndex.css";

export default function Community({ params }: { params: { communitySlug: string } }) {
  const slug = params.communitySlug.toLowerCase();
  const { user } = useAuth();
  const { toast } = useToast();
  const [postBody, setPostBody] = useState("");
  const [error, setError] = useState("");
  const [managing, setManaging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [editPostBody, setEditPostBody] = useState("");
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
    onSuccess: refresh, onError: err => setError(parseApiError(err, "Membership could not be updated.")),
  });
  const post = useMutation({
    mutationFn: () => apiRequest("POST", `${key}/posts`, { body: postBody }),
    onSuccess: async () => { setPostBody(""); setError(""); await refresh(); },
    onError: err => setError(parseApiError(err, "Post could not be published.")),
  });
  const act = useMutation({
    mutationFn: async ({ method, path, body }: { method: "POST" | "PATCH" | "DELETE"; path: string; body?: any }) => apiRequest(method, `${key}${path}`, body),
    onSuccess: async (_response, action) => { if (action.path.endsWith("/report")) toast({ title: "Report sent", description: "Community moderators will review it." }); setError(""); setNotice(action.path.endsWith("/report") ? "Report sent. Community moderators will review it." : action.path.endsWith("/replies") ? "Reply posted." : "Changes saved."); setReplyTo(null); setReplyBody(""); setEditPostId(null); setReportPostId(null); setReportReason(""); await refresh(); await queryClient.invalidateQueries({ queryKey: [`${key}/manage`] }); },
    onError: err => setError(parseApiError(err, "Community action could not be completed.")),
  });
  if (community.isLoading) return <SpectrumLoader variant="full" label="Loading community" />;
  if (!community.data) return <div className="z-communities"><section className="z-communities__state"><h1>Community not found</h1><Link href="/z">BACK TO Z/</Link></section></div>;
  const item = community.data;
  const communityLogo = item.imageUrl || (item.sourcePlaceId ? resolveDirectoryLogo(item.name) : null);
  function renderPost(entry: CommunityPost) {
    return <>
      <Link href={`/u/${entry.author.username}`}>{entry.author.displayName || entry.author.username}</Link>
      {editPostId === entry.id ? <form onSubmit={event => { event.preventDefault(); act.mutate({ method: "PATCH", path: `/posts/${entry.id}`, body: { body: editPostBody } }); }}>
        <label>Edit your message<textarea value={editPostBody} onChange={event => setEditPostBody(event.target.value)} maxLength={2000} required/></label><Button type="submit" disabled={act.isPending || !editPostBody.trim()}>SAVE</Button><Button type="button" onClick={() => setEditPostId(null)}>CANCEL</Button>
      </form> : <p>{entry.body}</p>}
      <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString()}{entry.updatedAt && entry.updatedAt !== entry.createdAt ? " · edited" : ""}</time>
      <div className="z-community-post__actions">
        {entry.canEdit ? <button type="button" onClick={() => { setEditPostId(entry.id); setEditPostBody(entry.body); }}>Edit</button> : null}
        {entry.canEdit || entry.canModerate ? <button type="button" disabled={act.isPending} onClick={() => act.mutate({ method: "DELETE", path: `/posts/${entry.id}` })}>Remove</button> : null}
        {item.viewerRole && !entry.canEdit ? <button type="button" onClick={() => { setReportPostId(entry.id); setNotice(""); }}>Report</button> : null}
      </div>
      {reportPostId === entry.id ? <form onSubmit={event => { event.preventDefault(); act.mutate({ method: "POST", path: `/posts/${entry.id}/report`, body: { reason: reportReason } }); }}><label>Why are you reporting this message?<textarea value={reportReason} onChange={event => setReportReason(event.target.value)} minLength={5} maxLength={500} required/></label><Button type="submit" disabled={act.isPending}>SEND REPORT</Button><Button type="button" onClick={() => setReportPostId(null)}>CANCEL</Button></form> : null}
    </>;
  }
  return <div className="z-communities z-community-detail">
    <Link href="/z" className="z-community-detail__back">← ALL COMMUNITIES</Link>
    <header className="z-community-detail__hero">
      <div className="z-community-detail__image" style={communityLogo ? { backgroundImage: `url(${communityLogo})` } : undefined}>{!communityLogo ? <span aria-hidden="true">Z/</span> : null}</div>
      <div><p className="z-community-card__address">z/{item.slug}</p><h1>{item.name}</h1><p>{item.description}</p><p className="z-community-detail__count">{item.memberCount} {item.memberCount === 1 ? "member" : "members"}</p>
        {user ? item.viewerMembershipStatus === "pending" ? <Button disabled accent="cyan">REQUEST PENDING</Button> : item.viewerRole === "owner" ? <p>You own this community. <button type="button" onClick={() => { setManaging(true); setTimeout(() => document.getElementById("community-members")?.scrollIntoView({ behavior: "smooth" }), 0); }}>Transfer ownership in Members</button> before leaving.</p> : <Button onClick={() => membership.mutate()} disabled={membership.isPending} accent="cyan">{item.viewerRole ? "LEAVE COMMUNITY" : item.membershipPolicy === "request" ? "REQUEST TO JOIN" : "JOIN COMMUNITY"}</Button> : <Link href="/dashboard"><Button as="span" accent="cyan">SIGN IN TO JOIN</Button></Link>}
        {item.canManage ? <Button onClick={() => setManaging(value => !value)}>{managing ? "CLOSE MODERATOR DESK" : "MANAGE COMMUNITY"}</Button> : null}
      </div>
    </header>
    {error ? <p className="z-community-detail__error" role="alert">{error}</p> : null}
    {notice ? <p role="status">{notice}</p> : null}
    <div className="z-community-detail__columns"><main><section className="z-community-panel"><h2>COMMUNITY POSTS</h2>
      {item.viewerRole ? <form onSubmit={event => { event.preventDefault(); post.mutate(); }} className="z-community-composer"><label htmlFor="community-post">Share with {item.name}</label><textarea id="community-post" value={postBody} onChange={event => setPostBody(event.target.value)} maxLength={2000} required/><Button type="submit" disabled={post.isPending || !postBody.trim()} variant="solid">POST</Button></form> : <p>Join this community to post.</p>}
      <div className="z-community-posts">{item.posts.length === 0 ? <p>No posts yet.</p> : item.posts.map(entry => <article key={entry.id}>
        {renderPost(entry)}
        <div className="z-community-replies" aria-label="Replies">{entry.replies?.map(reply => <div className="z-community-reply" key={reply.id}>{renderPost(reply)}</div>)}</div>
        {item.viewerRole ? replyTo === entry.id ? <form className="z-community-composer" onSubmit={event => { event.preventDefault(); act.mutate({ method: "POST", path: `/posts/${entry.id}/replies`, body: { body: replyBody } }); }}>
          <label htmlFor={`reply-${entry.id}`}>Reply to {entry.author.displayName || entry.author.username}</label><textarea id={`reply-${entry.id}`} value={replyBody} onChange={event => setReplyBody(event.target.value)} maxLength={2000} required/>
          <Button type="submit" disabled={act.isPending || !replyBody.trim()}>POST REPLY</Button><Button type="button" onClick={() => setReplyTo(null)}>CANCEL</Button>
        </form> : <button type="button" onClick={() => { setReplyTo(entry.id); setReplyBody(""); }}>Reply{entry.replies?.length ? ` (${entry.replies.length})` : ""}</button> : null}
      </article>)}</div>
    </section></main><aside>
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
