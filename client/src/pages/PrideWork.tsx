import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, MapPin, Plus, Share2, Trash2, X, Zap } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import BoardFeedSkeleton from "@/components/BoardFeedSkeleton";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import { Button } from "@/components/ds";
import ImageUploader from "@/components/ImageUploader";
import { timeAgo } from "@/lib/boardFeed";
import { usePageSeo } from "@/hooks/usePageSeo";
import { GIG_BOARD_RULES_SUMMARY, validateGigPostContent } from "@shared/boardModeration";
import type { Business } from "@/pages/Directory";
import { BoardGlassMotif } from "@/components/board/GiftListingCard";
import type { CSSProperties } from "react";
import { shareCardUrl } from "@shared/shareCards";
import SafetyGuide from "@/components/SafetyGuide";
import { trackProductEvent } from "@/lib/analytics";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import "./PrideWork.css";

const gigSchema = z.object({
  postType: z.enum(["LOOKING_FOR_WORK", "POSTING_GIG"]),
  name: z.string().min(2, "Name required"),
  contactEmail: z.string().email("Valid email required"),
  title: z.string().min(3, "Title required"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  skills: z.string().optional(),
  compensation: z.string().optional(),
  location: z.string().optional(),
  isRemote: z.boolean().optional(),
  gigDate: z.string().optional(),
  gigTime: z.string().optional(),
  businessId: z.number().nullable().optional(),
  imageUrl: z.string().optional(),
});

const newBusinessSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Name required"),
  type: z.enum(["bar", "restaurant", "cafe", "venue", "service", "shop", "hotel", "nonprofit", "healthcare", "realestate", "group", "campground"]),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  address: z.string().trim().max(200).optional(),
  neighborhood: z.string().trim().max(80).optional(),
  hours: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(80).optional(),
  logoImageUrl: z.string().trim().max(300).optional(),
});

const DIACRITIC_MARKS = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g");
function normalizeVenueQuery(v: string): string {
  return v.toLowerCase().normalize("NFKD").replace(DIACRITIC_MARKS, "").replace(/[^a-z0-9]+/g, " ").trim();
}

type GigFormData = z.infer<typeof gigSchema>;

export type GigPost = {
  id: number;
  postType: "LOOKING_FOR_WORK" | "POSTING_GIG";
  name: string;
  title: string;
  description: string;
  skills: string | null;
  compensation: string | null;
  location: string | null;
  isRemote: boolean | null;
  status: string;
  createdAt: string;
  userId?: number | null;
  imageUrl?: string | null;
  username?: string;
  displayName?: string | null;
  posterPhotoUrl?: string | null;
  avatarChoice?: number;
  posterAvatarRing?: string | null;
  isMine?: boolean;
  gigDate?: string | null;
  gigTime?: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  LOOKING_FOR_WORK: "Talent available",
  POSTING_GIG: "Gig posted",
};

function GigRail({ posts, kind, selected, onSelect }: {
  posts: GigPost[]; kind: "gigs" | "talent"; selected: number | null; onSelect: (id: number) => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  useEffect(() => {
    if (!api) return;
    const update = () => { setCanPrev(api.canScrollPrev()); setCanNext(api.canScrollNext()); };
    update(); api.on("select", update); api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);
  return <>
    <Carousel setApi={setApi} opts={{ align: "start", dragFree: true, direction: "rtl" }} className="gigz-rail" dir="rtl">
      <CarouselContent className="gigz-rail__track">
        {posts.map((post, index) => {
          const isTalent = kind === "talent";
          const poster = post.displayName || post.name;
          return <CarouselItem key={post.id} className="gigz-rail__item" dir="ltr">
            {isTalent ? <button type="button" className="gigz-talent" style={{ "--gigz-accent": ["#b984ff", "#bbff54", "#ff8bb8", "#8edfff"][index % 4] } as CSSProperties} onClick={() => onSelect(post.id)} aria-expanded={selected === post.id} aria-label={`View ${poster}: ${post.title}`}>
              <span className="gigz-talent__status"><span><i /> Available for gigs</span><small>Posted {timeAgo(post.createdAt)}</small></span>
              <span className="gigz-talent__portrait">{post.posterPhotoUrl || post.imageUrl ? <img src={post.posterPhotoUrl || post.imageUrl || ""} alt="" loading="lazy" /> : <UserAvatar photoUrl={post.posterPhotoUrl} avatarChoice={post.avatarChoice} avatarRing={post.posterAvatarRing} displayName={poster} username={post.username} size={150} />}</span>
              <strong>{poster}</strong><span className="gigz-talent__role">{post.title}</span>
              <span className="gigz-talent__location"><MapPin size={14} /> {post.isRemote ? "Remote" : post.location || "Portland"}</span>
              <span className="gigz-talent__hire">View and message <ArrowUpRight size={18} /></span>
              <span className="gigz-talent__caption"><Zap size={15} /> {post.compensation || post.skills || "Available for work"}</span>
            </button> : <button type="button" className="gigz-opportunity" style={{ "--gigz-accent": ["#bb8aff", "#75c9ef", "#ffb477", "#f39ace", "#c7fa89"][index % 5] } as CSSProperties} onClick={() => onSelect(post.id)} aria-expanded={selected === post.id} aria-label={`View gig: ${post.title}`}>
              {post.imageUrl ? <img src={post.imageUrl} alt="" loading="lazy" /> : <span className="gigz-opportunity__fallback" aria-hidden="true">GIGZ</span>}
              <span className="gigz-opportunity__shade" />
              <span className="gigz-opportunity__top"><span><em>{post.skills?.split(",")[0]?.trim() || "OPPORTUNITY"}</em><small>Gig posted · {timeAgo(post.createdAt)}</small></span><span className="gigz-opportunity__arrow"><ArrowUpRight size={20} /></span></span>
              <span className="gigz-opportunity__bottom"><strong>{post.title}</strong><span>{post.isRemote ? "Remote" : post.location || "Portland"}{post.gigDate ? ` · ${post.gigDate}${post.gigTime ? ` · ${post.gigTime}` : ""}` : ""}</span><em>{post.compensation || "Pay not listed"}</em></span>
            </button>}
          </CarouselItem>;
        })}
      </CarouselContent>
    </Carousel>
    <div className="gigz-rail__controls"><span>SWIPE TO EXPLORE <ArrowLeft size={15} /></span><div><button type="button" onClick={() => api?.scrollPrev()} disabled={!canPrev} aria-label={`Previous ${kind}`}><ArrowRight size={18} /></button><button type="button" onClick={() => api?.scrollNext()} disabled={!canNext} aria-label={`Next ${kind}`}><ArrowLeft size={18} /></button></div></div>
  </>;
}

export default function PrideWork() {
  usePageSeo("GIGZ: Jobs & gigs | Zaylist", "Find gigs and workers for Portland nights. Post or browse GIGZ.", { image: shareCardUrl("prideWork"), imageAlt: "GIGZ on Zaylist" });
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [composeType, setComposeType] = useState<GigFormData["postType"]>("POSTING_GIG");
  const [showAuth, setShowAuth] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(new URLSearchParams(window.location.search).get("post")) || null);
  const [search, setSearch] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [onlyMine, setOnlyMine] = useState(() => new URLSearchParams(window.location.search).get("mine") === "1");
  const { data: gigs = [], isLoading, isError } = useQuery<GigPost[]>({
    queryKey: ["/api/gigs", onlyMine],
    queryFn: async () => { const r = await fetch(`/api/gigs${onlyMine ? "?mine=1" : ""}`, { credentials: "include" }); if (!r.ok) throw new Error("Could not load Gigz"); return r.json(); },
  });
  const openForm = (type: GigFormData["postType"]) => {
    if (!user) { setShowAuth(true); return; }
    setComposeType(type); setFormOpen(true);
    window.setTimeout(() => document.getElementById("gigs-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  };
  const visible = useMemo(() => gigs.filter(g => (!remoteOnly || g.isRemote) && (!onlyMine || g.isMine) && (!search.trim() || [g.title, g.description, g.name, g.skills, g.location, g.compensation].some(v => v?.toLowerCase().includes(search.trim().toLowerCase())))), [gigs, remoteOnly, onlyMine, search]);
  const opportunities = visible.filter(g => g.postType === "POSTING_GIG" && g.status === "LIVE");
  const talent = visible.filter(g => g.postType === "LOOKING_FOR_WORK" && g.status === "LIVE");
  const selected = gigs.find(g => g.id === selectedId);
  const select = (id: number) => { setSelectedId(id); window.history.replaceState(null, "", `/pride-work?post=${id}`); window.setTimeout(() => document.getElementById("gigz-detail")?.scrollIntoView({ behavior: "smooth", block: "center" }), 40); };
  return <main className="gigz-page">
    <div className="gigz-shell">
      <div className="gigz-identity"><img src="/brand/family/gigz.svg" alt="Gigz" /><span>Work with your people.</span></div>
      <div className="gigz-section-head"><div><div className="gigz-eyebrow">THE BOARD</div><h1>Gigz worth showing up for<span>.</span></h1><p>Find the next project, shift, or collaboration.</p></div><button type="button" className="gigz-post" onClick={() => openForm("POSTING_GIG")}><Plus size={17} /> Post a gig <ArrowUpRight size={16} /></button></div>
      <div className="gigz-filter"><label>Search Gigz<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles, skills, gigs" /></label><label><input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} /> Remote only</label>{user && <label><input type="checkbox" checked={onlyMine} onChange={e => setOnlyMine(e.target.checked)} /> My Gigz</label>}</div>
      {isLoading ? <BoardFeedSkeleton label="Loading Gigz posts" shape="board" count={3} /> : isError ? <div className="gigz-empty" role="alert">Could not load posts. <button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gigs"] })}>Try again</button></div> : opportunities.length ? <GigRail posts={opportunities} kind="gigs" selected={selectedId} onSelect={select} /> : <div className="gigz-empty">No open gigs yet. <button onClick={() => openForm("POSTING_GIG")}>Post a gig</button></div>}
      <div className="gigz-talent-zone"><div className="gigz-section-head"><div><div className="gigz-eyebrow">THE PEOPLE</div><h2>Available to hire<span>.</span></h2><p>Meet people ready to bring your next idea to life.</p></div><button type="button" className="gigz-post" onClick={() => openForm("LOOKING_FOR_WORK")}><Plus size={17} /> Post your availability <ArrowUpRight size={16} /></button></div>
        {!isLoading && !isError && (talent.length ? <GigRail posts={talent} kind="talent" selected={selectedId} onSelect={select} /> : <div className="gigz-empty">No one has posted availability yet. <button onClick={() => openForm("LOOKING_FOR_WORK")}>Post yours</button></div>)}
      </div>
      {onlyMine && visible.some(g => g.status === "CLOSED") && <section className="gigz-closed"><h2>Completed posts</h2><p>These are visible only to you. Open one to edit or relist it.</p><div>{visible.filter(g => g.status === "CLOSED").map(g => <button type="button" key={g.id} onClick={() => select(g.id)}>{g.title} <ArrowUpRight size={16} /></button>)}</div></section>}
      {selected && <section id="gigz-detail" className="gigz-detail" aria-label="Selected Gigz post"><button className="gigz-detail__close" onClick={() => { setSelectedId(null); window.history.replaceState(null, "", "/pride-work"); }} aria-label="Close details"><X size={18} /></button><GigListingCard gig={selected} accent="var(--board-gigs)" expanded skills={selected.skills?.split(",").map(s => s.trim()).filter(Boolean) || []} isLooking={selected.postType === "LOOKING_FOR_WORK"} onToggle={() => {}} /></section>}
      {formOpen && <GigComposer initialType={composeType} onClose={() => setFormOpen(false)} onPosted={id => { setFormOpen(false); setSelectedId(id); }} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <SafetyGuide context="gigs" />
    </div>
  </main>;
}

function ghostLetter(title: string) { return (title || "?").trim().charAt(0).toUpperCase(); }
function thumbGradient(isLooking: boolean) { return isLooking ? "linear-gradient(135deg,#19e3ff,#8a4bff)" : "linear-gradient(135deg,#b06bff,#19e3ff)"; }

export function GigListingCard({
  gig,
  accent,
  expanded,
  skills,
  isLooking,
  onToggle,
}: {
  gig: GigPost;
  accent: string;
  expanded: boolean;
  skills: string[];
  isLooking: boolean;
  onToggle: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: gig.title, description: gig.description, skills: gig.skills || "", compensation: gig.compensation || "", location: gig.location || "", gigDate: gig.gigDate || "", gigTime: gig.gigTime || "", isRemote: !!gig.isRemote });
  const updateMutation = useMutation({
    mutationFn: (changes: Record<string, unknown>) => apiRequest("PUT", `/api/gigs/${gig.id}`, changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gigs/mine"] });
      setEditing(false);
      toast({ title: "Post updated", description: "Completed posts remain in My posts. You can reopen them there." });
    },
    onError: (error: Error) => toast({ title: "Could not update post", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/gigs/${gig.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({ title: "GIGZ post deleted" });
    },
    onError: (error: Error) => toast({ title: "Could not delete post", description: error.message, variant: "destructive" }),
  });

  const messageMutation = useMutation({
    mutationFn: () => fetch(`/api/gigs/${gig.id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ body: messageBody }),
    }).then(r => {
      if (!r.ok) throw new Error("Could not send message");
      return r.json();
    }),
    onSuccess: () => {
      setMessageBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const posterLabel = gig.username ? `@${gig.username}` : gig.name;
  const locationLabel = gig.location || "Portland";
  const status = [gig.compensation, gig.location].filter(Boolean).join(" · ")
    || (isLooking ? "Available · message in inbox" : "Open · reply privately");
  const cta = isLooking ? "Say hi" : "Reply";
  const profileHref = gig.username ? memberProfileHref(gig.username) : null;
  const talentName = gig.displayName || gig.name;
  const talentFirstName = talentName.trim().split(/\s+/)[0] || "them";
  const availabilityDetail = gig.skills || gig.compensation || locationLabel;

  const openTalentReply = (prefill?: string) => {
    if (!expanded) onToggle();
    if (prefill) setMessageBody(prefill);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/map?layer=gigz&gig=${gig.id}`;
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: gig.title, url });
      else await navigator.clipboard.writeText(url);
      toast({ title: canShare ? "Shared" : "Link copied" });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        toast({ title: "Could not share", variant: "destructive" });
      }
    }
  };

  const glassVars = {
    "--listing-accent": accent,
    "--c": accent,
    "--_c": accent,
    position: "relative",
  } as CSSProperties;
  const isDemo = gig.username === "hausing_demo";

  return (
    <article
      id={`board-post-${gig.id}`}
      data-testid={`card-gig-${gig.id}`}
      className={[
        "board-listing-card board-listing-card--makeover board-listing-card--glass",
        isLooking ? "board-listing-card--talent" : "is-offering",
        expanded ? "is-expanded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={glassVars}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        // Don't steal Space/Enter from the reply textarea (or any field).
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {isDemo ? <span className="pdx-demo-sticker" aria-hidden="true">DEMO</span> : null}
      {isLooking ? (
        <>
          <div className="gig-talent-card__topline">
            <span className="gig-talent-card__availability"><i aria-hidden="true" /> Available for gigs</span>
            <span className="gig-talent-card__time">Posted {timeAgo(gig.createdAt)}</span>
          </div>
          <div className="gig-talent-card__identity">
            <UserAvatar
              photoUrl={gig.posterPhotoUrl}
              avatarChoice={gig.avatarChoice}
              avatarRing={gig.posterAvatarRing}
              displayName={gig.displayName || gig.name}
              username={gig.username}
              href={profileHref}
              onClick={e => e.stopPropagation()}
              size={76}
            />
            <div>
              <h4 className="gig-talent-card__name">{talentName}</h4>
              <p className="gig-talent-card__role">{gig.title}</p>
              <p className="gig-talent-card__location">{locationLabel}{gig.isRemote ? " · remote" : ""}</p>
            </div>
          </div>
          <div className="gig-talent-card__actions" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => openTalentReply(`Hi ${talentFirstName}, I’d like to hire you for `)}>Hire {talentFirstName} ↗</button>
            <button type="button" onClick={() => openTalentReply()}>Message</button>
          </div>
          <div className="gig-talent-card__footer"><span aria-hidden="true">✦</span>{availabilityDetail}</div>
        </>
      ) : (
        <>
          <BoardGlassMotif variant="dollar" />
          <div className="board-listing-card__row">
            <div
              className="board-listing-card__thumb"
              style={gig.imageUrl ? undefined : { background: thumbGradient(false) }}
            >
              {gig.imageUrl ? (
                <img src={gig.imageUrl} alt="" />
              ) : (
                <>
                  <span className="board-listing-card__ghost" aria-hidden="true">{ghostLetter(gig.title)}</span>
                  <div className="board-listing-card__thumb-fallback" aria-hidden="true" />
                </>
              )}
              {gig.isRemote && <span className="board-listing-card__grab-badge" style={{ background: "#ff1fa0" }}>Remote</span>}
            </div>
            <div className="board-listing-card__main">
              <div className="board-listing-card__tags">
                <span className="board-listing-card__kind board-listing-card__kind--text">{TYPE_LABELS[gig.postType]}</span>
                <span className="board-listing-card__time">{timeAgo(gig.createdAt)}</span>
              </div>
              <h4 className="board-listing-card__title">{gig.title}</h4>
              <div className="board-listing-card__poster">
                {gig.username ? (
                  <UserAvatar
                    photoUrl={gig.posterPhotoUrl}
                    avatarChoice={gig.avatarChoice}
                    avatarRing={gig.posterAvatarRing}
                    displayName={gig.displayName}
                    username={gig.username}
                    href={memberProfileHref(gig.username)}
                    onClick={e => e.stopPropagation()}
                    size={18}
                  />
                ) : null}
                <span>{posterLabel} · {locationLabel}</span>
              </div>
              <div className="board-listing-card__footer">
                <span className="board-listing-card__status">{status}</span>
                <span className="board-listing-card__cta">{cta} →</span>
              </div>
            </div>
          </div>
        </>
      )}

      {expanded && (
        <div className="board-listing-card__expand" onClick={e => e.stopPropagation()}>
          <p style={{ whiteSpace: "pre-line" }}>{gig.description}</p>
          {(skills.length > 0 || gig.compensation || gig.location) && (
            <div className="gifting-details">
              {[skills.join(", "), gig.compensation, gig.location].filter(Boolean).join(" · ")}
            </div>
          )}
          {gig.gigDate ? (
            <div className="gifting-details">
              <CalendarDays size={14} /> {gig.gigDate}{gig.gigTime ? ` · ${gig.gigTime}` : ""}
            </div>
          ) : null}
          <div className="gifting-listing-actions">
            <button type="button" onClick={handleShare}><Share2 size={14} /> Share</button>
            {gig.username && profileHref ? (
              <Link href={profileHref}>View @{gig.username}&apos;s profile</Link>
            ) : null}
            {gig.isMine && <>
              <button type="button" onClick={() => setEditing(!editing)}>Edit post</button>
              <button type="button" disabled={updateMutation.isPending} onClick={() => updateMutation.mutate({ status: gig.status === "CLOSED" ? "LIVE" : "CLOSED" })}>
                {gig.status === "CLOSED" ? "Reopen post" : isLooking ? "Mark work found" : "Mark filled"}
              </button>
              {gig.status === "CLOSED" && <span role="status">Completed · visible only in your posts</span>}
            </>}
            {gig.isMine ? (
              <button
                type="button"
                className="gifting-delete-btn"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (confirm(`Delete "${gig.title}"?`)) deleteMutation.mutate();
                }}
              >
                <Trash2 size={14} /> Delete post
              </button>
            ) : null}
          </div>
          {editing && gig.isMine && <form className="gifting-form-grid" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); updateMutation.mutate(draft); }}>
            {(["title", "description", "skills", "compensation", "location", "gigDate", "gigTime"] as const).map(key => <label key={key}>
              {{ title: "Title", description: "Description", skills: "Skills", compensation: "Pay or rate", location: "Location", gigDate: "Date", gigTime: "Time" }[key]}
              {key === "description" ? <textarea className="board-text-field" required minLength={20} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /> : <input className="board-text-field" type={key === "gigDate" ? "date" : key === "gigTime" ? "time" : "text"} required={key === "title"} minLength={key === "title" ? 3 : undefined} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />}
            </label>)}
            <label><input type="checkbox" checked={draft.isRemote} onChange={e => setDraft({ ...draft, isRemote: e.target.checked })} /> Remote work</label>
            <Button type="submit" disabled={updateMutation.isPending}>Save changes</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </form>}
          {!gig.isMine && gig.userId !== user?.id && (
            <div className="gifting-response">
              <textarea
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                placeholder={
                  isLooking
                    ? `Ask about their skills and availability for "${gig.title}"...`
                    : `Private reply about "${gig.title}"...`
                }
                maxLength={500}
              />
              <button
                type="button"
                onClick={() => {
                  if (!user) return setShowAuth(true);
                  if (!messageBody.trim()) return;
                  messageMutation.mutate();
                }}
                disabled={!messageBody.trim() || messageMutation.isPending}
              >
                {messageMutation.isPending ? "Sending…" : isLooking ? "Say hi" : "Send reply"}
              </button>
            </div>
          )}
        </div>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </article>
  );
}


/** Shared by the map and the fallback posting surface. */
export function GigComposer({initialType = "POSTING_GIG", onClose, onPosted}: {initialType?: GigFormData["postType"]; onClose: () => void; onPosted: (id: number) => void}) {
  const {user} = useAuth();
  const {toast} = useToast();
  const [acceptRules, setAcceptRules] = useState(false);
  const [venueQuery, setVenueQuery] = useState("");
  const [linkedBusiness, setLinkedBusiness] = useState<{ id: number; name: string } | null>(null);
  const [venueBranch, setVenueBranch] = useState<"idle" | "private" | "newBusiness">("idle");
  const [newBusinessForm, setNewBusinessForm] = useState({
    name: "", type: "bar", description: "", address: "", neighborhood: "",
    hours: "", phone: "", website: "", instagram: "", logoImageUrl: "",
  });

  const { data: ownedBusinesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/directory/mine/owned"],
    queryFn: () => apiRequest("GET", "/api/directory/mine/owned").then(r => r.json()),
    enabled: !!user,
  });

  const isEligiblePoster = !!user && (user.promoterStatus === "approved" || !!user.isAdmin || ownedBusinesses.length > 0);

  const { data: directoryBusinesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    enabled: isEligiblePoster,
    staleTime: 60_000,
  });

  const venueMatches = useMemo(() => {
    const q = normalizeVenueQuery(venueQuery);
    if (q.length < 3) return [];
    return directoryBusinesses
      .filter(b => normalizeVenueQuery(b.name).includes(q) || (b.address && normalizeVenueQuery(b.address).includes(q)))
      .slice(0, 5);
  }, [directoryBusinesses, venueQuery]);

  const newBusinessMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/directory/new-submission", newBusinessForm),
    onSuccess: () => {
      toast({ title: "Sent to admin for approval", description: "We'll add it to the directory once it's reviewed. Your gig will keep using the plain location for now." });
      setNewBusinessForm({ name: "", type: "bar", description: "", address: "", neighborhood: "", hours: "", phone: "", website: "", instagram: "", logoImageUrl: "" });
      setVenueBranch("idle");
      setVenueQuery("");
    },
    onError: (err: Error) => toast({ title: "Could not submit", description: err.message, variant: "destructive" }),
  });

  const form = useForm<GigFormData>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      postType: initialType,
      name: "",
      contactEmail: "",
      title: "",
      description: "",
      skills: "",
      compensation: "",
      location: "",
      isRemote: false,
      gigDate: "",
      gigTime: "",
      businessId: null,
      imageUrl: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: GigFormData) => {
      trackProductEvent("post_attempt", "gigz");
      return apiRequest("POST", "/api/gigs", { ...data, acceptRules: true }).then(r => r.json());
    },
    onSuccess: (_data, variables) => {
      trackProductEvent("post_completed", "gigz");
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({
        title: "Posted",
        description: variables.postType === "LOOKING_FOR_WORK"
          ? "You're on the board. Hosts can find you now."
          : "Your gig is live. Let the replies roll in.",
      });
      form.reset();
      setAcceptRules(false);
      onPosted(_data.id);
      setLinkedBusiness(null);
      setVenueBranch("idle");
      setVenueQuery("");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not submit post.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const submitGig = (data: GigFormData) => {
    if (!acceptRules) {
      toast({ title: "Board rules", description: "Please agree to the GIGZ rules before posting.", variant: "destructive" });
      return;
    }
    const personalsErr = validateGigPostContent(data);
    if (personalsErr) {
      toast({ title: "Not a gig post", description: personalsErr, variant: "destructive" });
      return;
    }
    mutation.mutate({ ...data, businessId: isEligiblePoster ? (linkedBusiness?.id ?? null) : null });
  };

  const postType = form.watch("postType");
  const formAccent = postType === "LOOKING_FOR_WORK" ? "#19e3ff" : "#b06bff";
  const formAccentName = postType === "LOOKING_FOR_WORK" ? "cyan" : "purple";

  return (
          <section
            id="gigs-form"
            className="gifting-form-panel gifting-form-panel--makeover pdx-glass-rebind"
            data-testid="form-pride-work"
            style={{ borderColor: formAccent, boxShadow: `0 0 30px -14px ${formAccent}` }}
          >
            <button
              type="button"
              className="gifting-close"
              onClick={onClose}
              aria-label="Close form"
            >
              <X size={18} />
            </button>
            <div className="board-section-kicker" style={{ color: formAccent }}>
              {postType === "POSTING_GIG" ? "New gig" : "New availability"}
            </div>
            <h2 className="display section-heading">
              {postType === "POSTING_GIG" ? "Post a gig" : "Post your availability"}
            </h2>
            <p className="board-copy-sm">
              {postType === "POSTING_GIG"
                ? "Role, pay, and timing. Spell it out. Goes live right away. Keep it Pride-related, paid when possible, and community-safe."
                : "Tell hosts what you do, when you are free, and what you are looking for. Goes live so organizers can find you on the board."}
            </p>
            <form onSubmit={form.handleSubmit(submitGig)} className="gifting-form-grid">
              <label className="span">
                Post type
                <select
                  className="board-text-field"
                  value={postType}
                  onChange={e => form.setValue("postType", e.target.value as GigFormData["postType"])}
                >
                  <option value="LOOKING_FOR_WORK">I&apos;m looking for work</option>
                  <option value="POSTING_GIG">I&apos;m posting a gig</option>
                </select>
              </label>

              <label>
                Your name *
                <input className="board-text-field" data-testid="input-name" placeholder="Name or handle" {...form.register("name")} />
                {form.formState.errors.name && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.name.message}</span>}
              </label>

              <label>
                Contact email *
                <input className="board-text-field" data-testid="input-email" type="email" placeholder="your@email.com" {...form.register("contactEmail")} />
                {form.formState.errors.contactEmail && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.contactEmail.message}</span>}
              </label>

              <label className="span">
                {postType === "POSTING_GIG" ? "Gig title *" : "Role / what you do *"}
                <input
                  className="board-text-field"
                  data-testid="input-title"
                  placeholder={postType === "POSTING_GIG" ? "e.g. Stage Manager for Pride Stage" : "e.g. Event Photographer"}
                  {...form.register("title")}
                />
                {form.formState.errors.title && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.title.message}</span>}
              </label>

              <label className="span">
                Description *
                <textarea
                  className="board-text-field"
                  data-testid="input-description"
                  rows={4}
                  placeholder={postType === "POSTING_GIG" ? "What is the gig, what do you need, when, and what's the pay..." : "Your experience, availability, and what kind of work you want..."}
                  {...form.register("description")}
                />
                {form.formState.errors.description && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.description.message}</span>}
              </label>

              <label>
                Skills / tags
                <input
                  className="board-text-field"
                  data-testid="input-skills"
                  placeholder={postType === "POSTING_GIG" ? "e.g. Sound, Lighting, Photography" : "e.g. Bar back, Stage hand, Social media"}
                  {...form.register("skills")}
                />
              </label>

              <label>
                {postType === "POSTING_GIG" ? "Compensation" : "Pay sought / rate"}
                <input
                  className="board-text-field"
                  data-testid="input-compensation"
                  placeholder={postType === "POSTING_GIG" ? "e.g. $25/hr, Volunteer, Negotiable" : "e.g. $25/hr minimum, Day rate, Volunteer OK"}
                  {...form.register("compensation")}
                />
              </label>

              {postType === "POSTING_GIG" && <div className="span gigz-cover-upload"><span>Cover photo (optional)</span><ImageUploader endpoint="/api/upload/poster" currentUrl={form.watch("imageUrl")} onUploaded={url => form.setValue("imageUrl", url)} label="Choose a cover photo" /><small>Use a photo you have permission to share. Posts without one use the Gigz artwork.</small></div>}

              <label className="span">
                Location
                <input
                  className="board-text-field"
                  data-testid="input-location"
                  placeholder={postType === "POSTING_GIG" ? "e.g. Portland, Remote, Washington Park" : "e.g. Inner SE, Remote OK, Will travel"}
                  {...form.register("location")}
                />
              </label>

              {postType === "POSTING_GIG" ? (
                <>
                  <label>
                    Gig date
                    <input className="board-text-field" type="date" {...form.register("gigDate")} />
                  </label>
                  <label>
                    Start time
                    <input className="board-text-field" type="time" {...form.register("gigTime")} />
                  </label>
                </>
              ) : null}

              {postType === "POSTING_GIG" && isEligiblePoster && (
                <div className="span" style={{ border: "1px solid #262626", borderRadius: 8, padding: 14 }}>
                  <p className="board-copy-sm" style={{ marginBottom: 8, color: "rgba(255,255,255,0.7)" }}>
                    Link this gig to a directory venue (optional). It'll show up on that venue's GIGZ tab.
                  </p>
                  {linkedBusiness ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ padding: "4px 12px", borderRadius: 999, border: `1px solid ${formAccent}`, color: formAccent, fontSize: "0.82rem" }}>
                        Linked: {linkedBusiness.name}
                      </span>
                      <button type="button" className="board-mini-btn" onClick={() => setLinkedBusiness(null)}>
                        Unlink
                      </button>
                    </div>
                  ) : venueBranch === "private" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="board-copy-sm">This gig will keep a plain-text location, not linked to the directory.</span>
                      <button type="button" className="board-mini-btn" onClick={() => { setVenueBranch("idle"); setVenueQuery(""); }}>
                        Search again
                      </button>
                    </div>
                  ) : venueBranch === "newBusiness" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <input className="board-text-field" placeholder="Business name *" value={newBusinessForm.name} onChange={e => setNewBusinessForm(f => ({ ...f, name: e.target.value }))} />
                      <select className="board-text-field" value={newBusinessForm.type} onChange={e => setNewBusinessForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="bar">Bar & Club</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="cafe">Cafe</option>
                        <option value="venue">Venue</option>
                        <option value="service">Service</option>
                        <option value="shop">Shop</option>
                        <option value="hotel">Hotel</option>
                        <option value="campground">Campground</option>
                      </select>
                      <textarea className="board-text-field" rows={3} placeholder="Description *" value={newBusinessForm.description} onChange={e => setNewBusinessForm(f => ({ ...f, description: e.target.value }))} />
                      <input className="board-text-field" placeholder="Address" value={newBusinessForm.address} onChange={e => setNewBusinessForm(f => ({ ...f, address: e.target.value }))} />
                      <input className="board-text-field" placeholder="Neighborhood" value={newBusinessForm.neighborhood} onChange={e => setNewBusinessForm(f => ({ ...f, neighborhood: e.target.value }))} />
                      <input className="board-text-field" placeholder="Hours" value={newBusinessForm.hours} onChange={e => setNewBusinessForm(f => ({ ...f, hours: e.target.value }))} />
                      <input className="board-text-field" placeholder="Phone" value={newBusinessForm.phone} onChange={e => setNewBusinessForm(f => ({ ...f, phone: e.target.value }))} />
                      <input className="board-text-field" placeholder="Website" value={newBusinessForm.website} onChange={e => setNewBusinessForm(f => ({ ...f, website: e.target.value }))} />
                      <input className="board-text-field" placeholder="Instagram" value={newBusinessForm.instagram} onChange={e => setNewBusinessForm(f => ({ ...f, instagram: e.target.value }))} />
                      <ImageUploader
                        endpoint="/api/upload/business-logo"
                        fieldName="logo"
                        onUploaded={url => setNewBusinessForm(f => ({ ...f, logoImageUrl: url }))}
                        label="Upload logo"
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="board-mini-btn"
                          disabled={newBusinessMutation.isPending || !newBusinessForm.name.trim() || !newBusinessForm.description.trim()}
                          onClick={() => newBusinessMutation.mutate()}
                        >
                          {newBusinessMutation.isPending ? "Submitting…" : "Submit for admin approval"}
                        </button>
                        <button type="button" className="board-mini-btn" onClick={() => setVenueBranch("idle")}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        className="board-text-field"
                        placeholder="Search venue name or address…"
                        value={venueQuery}
                        onChange={e => setVenueQuery(e.target.value)}
                      />
                      {venueMatches.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                          {venueMatches.map(b => (
                            <button
                              key={b.id}
                              type="button"
                              className="board-mini-btn"
                              style={{ textAlign: "left" }}
                              onClick={() => setLinkedBusiness({ id: b.id, name: b.name })}
                            >
                              {b.name}{b.address ? `, ${b.address}` : ""}
                            </button>
                          ))}
                        </div>
                      )}
                      {venueQuery.trim().length >= 3 && venueMatches.length === 0 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                          <span className="board-copy-sm">No match in the directory.</span>
                          <button type="button" className="board-mini-btn" onClick={() => setVenueBranch("private")}>
                            Private address, don't share
                          </button>
                          <button
                            type="button"
                            className="board-mini-btn"
                            onClick={() => { setNewBusinessForm(f => ({ ...f, name: venueQuery })); setVenueBranch("newBusiness"); }}
                          >
                            This is a business. Add it →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <label className="span gigs-form-check">
                <input type="checkbox" {...form.register("isRemote")} />
                {postType === "POSTING_GIG" ? "Remote / hybrid friendly" : "Open to remote or hybrid work"}
              </label>

              <p className="span board-copy-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                {GIG_BOARD_RULES_SUMMARY}
              </p>
              <label className="span gifting-rules">
                <input type="checkbox" checked={acceptRules} onChange={e => setAcceptRules(e.target.checked)} />
                I agree: work and gigs only, PG-13, no personals. Paid when possible, community-safe.
              </label>

              <div className="span">
                <Button
                  type="submit"
                  variant="solid"
                  accent={formAccentName}
                  size="lg"
                  arrow
                  data-testid="button-submit-gig"
                  disabled={mutation.isPending || !acceptRules}
                >
                  {mutation.isPending ? "Posting…" : "Post it"}
                </Button>
              </div>
            </form>
          </section>
  );
}
