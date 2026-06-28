import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Search, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import BoardLoadingState from "@/components/BoardLoadingState";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import UserAvatar from "@/components/UserAvatar";
import BoardStatsBar from "@/components/BoardStatsBar";
import BoardActiveSection, { BoardFilterChip } from "@/components/BoardActiveSection";
import { timeAgo } from "@/lib/boardFeed";

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
});

type GigFormData = z.infer<typeof gigSchema>;

type GigPost = {
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
};

const TYPE_LABELS: Record<string, string> = {
  LOOKING_FOR_WORK: "Looking for work",
  POSTING_GIG: "Posting a gig",
};

const HOW_IT_WORKS: Array<[string, string]> = [
  ["Post it", "Share a gig or say what work you're looking for."],
  ["Add details", "Skills, pay, location, and what makes it queer Pride work."],
  ["Get seen", "Your post hits the active board right away."],
  ["Connect", "Reply privately through the site inbox."],
  ["Do the work", "Show up, get paid, build queer community labor."],
  ["Stamp it done", "Mark filled or found when the gig wraps."],
];

const ACCENT: Record<string, string> = {
  POSTING_GIG: "#C8FA3C",
  LOOKING_FOR_WORK: "#19E3FF",
};

export default function PrideWork() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "LOOKING_FOR_WORK" | "POSTING_GIG">("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: gigs = [], isLoading, isError, error } = useQuery<GigPost[]>({
    queryKey: ["/api/gigs"],
    queryFn: async () => {
      const r = await fetch("/api/gigs", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}: ${(await r.text()) || r.statusText}`);
      return r.json();
    },
  });

  const stats = useMemo(() => [
    { num: gigs.filter(g => g.postType === "POSTING_GIG").length, label: "Gigs posted", color: "#C8FA3C" },
    { num: gigs.filter(g => g.postType === "LOOKING_FOR_WORK").length, label: "Workers available", color: "#19E3FF" },
    { num: gigs.filter(g => g.isRemote).length, label: "Remote-friendly", color: "#FF1FA0" },
  ], [gigs]);

  const form = useForm<GigFormData>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      postType: "POSTING_GIG",
      name: "",
      contactEmail: "",
      title: "",
      description: "",
      skills: "",
      compensation: "",
      location: "",
      isRemote: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: GigFormData) => apiRequest("POST", "/api/gigs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({ title: "Posted", description: "Your post is live on the gig board." });
      form.reset();
      setFormOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit post.", variant: "destructive" });
    },
  });

  const openForm = (postType: "POSTING_GIG" | "LOOKING_FOR_WORK") => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    form.setValue("postType", postType);
    setFormOpen(true);
    window.setTimeout(() => document.getElementById("gigs-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const filtered = useMemo(() => {
    if (filter === "ALL") return gigs.slice();
    return gigs.filter(g => g.postType === filter);
  }, [gigs, filter]);

  const postType = form.watch("postType");

  const cardAccent = (gig: GigPost) => (
    gig.postType === "LOOKING_FOR_WORK" ? ACCENT.LOOKING_FOR_WORK : ACCENT.POSTING_GIG
  );

  const cardStatus = (gig: GigPost) => {
    const parts = [gig.compensation, gig.location].filter(Boolean);
    return parts.length ? parts.join(" · ") : "Open — reply privately";
  };

  const cardCta = () => "Reply";

  return (
    <div className="zine-page gigs-page board-page">
      <PageHero
        flush
        kicker="Pride season & beyond"
        titleLine1="PRIDE"
        titleLine1Accent="rainbow"
        titleLine2="GIG BOARD"
        accent="lime"
        lede="Community-powered job board for Pride weekend and beyond. Queer workers, queer employers, queer gigs."
        tagline="Paid, respected, valued."
        taglineAccent="lime"
        bgImage="/motifs/hero-gigs.jpg"
        actions={
          <>
            <button type="button" className="btn-neon" data-testid="button-post-gig" onClick={() => openForm("POSTING_GIG")}>
              <Briefcase size={16} /> Post a gig
            </button>
            <button type="button" className="btn-neon cyan" onClick={() => openForm("LOOKING_FOR_WORK")}>
              <Search size={16} /> Post availability
            </button>
          </>
        }
      />

      <BoardStatsBar stats={stats} />

      <ScrollReveal>
        <section id="how-it-works" className="gigs-how board-how board-how--inline diag">
          <div>
            <span className="board-sticker board-sticker--cyan">How it works</span>
            <h2 className="display section-heading">HOW THE GIG BOARD WORKS</h2>
            <p className="board-copy">Post gigs, find collaborators, and connect queer workers with queer work.</p>
          </div>
          <div className="board-steps">
            {HOW_IT_WORKS.map(([title, text], i) => (
              <article className="board-step" key={title}>
                <span className="board-step__num" aria-hidden="true">{i + 1}</span>
                <h3 className="display panel-heading">{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="gigs-footer-line">Paid, respected, valued. · Pride season and beyond</div>
        </section>
      </ScrollReveal>

      {formOpen && (
        <ScrollReveal>
          <section id="gigs-form" className="gifting-form-panel" data-testid="form-pride-work">
            <button type="button" className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X size={18} />
            </button>
            <h2 className="display section-heading">
              Post {postType === "POSTING_GIG" ? "a gig" : "your availability"}
            </h2>
            <p className="board-copy-sm">
              Posts go live on the board right away. Keep it Pride-related, queer-community-safe, and respectful.
            </p>
            <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="gifting-form-grid">
              <label className="span">
                Post type
                <select
                  className="board-text-field"
                  value={postType}
                  onChange={e => form.setValue("postType", e.target.value as GigFormData["postType"])}
                >
                  <option value="POSTING_GIG">Posting a gig</option>
                  <option value="LOOKING_FOR_WORK">Looking for work</option>
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
                  rows={5}
                  placeholder={postType === "POSTING_GIG" ? "Describe the gig, responsibilities, dates, what you need..." : "Tell the community what you offer, your experience, availability..."}
                  {...form.register("description")}
                />
                {form.formState.errors.description && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.description.message}</span>}
              </label>

              <label>
                Skills / tags
                <input className="board-text-field" data-testid="input-skills" placeholder="e.g. Sound, Lighting, Photography" {...form.register("skills")} />
              </label>

              <label>
                Compensation
                <input className="board-text-field" data-testid="input-compensation" placeholder="e.g. $25/hr, Volunteer, Negotiable" {...form.register("compensation")} />
              </label>

              <label className="span">
                Location
                <input className="board-text-field" data-testid="input-location" placeholder="e.g. Portland, OR / Remote / Washington Park" {...form.register("location")} />
              </label>

              <div className="span">
                <button type="submit" className="btn-neon solid" data-testid="button-submit-gig" disabled={mutation.isPending}>
                  {mutation.isPending ? "Posting…" : "Submit →"}
                </button>
              </div>
            </form>
          </section>
        </ScrollReveal>
      )}

      <BoardActiveSection
        className="diag"
        sticker="Active board"
        stickerTone="lime"
        title="Gigs & Availability"
        filters={
          <>
            {([
              { key: "ALL", label: "All" },
              { key: "POSTING_GIG", label: "Posting a gig" },
              { key: "LOOKING_FOR_WORK", label: "Looking for work" },
            ] as const).map(f => (
              <BoardFilterChip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </BoardFilterChip>
            ))}
          </>
        }
      >
        {isLoading ? (
          <BoardLoadingState label="Loading gig posts" />
        ) : isError ? (
          <div className="board-empty" style={{ borderColor: "#C8FA3C" }}>
            <Briefcase size={40} style={{ color: "#C8FA3C", margin: "0 auto" }} />
            <p className="display section-heading" style={{ color: "#fff" }}>COULD NOT LOAD POSTS</p>
            <p className="board-copy-sm">{error instanceof Error ? error.message : "The gig board API is unavailable right now."}</p>
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gigs"] })} className="btn-neon" style={{ marginTop: 20 }}>TRY AGAIN</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--prototype">
            <p className="display section-heading">Nothing here yet</p>
            <p className="board-copy-sm">
              {gigs.length === 0
                ? "No posts match this filter right now. Be the first — post a gig or your availability."
                : "No posts match this filter right now. Try showing all posts."}
            </p>
            {gigs.length === 0 ? (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={() => openForm("POSTING_GIG")}>Post a gig</button>
            ) : (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={() => setFilter("ALL")}>Show all</button>
            )}
          </div>
        ) : (
          <div className="board-listing-grid">
            {filtered.map((gig, index) => {
              const accent = cardAccent(gig);
              const expanded = expandedId === gig.id;
              const skills = gig.skills ? gig.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
              const isLooking = gig.postType === "LOOKING_FOR_WORK";
              return (
                <ScrollReveal key={gig.id} delay={Math.min(index * 80, 400)}>
                  <GigListingCard
                    gig={gig}
                    accent={accent}
                    expanded={expanded}
                    skills={skills}
                    isLooking={isLooking}
                    cardStatus={cardStatus(gig)}
                    cardCta={cardCta()}
                    onToggle={() => setExpandedId(expanded ? null : gig.id)}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </BoardActiveSection>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  );
}

function GigListingCard({
  gig,
  accent,
  expanded,
  skills,
  isLooking,
  cardStatus,
  cardCta,
  onToggle,
}: {
  gig: GigPost;
  accent: string;
  expanded: boolean;
  skills: string[];
  isLooking: boolean;
  cardStatus: string;
  cardCta: string;
  onToggle: () => void;
}) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [messageBody, setMessageBody] = useState("");

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

  return (
    <article
      data-testid={`card-gig-${gig.id}`}
      className={`board-listing-card${expanded ? " is-expanded" : ""}`}
      style={{ "--listing-accent": accent } as React.CSSProperties}
      onClick={onToggle}
    >
      <div className="board-listing-card__row">
        <div className="board-listing-card__thumb">
          {gig.imageUrl ? (
            <img src={gig.imageUrl} alt="" />
          ) : (
            <div
              className="board-listing-card__thumb-fallback"
              style={{ background: isLooking ? "linear-gradient(135deg,#19E3FF,#A24BFF)" : "linear-gradient(135deg,#C8FA3C,#19E3FF)" }}
              aria-hidden="true"
            />
          )}
        </div>
        <div className="board-listing-card__main">
          <div className="board-listing-card__tags">
            <span className="board-listing-card__kind">{TYPE_LABELS[gig.postType]}</span>
            {gig.isRemote && <span className="board-listing-card__grab">Remote</span>}
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
                size={18}
              />
            ) : null}
            <span>{posterLabel} · {locationLabel}</span>
          </div>
        </div>
      </div>
      <div className="board-listing-card__footer">
        <span className="board-listing-card__status">{cardStatus}</span>
        <span className="board-listing-card__cta">{cardCta} →</span>
      </div>

      {expanded && (
        <div className="board-listing-card__expand" onClick={e => e.stopPropagation()}>
          <p style={{ whiteSpace: "pre-line" }}>{gig.description}</p>
          {(skills.length > 0 || gig.compensation || gig.location) && (
            <div className="gifting-details">
              {[skills.join(", "), gig.compensation, gig.location].filter(Boolean).join(" · ")}
            </div>
          )}
          {!gig.isMine && gig.userId !== user?.id && (
            <div className="gifting-response">
              <textarea
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                placeholder={`Write a private reply about "${gig.title}"...`}
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
                {messageMutation.isPending ? "Sending…" : "Send reply"}
              </button>
            </div>
          )}
        </div>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </article>
  );
}