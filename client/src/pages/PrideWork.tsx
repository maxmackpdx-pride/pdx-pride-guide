import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import BoardLoadingState from "@/components/BoardLoadingState";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import { Briefcase, Search, X, ChevronDown } from "lucide-react";

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

interface GigPost {
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
}

const TYPE_LABELS: Record<string, string> = {
  LOOKING_FOR_WORK: "LOOKING FOR WORK",
  POSTING_GIG: "POSTING A GIG",
};

const FILTER_LABELS: Record<string, string> = {
  ALL: "All posts",
  POSTING_GIG: "Posting a gig",
  LOOKING_FOR_WORK: "Looking for work",
};

const HOW_IT_WORKS = [
  ["POST IT", "Share a gig or say what work you're looking for."],
  ["ADD DETAILS", "Skills, pay, location, and what makes it queer Pride work."],
  ["GET REVIEWED", "Admins approve posts to keep the board community-safe."],
  ["CONNECT", "Reply privately through the site inbox."],
  ["DO THE WORK", "Show up, get paid, build queer community labor."],
  ["STAMP IT DONE", "Mark filled or found when the gig wraps."],
];

export default function PrideWork() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "LOOKING_FOR_WORK" | "POSTING_GIG">("ALL");

  const { data: gigs = [], isLoading, isError, error } = useQuery<GigPost[]>({
    queryKey: ["/api/gigs"],
  });

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
      toast({ title: "Post submitted", description: "Your post is pending admin review." });
      form.reset();
      setShowForm(false);
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
    setShowForm(true);
    window.setTimeout(() => document.getElementById("gigs-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 20);
  };

  const filteredGigs = gigs.filter(g =>
    filterType === "ALL" ? true : g.postType === filterType
  );

  const postType = form.watch("postType");

  return (
    <div className="zine-page gigs-page board-page">
      <PageHero
        kicker="PRIDE SEASON · QUEER WORK"
        titleLine1="PRIDE"
        titleLine2="GIG BOARD"
        accent="lime"
        lede="Community-powered job board for Pride weekend and beyond. Queer workers, queer employers, queer gigs."
        tagline="Paid, respected, valued."
        bgImage="/motifs/hero-gigs.jpg"
        actions={
          <>
            <button className="btn-neon cyan" onClick={() => setFilterType("LOOKING_FOR_WORK")}>
              <Search size={16} /> Find Work
            </button>
            <button className="btn-neon" data-testid="button-post-gig" onClick={() => openForm("POSTING_GIG")}>
              <Briefcase size={16} /> Post a Gig
            </button>
            <button className="btn-neon magenta" onClick={() => openForm("LOOKING_FOR_WORK")}>
              <Search size={16} /> Post Availability
            </button>
            <a href="#how-it-works" className="gifting-how-link">How It Works ↓</a>
          </>
        }
      />

      <ScrollReveal>
        <section id="how-it-works" className="gigs-how">
          <div>
            <span className="board-sticker" style={{ color: "#CCFF00" }}>HOW IT WORKS</span>
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

      {showForm && (
        <ScrollReveal>
        <section id="gigs-form" className="gigs-form-panel" data-testid="form-pride-work">
          <button className="gigs-close" onClick={() => setShowForm(false)} aria-label="Close form">
            <X size={18} />
          </button>
          <h2 className="display section-heading">POST TO THE GIG BOARD</h2>
          <p className="board-copy-sm">All posts require admin approval before going live. Posts must be related to Pride events, queer spaces, or the community.</p>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="gigs-form-grid">
            <label className="span">
              Post type
              <div className="gigs-type-toggle">
                {(["POSTING_GIG", "LOOKING_FOR_WORK"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    data-testid={`select-posttype-${type}`}
                    className={`${postType === type ? "active" : ""} ${type === "POSTING_GIG" ? "posting" : "looking"}`}
                    onClick={() => form.setValue("postType", type)}
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </label>

            <label>
              Your name *
              <input
                className="gigs-field"
                data-testid="input-name"
                placeholder="Name or handle"
                {...form.register("name")}
              />
              {form.formState.errors.name && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.name.message}</span>}
            </label>

            <label>
              Contact email *
              <input
                className="gigs-field"
                data-testid="input-email"
                type="email"
                placeholder="your@email.com"
                {...form.register("contactEmail")}
              />
              {form.formState.errors.contactEmail && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.contactEmail.message}</span>}
            </label>

            <label className="span">
              {postType === "POSTING_GIG" ? "Gig title *" : "Role / what you do *"}
              <input
                className="gigs-field"
                data-testid="input-title"
                placeholder={postType === "POSTING_GIG" ? "e.g. Stage Manager for Pride Stage" : "e.g. Event Photographer"}
                {...form.register("title")}
              />
              {form.formState.errors.title && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.title.message}</span>}
            </label>

            <label className="span">
              Description *
              <textarea
                className="gigs-field"
                data-testid="input-description"
                rows={5}
                placeholder={postType === "POSTING_GIG"
                  ? "Describe the gig, responsibilities, dates, what you need..."
                  : "Tell the community what you offer, your experience, availability..."}
                {...form.register("description")}
              />
              {form.formState.errors.description && <span className="board-copy-sm" style={{ color: "#ff6600" }}>{form.formState.errors.description.message}</span>}
            </label>

            <label>
              Skills / tags
              <input
                className="gigs-field"
                data-testid="input-skills"
                placeholder="e.g. Sound, Lighting, Photography"
                {...form.register("skills")}
              />
            </label>

            <label>
              Compensation
              <input
                className="gigs-field"
                data-testid="input-compensation"
                placeholder="e.g. $25/hr, Volunteer, Negotiable"
                {...form.register("compensation")}
              />
            </label>

            <label className="span">
              Location
              <input
                className="gigs-field"
                data-testid="input-location"
                placeholder="e.g. Portland, OR / Remote / Washington Park"
                {...form.register("location")}
              />
            </label>

            <div className="span gigs-form-actions">
              <button type="submit" className="btn-neon solid" data-testid="button-submit-gig" disabled={mutation.isPending}>
                {mutation.isPending ? "SUBMITTING..." : "SUBMIT FOR REVIEW"}
              </button>
              <p className="board-copy-sm">Reviewed by admins before going live</p>
            </div>
          </form>
        </section>
        </ScrollReveal>
      )}

      <ScrollReveal delay={60}>
      <section className="gigs-feed">
        <div className="gigs-feed-head">
          <div>
            <span className="board-sticker" style={{ color: "#00FFFF" }}>ACTIVE BOARD</span>
            <h2 className="display section-heading">GIGS & AVAILABILITY</h2>
          </div>
          <div className="gigs-filterbar">
            {(["ALL", "POSTING_GIG", "LOOKING_FOR_WORK"] as const).map(type => (
              <button
                key={type}
                data-testid={`filter-${type}`}
                className={`${filterType === type ? "active" : ""} ${type === "LOOKING_FOR_WORK" ? "looking" : ""}`}
                onClick={() => setFilterType(type)}
              >
                {FILTER_LABELS[type]}
              </button>
            ))}
            <span className="count">
              {filteredGigs.length} post{filteredGigs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {isLoading ? (
          <BoardLoadingState label="Loading gig posts" />
        ) : isError ? (
          <div className="board-empty" style={{ borderColor: "#FF6600" }}>
            <Briefcase size={40} style={{ color: "#FF6600", margin: "0 auto" }} />
            <p className="display section-heading" style={{ color: "#fff" }}>COULD NOT LOAD POSTS</p>
            <p className="board-copy-sm">
              {error instanceof Error ? error.message : "The gig board API is unavailable right now."}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gigs"] })}
              className="btn-neon"
              style={{ marginTop: 20 }}
            >
              TRY AGAIN
            </button>
          </div>
        ) : filteredGigs.length === 0 ? (
          <div className="board-empty">
            <Briefcase size={40} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto" }} />
            <p className="display section-heading">
              {gigs.length === 0 ? "NO POSTS YET" : "NO MATCHES"}
            </p>
            <p className="board-copy-sm">
              {gigs.length === 0
                ? "Be the first to post a gig or offer your skills."
                : "Nothing matches this filter. Try showing all posts."}
            </p>
            {gigs.length === 0 ? (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={() => openForm("POSTING_GIG")}>
                POST HERE
              </button>
            ) : (
              <button className="btn-neon" style={{ marginTop: 20 }} onClick={() => setFilterType("ALL")}>
                SHOW ALL
              </button>
            )}
          </div>
        ) : (
          <div className="gigs-grid">
            {filteredGigs.map((gig, index) => (
              <ScrollReveal key={gig.id} delay={Math.min(index * 80, 400)}>
                <GigCard gig={gig} />
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>
      </ScrollReveal>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  );
}

function GigCard({ gig }: { gig: GigPost }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const skills = gig.skills ? gig.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
  const isLooking = gig.postType === "LOOKING_FOR_WORK";

  const messageMutation = useMutation({
    mutationFn: () => fetch(`/api/gigs/${gig.id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: messageBody }),
    }).then(r => {
      if (!r.ok) throw new Error("Could not send message");
      return r.json();
    }),
    onSuccess: () => {
      setMessageBody("");
      setShowMessage(false);
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const detailParts = [gig.compensation, gig.location].filter(Boolean);

  return (
    <article
      data-testid={`card-gig-${gig.id}`}
      className={`gigs-card ${isLooking ? "looking" : "posting"}`}
    >
      <div className="gigs-card-accent" aria-hidden="true" />
      <div className="gigs-card-body">
        <button className="gigs-card-toggle" onClick={() => setExpanded(!expanded)} type="button">
          <div className="gigs-card-head">
            <div className="gigs-card-summary">
              <div className="gigs-card-meta">
                <span className="gigs-type">{TYPE_LABELS[gig.postType]}</span>
                {gig.isRemote && <span className="gigs-remote">REMOTE</span>}
                <span>{gig.location || "Portland"}</span>
              </div>
              <h3 className="display panel-heading">{gig.title}</h3>
              <p className="gigs-poster-name">{gig.name}</p>
              {detailParts.length > 0 && (
                <div className="gigs-details">{detailParts.join(" · ")}</div>
              )}
            </div>
            <ChevronDown size={20} className={`gigs-chevron ${expanded ? "open" : ""}`} />
          </div>
        </button>

        {expanded && (
          <div className="gigs-card-expand">
            <p className="board-copy" style={{ whiteSpace: "pre-line" }}>{gig.description}</p>
            {skills.length > 0 && (
              <div className="gigs-skills">
                {skills.map(skill => <span key={skill}>{skill}</span>)}
              </div>
            )}
            {gig.userId !== user?.id && (
              <>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => user ? setShowMessage(!showMessage) : setShowAuth(true)}
                >
                  Reply to Post
                </button>
                {showMessage && (
                  <div className="gigs-response">
                    <textarea
                      value={messageBody}
                      onChange={e => setMessageBody(e.target.value)}
                      placeholder={`Write a private reply about "${gig.title}"...`}
                    />
                    <div className="gifting-actions">
                      <button
                        type="button"
                        className="btn-neon solid"
                        onClick={() => messageMutation.mutate()}
                        disabled={!messageBody.trim() || messageMutation.isPending}
                        style={{ opacity: !messageBody.trim() || messageMutation.isPending ? 0.55 : 1 }}
                      >
                        {messageMutation.isPending ? "SENDING..." : "SEND"}
                      </button>
                      <button type="button" className="btn-neon" onClick={() => setShowMessage(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </article>
  );
}