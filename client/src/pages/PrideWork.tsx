import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, Search, UserRound, X } from "lucide-react";
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
  LOOKING_FOR_WORK: "Open to werk",
  POSTING_GIG: "Gig posted",
};

const HOW_IT_WORKS: Array<[string, string]> = [
  ["Pick your lane", "Hiring? Post the gig. Looking? Post your availability. No lurking."],
  ["Serve the details", "Skills, rates, dates, remote or on-site — vague posts get scrolled past."],
  ["Get seen", "Goes live immediately. This board is not a secret group chat."],
  ["Connect", "Reply through the site inbox. Private, direct, drama-contained."],
  ["Do the werk", "Show up, get paid, build queer community labor."],
  ["Stamp it done", "Mark filled or found when the match is sealed."],
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
    { num: gigs.filter(g => g.postType === "LOOKING_FOR_WORK").length, label: "Talent on deck", color: "#19E3FF" },
    { num: gigs.filter(g => g.postType === "POSTING_GIG").length, label: "Gigs up for grabs", color: "#C8FA3C" },
    { num: gigs.filter(g => g.isRemote).length, label: "Remote? Versatile.", color: "#FF1FA0" },
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({
        title: "Posted",
        description: variables.postType === "LOOKING_FOR_WORK"
          ? "You're on the board. Hosts can find you now."
          : "Your gig is live. Let the replies roll in.",
      });
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
    if (parts.length) return parts.join(" · ");
    return gig.postType === "LOOKING_FOR_WORK" ? "Available — slide into inbox" : "Open — reply privately";
  };

  const cardCta = (gig: GigPost) => (
    gig.postType === "LOOKING_FOR_WORK" ? "Say hi" : "Reply"
  );

  return (
    <div className="zine-page gigs-page board-page">
      <PageHero
        flush
        kicker="Pride season & beyond · Werk season"
        titleLine1="PRIDE"
        titleLine1Accent="rainbow"
        titleLine2="GIG BOARD"
        accent="lime"
        lede="Two-way board for the chronically employable and the desperately hiring. Post your availability, post a gig, or browse both — queer talent and queer bosses in one room."
        tagline="Need work? Need backup? Either way, announce yourself."
        taglineAccent="cyan"
        bgImage="/motifs/hero-gigs.jpg"
        actions={
          <>
            <button type="button" className="btn-neon cyan" onClick={() => openForm("LOOKING_FOR_WORK")}>
              <UserRound size={16} /> I'm available — book me
            </button>
            <button type="button" className="btn-neon" data-testid="button-post-gig" onClick={() => openForm("POSTING_GIG")}>
              <Briefcase size={16} /> I need backup
            </button>
          </>
        }
      />

      <BoardStatsBar stats={stats} liveLabel="Talent, gigs & drama-free hiring · live" />

      <ScrollReveal>
        <section id="how-it-works" className="gigs-how board-how board-how--inline diag">
          <div>
            <span className="board-sticker board-sticker--cyan">How it works</span>
            <h2 className="display section-heading">HOW THE GIG BOARD WORKS</h2>
            <p className="board-copy">Same board, two doors. Talent posts what they do. Hirers post what they need. Everyone browses. Nobody lurks in the comments.</p>
          </div>
          <div className="gigs-path-cards">
            <article className="gigs-path-card gigs-path-card--talent">
              <span className="gigs-path-card__label">For talent</span>
              <h3 className="display panel-heading">Need a Pride paycheck?</h3>
              <p>Post your skills, schedule, and rate. Stage crew, photographers, bartenders, door huntys, designers, producers — if you want the gig, don't be shy about it.</p>
            </article>
            <article className="gigs-path-card gigs-path-card--hirer">
              <span className="gigs-path-card__label">For hirers</span>
              <h3 className="display panel-heading">Need queer backup?</h3>
              <p>Post paid gigs, volunteer shifts, and short Pride emergencies. Browse talent now or let the inbox do the flattering for you.</p>
            </article>
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
          <div className="gigs-footer-line">Paid, respected, valued. No unpaid emotional labor. · Pride season and beyond</div>
        </section>
      </ScrollReveal>

      {formOpen && (
        <ScrollReveal>
          <section id="gigs-form" className="gifting-form-panel" data-testid="form-pride-work">
            <button type="button" className="gifting-close" onClick={() => setFormOpen(false)} aria-label="Close form">
              <X size={18} />
            </button>
            <h2 className="display section-heading">
              {postType === "POSTING_GIG" ? "Cast your gig" : "Put yourself on the marquis"}
            </h2>
            <p className="board-copy-sm">
              {postType === "POSTING_GIG"
                ? "Role, pay, timing — spell it out. Goes live right away. Keep it Pride-related, paid when possible, and community-safe."
                : "Tell hosts what you do, when you're free, and what you're worth. Goes live so organizers can find you without the awkward DM hunt."}
            </p>
            <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="gifting-form-grid">
              <label className="span">
                Post type
                <select
                  className="board-text-field"
                  value={postType}
                  onChange={e => form.setValue("postType", e.target.value as GigFormData["postType"])}
                >
                  <option value="LOOKING_FOR_WORK">I'm looking for werk</option>
                  <option value="POSTING_GIG">I'm casting a gig</option>
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
                  placeholder={postType === "POSTING_GIG" ? "What is the gig, what do you need, when, and what's the pay..." : "Your experience, your availability, what you're looking for — sell it without the novel..."}
                  {...form.register("description")}
                />
                {form.formState.errors.description && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.description.message}</span>}
              </label>

              <label>
                Skills / tags
                <input
                  className="board-text-field"
                  data-testid="input-skills"
                  placeholder={postType === "POSTING_GIG" ? "e.g. Sound, Lighting, Photography" : "e.g. Bar back, Stage hand, Social media, Drag security"}
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

              <label className="span">
                Location
                <input
                  className="board-text-field"
                  data-testid="input-location"
                  placeholder={postType === "POSTING_GIG" ? "e.g. Portland, OR / Remote / Washington Park" : "e.g. Inner SE, Downtown, Remote OK, Will travel"}
                  {...form.register("location")}
                />
              </label>

              <label className="span gigs-form-check">
                <input type="checkbox" {...form.register("isRemote")} />
                {postType === "POSTING_GIG" ? "Remote / hybrid friendly" : "Open to remote werk (I'm versatile)"}
              </label>

              <div className="span">
                <button type="submit" className="btn-neon solid" data-testid="button-submit-gig" disabled={mutation.isPending}>
                  {mutation.isPending ? "Posting…" : "Post it →"}
                </button>
              </div>
            </form>
          </section>
        </ScrollReveal>
      )}

      <BoardActiveSection
        className="diag"
        sticker="Active board"
        stickerTone="cyan"
        title="Who's hiring & who's ready to werk"
        filters={
          <>
            {([
              { key: "ALL", label: "All" },
              { key: "LOOKING_FOR_WORK", label: "Talent on deck" },
              { key: "POSTING_GIG", label: "Gigs open" },
            ] as const).map(f => (
              <BoardFilterChip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </BoardFilterChip>
            ))}
          </>
        }
      >
        {isLoading ? (
          <BoardLoadingState label="Loading the werk board" />
        ) : isError ? (
          <div className="board-empty" style={{ borderColor: "#C8FA3C" }}>
            <Briefcase size={40} style={{ color: "#C8FA3C", margin: "0 auto" }} />
            <p className="display section-heading" style={{ color: "#fff" }}>COULD NOT LOAD POSTS</p>
            <p className="board-copy-sm">{error instanceof Error ? error.message : "The gig board API is unavailable right now."}</p>
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gigs"] })} className="btn-neon" style={{ marginTop: 20 }}>TRY AGAIN</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--prototype">
            <p className="display section-heading">The board is quiet</p>
            <p className="board-copy-sm">
              {gigs.length === 0
                ? "No posts yet. Talent: declare yourself. Hirers: cast the gig. Somebody has to go first."
                : "Nothing in this filter. Widen the search or switch between talent and gigs."}
            </p>
            {gigs.length === 0 ? (
              <div className="gifting-actions" style={{ justifyContent: "center", marginTop: 20 }}>
                <button type="button" className="btn-neon cyan" onClick={() => openForm("LOOKING_FOR_WORK")}>I'm available</button>
                <button type="button" className="btn-neon" onClick={() => openForm("POSTING_GIG")}>I need backup</button>
              </div>
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
                    cardCta={cardCta(gig)}
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
                placeholder={
                  isLooking
                    ? `Tell them why you'd hire them for "${gig.title}" — keep it cute, keep it clear...`
                    : `Private reply about "${gig.title}" — be direct, be kind...`
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