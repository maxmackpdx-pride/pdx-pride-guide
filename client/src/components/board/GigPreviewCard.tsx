import type { CSSProperties } from "react";
import type { GigPost } from "@/pages/PrideWork";
import { MapPin, ArrowUpRight, Zap } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { ResourceCardMotif } from "@/components/resources/ResourceCardMotif";
import { timeAgo } from "@/lib/timeAgo";
// Share the actual Gigz board material rather than create an embedded-card variant.
import "@/pages/PrideWork.css";
export type GigPreviewPost = Pick<GigPost,"id"|"title"|"postType"|"createdAt"> & Partial<GigPost>;
export default function GigPreviewCard({post,selected=false,onOpen}:{post:GigPreviewPost;selected?:boolean;onOpen:()=>void}) {
 const isTalent=post.postType === "LOOKING_FOR_WORK";
 const poster=post.displayName || post.name || "Talent available";
return isTalent ? <button type="button" className="gigz-talent" style={{ "--gigz-accent": "var(--room-gigz)" } as CSSProperties} onClick={onOpen} aria-expanded={selected} aria-label={`View ${poster}: ${post.title}`}>
              <ResourceCardMotif name={post.title} category="money" />
              <span className="gigz-talent__status"><span><i /> Available for gigs</span><small>{post.isDemo ? "DEMO LISTING" : `Posted ${timeAgo(post.createdAt)}`}</small></span>
              {post.username?.toLowerCase() !== "tucker_pdmax" && <span className="gigz-talent__portrait">{post.posterPhotoUrl || post.imageUrl ? <img src={post.posterPhotoUrl || post.imageUrl || ""} alt="" loading="lazy" /> : <UserAvatar photoUrl={post.posterPhotoUrl} avatarChoice={post.avatarChoice} avatarRing={post.posterAvatarRing} displayName={poster} username={post.username} size={150} />}</span>}
              <strong>{poster}</strong><span className="gigz-talent__role">{post.title}</span>
              <span className="gigz-talent__location"><MapPin size={14} /> {post.isRemote ? "Remote" : post.location || "Portland"}</span>
              <span className="gigz-talent__hire">View and message <ArrowUpRight size={18} /></span>
              <span className="gigz-talent__caption"><Zap size={15} /> {post.compensation || post.skills || "Available for work"}</span>
            </button> : <button type="button" className="gigz-opportunity" style={{ "--gigz-accent": "var(--room-gigz)" } as CSSProperties} onClick={onOpen} aria-expanded={selected} aria-label={`View gig: ${post.title}`}>
              <ResourceCardMotif name={post.title} category="arts" />
              {post.imageUrl ? <img src={post.imageUrl} alt="" loading="lazy" /> : <span className="gigz-opportunity__fallback" aria-hidden="true">GIGZ</span>}
              <span className="gigz-opportunity__shade" />
              <span className="gigz-opportunity__top"><span><em>{post.skills?.split(",")[0]?.trim() || "OPPORTUNITY"}</em><small>{post.isDemo ? "DEMO LISTING" : `Gig posted · ${timeAgo(post.createdAt)}`}</small></span><span className="gigz-opportunity__arrow"><ArrowUpRight size={20} /></span></span>
              <span className="gigz-opportunity__bottom"><strong>{post.title}</strong><span>{post.isRemote ? "Remote" : post.location || "Portland"}{post.gigDate ? ` · ${post.gigDate}${post.gigTime ? ` · ${post.gigTime}` : ""}` : ""}</span><em>{post.compensation || "Pay not listed"}</em></span>
            </button>;
}
