import { useState, type CSSProperties, type MouseEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bookmark, MessageCircle, Share2, ShieldAlert, Tag } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import { timeAgo } from "@/lib/boardFeed";

export type SellzInterest = { id: number; userId: number; note: string; offerCents?: number | null; status: string; username: string; displayName?: string | null };
export type SellzPost = {
  id: number; userId: number; title: string; description: string; category: string; condition: string;
  priceCents: number; negotiable: boolean; neighborhood: string; pickupPreference: string; photoUrls: string[];
  status: string; createdAt: string; expiresAt: string; interestCount: number; isMine: boolean; viewerSelected?: boolean;
  username: string; displayName?: string | null; posterPhotoUrl?: string | null; avatarChoice?: number; posterAvatarRing?: string | null;
  interests?: SellzInterest[];
};

const ACCENT = "#39ff14";
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

type Props = { post: SellzPost; expanded: boolean; saved: boolean; onToggle: () => void; onRequireAuth: () => void; onDeleted?: () => void };

export default function SellzListingCard({ post, expanded, saved, onToggle, onRequireAuth, onDeleted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("Is this available?");
  const [offer, setOffer] = useState("");
  const [report, setReport] = useState("");
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ title: post.title, description: post.description, category: post.category, condition: post.condition, price: String(post.priceCents / 100), negotiable: post.negotiable, neighborhood: post.neighborhood, pickupPreference: post.pickupPreference });
  const mutate = useMutation({
    mutationFn: async ({ path, method = "POST", body }: { path: string; method?: string; body?: any }) => {
      const r = await fetch(path, { method, credentials: "include", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || r.statusText);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellz"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sellz/saved/ids"] });
      toast({ title: "SELLZ updated" });
    },
    onError: (error: any) => toast({ title: "Could not update", description: error.message, variant: "destructive" }),
  });
  const act = (path: string, body?: any, method?: string) => {
    if (!user) return onRequireAuth();
    mutate.mutate({ path, body, method });
  };
  const share = async () => {
    const url = `${window.location.origin}/sellz?post=${post.id}`;
    if (navigator.share) await navigator.share({ title: post.title, url }).catch(() => {});
    else { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); }
  };
  const style = { "--listing-accent": ACCENT, "--c": ACCENT, "--_c": ACCENT } as CSSProperties;
  const isDemo = post.username === "hausing_demo";
  return (
    <article id={`sellz-post-${post.id}`} className={`board-listing-card board-listing-card--makeover board-listing-card--glass sellz-card${expanded ? " is-expanded" : ""}`} style={style} onClick={onToggle} role="button" tabIndex={0} onKeyDown={e => { if ((e.key === "Enter" || e.key === " ") && !(e.target as HTMLElement).matches("input,textarea,select,button")) { e.preventDefault(); onToggle(); } }}>
      {isDemo ? <span className="pdx-demo-sticker" aria-hidden="true">DEMO</span> : null}
      <div className="board-listing-card__row">
        <div className="board-listing-card__thumb" style={!post.photoUrls?.[0] ? { background: "linear-gradient(135deg,#39ff14,#0044ff)" } : undefined}>
          {post.photoUrls?.[0] ? <img src={post.photoUrls[0]} alt="" /> : <Tag size={54} aria-hidden="true" />}
          {post.photoUrls?.length > 1 ? <span className="board-listing-card__thumb-badge">▦ {post.photoUrls.length}</span> : null}
        </div>
        <div className="board-listing-card__main">
          <div className="board-listing-card__tags"><span className="board-listing-card__kind board-listing-card__kind--text">{post.category}</span><span className="board-listing-card__time">{timeAgo(post.createdAt)}</span></div>
          <h3 className="board-listing-card__title">{post.title}</h3>
          <div className="sellz-card__price">{money(post.priceCents)}{post.negotiable ? <small> OBO</small> : null}</div>
          <div className="board-listing-card__poster"><UserAvatar photoUrl={post.posterPhotoUrl} avatarChoice={post.avatarChoice} avatarRing={post.posterAvatarRing} displayName={post.displayName} username={post.username} href={memberProfileHref(post.username)} onClick={(e: MouseEvent) => e.stopPropagation()} size={18} /><span>@{post.username} · {post.neighborhood}</span></div>
          <div className="board-listing-card__footer"><span className="board-listing-card__status">{post.status === "RESERVED" ? "Reserved" : `${post.condition} · Available`}</span><span className="board-listing-card__cta">View →</span></div>
        </div>
      </div>
      {expanded ? <div className="board-listing-card__expand" onClick={e => e.stopPropagation()}>
        {post.photoUrls?.length ? <div className="gifting-photo-gallery">{post.photoUrls.map((url, i) => <img key={url} src={url} alt={`${post.title}, photo ${i + 1}`} />)}</div> : null}
        <p>{post.description}</p>
        <div className="gifting-details">{post.condition} · {post.pickupPreference} · {post.neighborhood}</div>
        <div className="gifting-listing-actions">
          <button type="button" onClick={share}><Share2 size={14} /> Share</button>
          <button type="button" onClick={() => act(`/api/sellz/${post.id}/save`)}><Bookmark size={14} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}</button>
        </div>
        {!post.isMine && post.status === "ACTIVE" ? <div className="gifting-response">
          <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} aria-label="Message to seller" />
          {post.negotiable ? <input className="board-text-field" inputMode="decimal" placeholder="Optional offer, $" value={offer} onChange={e => setOffer(e.target.value)} /> : null}
          <button type="button" onClick={() => act(`/api/sellz/${post.id}/interest`, { note, offer: offer || null })}><MessageCircle size={15} /> Message seller</button>
        </div> : null}
        {post.isMine ? <div className="gifting-owner-panel">
          <strong>Seller controls</strong>
          <div className="gifting-owner-actions">
            <button onClick={() => setEditing(value => !value)}>{editing ? "Cancel edit" : "Edit listing"}</button>
            {post.status === "ACTIVE" ? <button onClick={() => act(`/api/sellz/${post.id}/reserve`)}>Reserve</button> : <button onClick={() => act(`/api/sellz/${post.id}/reopen`)}>Reopen</button>}
            <button onClick={() => act(`/api/sellz/${post.id}/sold`)}>Mark sold</button>
            <button onClick={() => act(`/api/sellz/${post.id}/renew`)}>Renew 30 days</button>
            <button onClick={() => { if (confirm(`Delete ${post.title}?`)) act(`/api/sellz/${post.id}`, undefined, "DELETE"); onDeleted?.(); }}>Delete</button>
          </div>
          {editing ? <div className="gifting-response sellz-edit-form">
            <input className="board-text-field" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} aria-label="Listing title" />
            <textarea value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} aria-label="Listing description" />
            <input className="board-text-field" inputMode="decimal" value={edit.price} onChange={e => setEdit({ ...edit, price: e.target.value })} aria-label="Price" />
            <select className="board-text-field" value={edit.condition} onChange={e => setEdit({ ...edit, condition: e.target.value })} aria-label="Condition"><option>New</option><option>Like new</option><option>Good</option><option>Fair</option><option>For parts</option></select>
            <input className="board-text-field" value={edit.neighborhood} onChange={e => setEdit({ ...edit, neighborhood: e.target.value })} aria-label="Neighborhood" />
            <label><input type="checkbox" checked={edit.negotiable} onChange={e => setEdit({ ...edit, negotiable: e.target.checked })} /> Open to offers</label>
            <button onClick={() => { act(`/api/sellz/${post.id}`, edit, "PUT"); setEditing(false); }}>Save changes</button>
          </div> : null}
          {post.interests?.map(interest => <div className="gifting-interest" key={interest.id}><span><strong>@{interest.username}</strong> {interest.offerCents ? `offered ${money(interest.offerCents)}` : "asked"}: {interest.note}</span><button onClick={() => act(`/api/sellz/${post.id}/interests/${interest.id}/choose`)}>Choose buyer</button></div>)}
        </div> : <details className="gifting-report"><summary><ShieldAlert size={14} /> Report listing</summary><textarea value={report} onChange={e => setReport(e.target.value)} /><button onClick={() => act(`/api/sellz/${post.id}/report`, { reason: report })}>Send report</button></details>}
      </div> : null}
    </article>
  );
}
