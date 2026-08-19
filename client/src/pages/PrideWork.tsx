import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Briefcase, CalendarDays, Share2, Trash2, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import BoardLoadingState from "@/components/BoardLoadingState";
import BoardHero from "@/components/BoardHero";
import BoardHowItWorks from "@/components/BoardHowItWorks";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import ScrollReveal from "@/components/ScrollReveal";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import BoardStatsBar from "@/components/BoardStatsBar";
import BoardActiveSection, { BoardFilterChip, BoardSelectField, BoardTextField } from "@/components/BoardActiveSection";
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

const HOW_IT_WORKS = [
  { title: "Pick your lane", body: "Hiring? Post the gig. Looking? Post your availability.", color: "#b06bff" },
  { title: "Serve the details", body: "Skills, rates, dates, remote or on-site. Vague posts get scrolled past.", color: "#19e3ff" },
  { title: "Get seen", body: "Goes live immediately. The board is public, replies stay in inbox.", color: "#ff1fa0" },
  { title: "Connect", body: "Reply through the site inbox. Private and direct.", color: "#b06bff" },
  { title: "Do the work", body: "Show up, get paid, keep Pride season moving.", color: "#19e3ff" },
  { title: "Stamp it done", body: "Mark filled or found when the match wraps.", color: "#ff1fa0" },
];

/** Deep-glass board accent for Gigs (SoT §2.4 var(--board-gigs)). Subtype motifs differ; rim is board purple. */
const ACCENT = {
  POSTING_GIG: "var(--board-gigs)",
  LOOKING_FOR_WORK: "var(--board-gigs)",
} as const;

function ghostLetter(title: string) {
  return (title || "?").trim().charAt(0).toUpperCase();
}

function thumbGradient(isLooking: boolean) {
  return isLooking
    ? "linear-gradient(135deg,#19e3ff,#8a4bff)"
    : "linear-gradient(135deg,#b06bff,#19e3ff)";
}

export default function PrideWork() {
  const contentStartedAt = useRef(performance.now());
  usePageSeo(
    "GIGZ: Jobs & gigs | Zaylist",
    "Find gigs and workers for Portland nights. Post or browse GIGZ.",
    { image: shareCardUrl("prideWork"), imageAlt: "GIGZ on Zaylist" },
  );
  const { toast } = useToast();
  const { user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "LOOKING_FOR_WORK" | "POSTING_GIG">(() => {
    const type = new URLSearchParams(window.location.search).get("type")?.toUpperCase();
    return type === "LOOKING_FOR_WORK" || type === "POSTING_GIG" ? type : "ALL";
  });
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [remoteOnly, setRemoteOnly] = useState(() => new URLSearchParams(window.location.search).get("remote") === "1");
  const [onlyMine, setOnlyMine] = useState(() => new URLSearchParams(window.location.search).get("mine") === "1");
  const [sort, setSort] = useState(() => new URLSearchParams(window.location.search).get("sort") === "oldest" ? "LONGEST" : "RECENT");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const deepLinkHandled = useRef(false);
  const [acceptRules, setAcceptRules] = useState(false);
  const [venueQuery, setVenueQuery] = useState("");
  const [linkedBusiness, setLinkedBusiness] = useState<{ id: number; name: string } | null>(null);
  const [venueBranch, setVenueBranch] = useState<"idle" | "private" | "newBusiness">("idle");
  const [newBusinessForm, setNewBusinessForm] = useState({
    name: "", type: "bar", description: "", address: "", neighborhood: "",
    hours: "", phone: "", website: "", instagram: "", logoImageUrl: "",
  });

  const { data: gigs = [], isLoading, isError, error } = useQuery<GigPost[]>({
    queryKey: ["/api/gigs"],
    queryFn: async () => {
      const r = await fetch("/api/gigs", { credentials: "include" });
      if (!r.ok) throw new Error(`${r.status}: ${(await r.text()) || r.statusText}`);
      return r.json();
    },
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (filter === "ALL") params.delete("type"); else params.set("type", filter);
    if (search.trim()) params.set("q", search.trim()); else params.delete("q");
    if (remoteOnly) params.set("remote", "1"); else params.delete("remote");
    if (onlyMine) params.set("mine", "1"); else params.delete("mine");
    if (sort === "LONGEST") params.set("sort", "oldest"); else params.delete("sort");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [filter, onlyMine, remoteOnly, search, sort]);
  useEffect(() => {
    if (!isLoading) trackProductEvent("time_to_content", "gigz", performance.now() - contentStartedAt.current);
  }, [isLoading]);

  // Deep-links from either /z/gigz or the indexed route open that gig expanded.
  useEffect(() => {
    if (deepLinkHandled.current || !gigs.length) return;
    const pid = new URLSearchParams(window.location.search).get("post");
    if (!pid) { deepLinkHandled.current = true; return; }
    const id = Number(pid);
    deepLinkHandled.current = true;
    if (Number.isFinite(id) && gigs.some(g => g.id === id)) {
      setExpandedId(id);
      window.setTimeout(() => {
        document.getElementById(`board-post-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    }
  }, [gigs]);

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

  const stats = useMemo(() => [
    { num: gigs.filter(g => g.postType === "LOOKING_FOR_WORK").length, label: "Talent on deck", color: "#19e3ff" },
    { num: gigs.filter(g => g.postType === "POSTING_GIG").length, label: "GIGZ up for grabs", color: "#b06bff" },
    { num: gigs.filter(g => g.isRemote).length, label: "Remote friendly", color: "#ff1fa0" },
  ], [gigs]);

  const filterCounts = useMemo(() => ({
    ALL: gigs.length,
    LOOKING_FOR_WORK: gigs.filter(g => g.postType === "LOOKING_FOR_WORK").length,
    POSTING_GIG: gigs.filter(g => g.postType === "POSTING_GIG").length,
  }), [gigs]);

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
      gigDate: "",
      gigTime: "",
      businessId: null,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: GigFormData) => {
      trackProductEvent("post_attempt", "gigz");
      return apiRequest("POST", "/api/gigs", { ...data, acceptRules: true });
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
      setFormOpen(false);
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
    let rows = gigs.slice();
    if (filter !== "ALL") rows = rows.filter(g => g.postType === filter);
    if (remoteOnly) rows = rows.filter(g => !!g.isRemote);
    if (onlyMine && user) rows = rows.filter(g => g.isMine);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(g =>
        [g.title, g.description, g.skills, g.name, g.location, g.compensation]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q)),
      );
    }
    rows.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "LONGEST" ? ta - tb : tb - ta;
    });
    return rows;
  }, [gigs, filter, remoteOnly, onlyMine, search, sort, user]);

  const postType = form.watch("postType");
  const formAccent = postType === "LOOKING_FOR_WORK" ? "#19e3ff" : "#b06bff";
  const formAccentName = postType === "LOOKING_FOR_WORK" ? "cyan" : "purple";

  const clearFilters = () => {
    setFilter("ALL");
    setSearch("");
    setRemoteOnly(false);
    setOnlyMine(false);
    setSort("RECENT");
  };

  return (
    <div className="zine-page gigs-page board-page board-page--makeover">
      <BoardHero
        accent="purple"
        kicker="Two-way work board · Pride season and beyond"
        title={<img className="board-hero__brand-logo board-hero__brand-logo--gigz" src="/brand/family/gigz.svg" alt="GIGZ" />}
        lede="Post your availability, post a gig, or browse both. Stage crew, photographers, bartenders, massage therapists, host homes, designers, producers. Workers and hosts in one place. Need work? Need help? Both belong here."
        actions={
          <>
            <Button variant="neon" accent="cyan" size="lg" onClick={() => openForm("LOOKING_FOR_WORK")}>
              Post availability
            </Button>
            <Button variant="solid" accent="purple" size="lg" arrow data-testid="button-post-gig" onClick={() => openForm("POSTING_GIG")}>
              Post a gig
            </Button>
          </>
        }
      />

      <BoardStatsBar stats={stats} variant="band" showLive={false} />

      <SafetyGuide context="gigs" />

      <ScrollReveal>
        <BoardHowItWorks
          className="gigs-how"
          kickerTone="cyan"
          title={<>How <span style={{ color: "#b06bff" }}>GIGZ</span> works</>}
          lede="Same board, two sides. Talent posts what they do. Hosts post what they need. Everyone can browse both. Goes live right away, and every reply stays in a private inbox."
          steps={HOW_IT_WORKS}
          footerLine="Paid, respected, valued · work and gigs only · PG-13"
          beforeSteps={
            <div className="board-path-cards">
              <article className="board-path-card board-path-card--talent">
                <div className="board-path-card__label">For talent</div>
                <h3>Looking for Pride work?</h3>
                <p>
                  Post your skills, schedule, and rate. Stage crew, photographers, bartenders, door staff,
                  designers, producers. Say what you do and when you are free.
                </p>
                <Button variant="neon" accent="cyan" onClick={() => openForm("LOOKING_FOR_WORK")}>
                  Post availability
                </Button>
              </article>
              <article className="board-path-card board-path-card--host">
                <div className="board-path-card__label">For hosts</div>
                <h3>Need extra hands?</h3>
                <p>
                  Post paid gigs, volunteer shifts, and short Pride roles. Browse available talent or wait
                  for replies in your inbox.
                </p>
                <Button variant="solid" accent="purple" onClick={() => openForm("POSTING_GIG")}>
                  Post a gig
                </Button>
              </article>
            </div>
          }
        />
      </ScrollReveal>

      {formOpen && (
        <ScrollReveal>
          <section
            id="gigs-form"
            className="gifting-form-panel gifting-form-panel--makeover"
            data-testid="form-pride-work"
            style={{ borderColor: formAccent, boxShadow: `0 0 30px -14px ${formAccent}` }}
          >
            <button
              type="button"
              className="gifting-close"
              onClick={() => setFormOpen(false)}
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
        </ScrollReveal>
      )}

      <BoardActiveSection
        className="diag"
        sticker="Active board"
        stickerTone="purple"
        stickerStyle="mono"
        title="Open gigs & available talent"
        resultCount={`${filtered.length} showing`}
        filters={
          <>
            {([
              { key: "ALL" as const, label: "All", accent: "purple" },
              { key: "LOOKING_FOR_WORK" as const, label: "Talent on deck", accent: "cyan" },
              { key: "POSTING_GIG" as const, label: "GIGZ open", accent: "purple" },
            ]).map(f => (
              <BoardFilterChip
                key={f.key}
                active={filter === f.key}
                onClick={() => setFilter(f.key)}
                accent={f.accent}
                count={filterCounts[f.key]}
              >
                {f.label}
              </BoardFilterChip>
            ))}
          </>
        }
        filterRow2={
          <>
            <BoardTextField type="search" value={search} onChange={setSearch} placeholder="Search roles, skills, gigs" />
            <BoardFilterChip active={remoteOnly} onClick={() => setRemoteOnly(v => !v)} accent="pink">
              Remote only
            </BoardFilterChip>
            {user ? (
              <BoardFilterChip active={onlyMine} onClick={() => setOnlyMine(value => !value)} accent="cyan">
                My GIGZ
              </BoardFilterChip>
            ) : null}
            <BoardSelectField value={sort} onChange={setSort}>
              <option value="RECENT">Recently posted</option>
              <option value="LONGEST">Longest up</option>
            </BoardSelectField>
          </>
        }
      >
        {isLoading ? (
          <BoardLoadingState label="Loading talent & GIGZ posts" />
        ) : isError ? (
          <div className="board-empty" style={{ borderColor: "#b06bff" }}>
            <Briefcase size={40} style={{ color: "#b06bff", margin: "0 auto" }} />
            <p className="display section-heading" style={{ color: "#fff" }}>Could not load posts</p>
            <p className="board-copy-sm">Could not load posts. Try again in a moment.</p>
            <Button variant="neon" accent="purple" style={{ marginTop: 20 }} onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/gigs"] })}>
              Try again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="board-empty board-empty--makeover">
            <p className="display section-heading">Nobody&apos;s on deck yet</p>
            <p className="board-copy-sm">
              You bartend, you run sound, you take a good photo at 1am in bad light. Say so. Or post the gig, paid or volunteer, and be honest about which.
            </p>
            <div className="board-empty__actions">
              <Button variant="neon" accent="cyan" onClick={() => openForm("LOOKING_FOR_WORK")}>Post availability</Button>
              <Button variant="solid" accent="purple" onClick={() => openForm("POSTING_GIG")}>Post a gig</Button>
              {(filter !== "ALL" || search || remoteOnly) && (
                <Button variant="neon" accent="cyan" onClick={clearFilters}>Clear filters</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="board-listing-grid board-listing-grid--makeover">
            {filtered.map((gig, index) => {
              const isLooking = gig.postType === "LOOKING_FOR_WORK";
              const accent = isLooking ? ACCENT.LOOKING_FOR_WORK : ACCENT.POSTING_GIG;
              const expanded = expandedId === gig.id;
              const skills = gig.skills ? gig.skills.split(",").map(s => s.trim()).filter(Boolean) : [];
              return (
                <ScrollReveal key={gig.id} delay={Math.min(index * 80, 400)}>
                  <GigListingCard
                    gig={gig}
                    accent={accent}
                    expanded={expanded}
                    skills={skills}
                    isLooking={isLooking}
                    onToggle={() => setExpandedId(expanded ? null : gig.id)}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </BoardActiveSection>

      <BoardCloseSeam
        line="Need work · need help · both belong"
        url="zaylist.com/pride-work"
      />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
    </div>
  );
}

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
    const url = `${window.location.origin}/z/gigz?post=${gig.id}`;
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
