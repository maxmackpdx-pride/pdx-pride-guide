import { useEffect, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Event } from "@shared/schema";
import EventTypeTag from "@/components/EventTypeTag";
import PageHeader from "@/components/PageHeader";
import PageHero from "@/components/PageHero";
import type { PageHeroAccent } from "@/components/PageHero";
import { promotersHeroProps } from "@/lib/promotersHero";
import ScrollReveal from "@/components/ScrollReveal";
import { usePageSeo } from "@/hooks/usePageSeo";
import { ADMISSION_OPTIONS, admissionRequiresTicketUrl } from "@shared/admission";
import { SUBMIT_EVENT_TYPE_OPTIONS, submitLabelsToJsonTags } from "@shared/eventTypeTags";
import { PRIDE_WEEK_DAY_OPTIONS, defaultPrideDateTimes } from "@shared/prideWeek";

const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];
const EVENT_TYPES = SUBMIT_EVENT_TYPE_OPTIONS.map(opt => opt.label);

const SUBMIT_RETURN_KEY = "pdx-submit-return";

const labelStyle = { display: "block", fontSize: "0.72rem", fontFamily: "var(--font-display)", color: "var(--text-meta)", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontWeight: 700 };
const sectionHeadStyle: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--neon-yellow)", marginBottom: 14, borderBottom: "1px solid #1a1a1a", paddingBottom: 8 };
const backBtnStyle: React.CSSProperties = { background: "none", border: "none", color: "var(--text-meta)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20, padding: 0 };

type PageMode = "landing" | "submit" | "apply" | "suggest" | "claim";
type SubmitStep = "promoter_app" | "event_details";
type FlowSuccess = "apply" | "suggest" | "claim";

type SubmitReturnState = {
  mode: PageMode;
  submitStep: SubmitStep;
};

/* ── Inline line-glyph icons (stroke set matches the brand icon system) ── */
const BoltIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 9-12h-7z" /></svg>
);
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const emptyEventForm = () => ({
  title: "", description: "", venueName: "", address: "", neighborhood: "SE Portland",
  ...defaultPrideDateTimes("FRI"),
  dayOfWeek: "FRI",
  ageRequirement: "ALL_AGES", admission: "FREE", ticketUrl: "",
  posterImageUrl: "", isPublic: true, isHouseParty: false,
  isSexPositive: false, nudityOk: false, selectedTypes: [] as string[],
});

const emptyPromoterForm = () => ({
  org: "", proofUrl: "", appReason: "", suggestNote: "",
  claimEventId: "", claimReason: "",
});

export default function Submit() {
  usePageSeo(
    "Submit an Event — PDX Pride Guide | Portland Pride 2026",
    "Add your Portland Pride 2026 event to the free PDX Pride community directory. Submit or claim listings for Pride Week.",
  );
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const [eventSubmitSuccess, setEventSubmitSuccess] = useState<{
    title: string;
    desc: string;
    potentialMatches?: Array<{ title: string; venueName: string; confidence: string }>;
  } | null>(null);
  const [flowSuccess, setFlowSuccess] = useState<FlowSuccess | null>(null);
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const claimPathEventId = location.match(/^\/submit\/claim\/(\d+)$/)?.[1] || "";
  const initialMode: PageMode = (claimPathEventId || params.get("mode") === "claim") ? "claim" : "landing";

  const [mode, setMode] = useState<PageMode>(initialMode);
  const [submitStep, setSubmitStep] = useState<SubmitStep>("promoter_app");
  const [eventForm, setEventForm] = useState(emptyEventForm());
  const [promoterForm, setPromoterForm] = useState({ ...emptyPromoterForm(), claimEventId: claimPathEventId });
  const [submitterOrg, setSubmitterOrg] = useState("");

  const promoterStatus = user?.promoterStatus || "none";
  const isApproved = promoterStatus === "approved" || !!user?.isAdmin;

  const { data: unclaimedEvents = [], isError: unclaimedError, refetch: refetchUnclaimed } = useQuery<Event[]>({
    queryKey: ["/api/events/unclaimed"],
    queryFn: () => apiRequest("GET", "/api/events/unclaimed").then(r => r.json()),
    enabled: mode === "claim",
  });

  const openAuth = () => {
    setAuthDismissed(false);
    setShowAuth(true);
    if (mode !== "landing") {
      sessionStorage.setItem(SUBMIT_RETURN_KEY, JSON.stringify({ mode, submitStep }));
    }
  };

  const closeAuth = () => {
    setAuthDismissed(true);
    setShowAuth(false);
  };

  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem(SUBMIT_RETURN_KEY);
    if (saved && user) {
      try {
        const parsed = JSON.parse(saved) as SubmitReturnState;
        setMode(parsed.mode);
        setSubmitStep(parsed.submitStep);
      } catch { /* ignore */ }
      sessionStorage.removeItem(SUBMIT_RETURN_KEY);
    }
  }, [loading, user]);

  // Reset transient success + dismissal state whenever the top-level mode changes.
  useEffect(() => {
    setFlowSuccess(null);
    setEventSubmitSuccess(null);
    if (mode === "landing") setAuthDismissed(false);
  }, [mode]);

  useEffect(() => {
    if (user) {
      setShowAuth(false);
      setAuthDismissed(false);
    } else if (!loading && mode !== "landing" && !authDismissed) {
      setShowAuth(true);
    }
  }, [loading, user, mode, authDismissed]);

  useEffect(() => {
    const eventId = location.match(/^\/submit\/claim\/(\d+)$/)?.[1];
    if (eventId) {
      setMode("claim");
      setPromoterForm(f => ({ ...f, claimEventId: eventId }));
    }
  }, [location]);

  const toggleType = (t: string) => setEventForm(f => ({
    ...f, selectedTypes: f.selectedTypes.includes(t) ? f.selectedTypes.filter(x => x !== t) : [...f.selectedTypes, t],
  }));

  const goMode = (m: PageMode) => {
    if (!user) { openAuth(); return; }
    setMode(m);
    if (m === "submit") setSubmitStep(isApproved ? "event_details" : "promoter_app");
  };

  const backToLanding = () => setMode("landing");

  // Promoter application mutation (standalone "apply" path only)
  const applyMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/submit", {
        type: "PROMOTER_APPLICATION",
        submitterOrg,
        ticketUrl: promoterForm.proofUrl,
        claimReason: promoterForm.appReason,
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.message || payload.error || "Submission failed");
      return payload;
    },
    onSuccess: () => {
      toast({ title: "Application submitted!", description: "Admins will review your promoter request and be in touch." });
      setPromoterForm(emptyPromoterForm());
      setSubmitterOrg("");
      setFlowSuccess("apply");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Event submission mutation
  const eventMutation = useMutation({
    mutationFn: async (opts: { type: "NEW_EVENT" | "SUGGEST" | "CLAIM" }) => {
      const now = new Date().toISOString();
      const isSuggest = opts.type === "SUGGEST";
      const r = await apiRequest("POST", "/api/submit", {
        type: opts.type,
        ...(isSuggest ? {
          title: eventForm.title,
          venueName: eventForm.venueName || "Unknown",
          description: promoterForm.suggestNote || "Community tip",
          dateStart: eventForm.dateStart || now,
          dateEnd: eventForm.dateEnd || now,
          dayOfWeek: eventForm.dayOfWeek,
          ageRequirement: "ALL_AGES",
          admission: "FREE",
          isPublic: true,
          ticketUrl: eventForm.ticketUrl,
          eventTypes: "[]",
        } : opts.type === "CLAIM" ? {
          eventId: promoterForm.claimEventId,
          claimReason: promoterForm.claimReason,
          submitterOrg,
        } : {
          ...eventForm,
          eventTypes: submitLabelsToJsonTags(eventForm.selectedTypes),
          submitterOrg,
        }),
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.message || payload.error || "Submission failed");
      return payload;
    },
    onSuccess: (payload, vars) => {
      const autoApproved = !!payload.autoApproved;
      const heldForReview = !!payload.heldForReview;
      const msgs: Record<string, { title: string; desc: string }> = {
        NEW_EVENT: {
          title: heldForReview ? "Submitted for admin review" : "Event submitted!",
          desc: heldForReview
            ? (payload.heldReason
              ? `${payload.heldReason}. An admin will merge your updates with the existing listing or publish separately.`
              : "We found a similar event already in the guide. An admin will review before publishing.")
            : autoApproved
              ? "Your event is now live."
              : isApproved
                ? "Your event is now live."
                : "Your event and promoter application are in the admin queue.",
        },
        SUGGEST: { title: "Tip received!", desc: "Admins will review and may add this event to the guide." },
        CLAIM: {
          title: autoApproved ? "Event claimed!" : "Claim submitted!",
          desc: autoApproved
            ? "You're now the host of this event — it's live on your profile."
            : "Your claim is pending admin review.",
        },
      };
      const m = msgs[vars.type] || msgs.NEW_EVENT;
      toast({ title: m.title, description: m.desc });
      if (vars.type === "NEW_EVENT") {
        setEventSubmitSuccess({
          title: m.title,
          desc: m.desc,
          potentialMatches: Array.isArray(payload.potentialMatches)
            ? payload.potentialMatches.slice(0, 3).map((match: { title: string; venueName: string; confidence: string }) => ({
              title: match.title,
              venueName: match.venueName,
              confidence: match.confidence,
            }))
            : undefined,
        });
        return;
      }
      setEventForm(emptyEventForm());
      setPromoterForm(emptyPromoterForm());
      setSubmitStep("promoter_app");
      setFlowSuccess(vars.type === "SUGGEST" ? "suggest" : "claim");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startAnotherEvent = () => {
    setEventForm(emptyEventForm());
    setEventSubmitSuccess(null);
    setSubmitStep("event_details");
  };

  const finishSubmitFlow = () => {
    setEventForm(emptyEventForm());
    setPromoterForm(emptyPromoterForm());
    setSubmitStep("promoter_app");
    setEventSubmitSuccess(null);
    setMode("landing");
  };

  const handleSubmitWithEvent = async () => {
    if (!user) { openAuth(); return; }
    if (!isApproved) {
      // Fire promoter application first — bail out if it fails
      const r = await apiRequest("POST", "/api/submit", {
        type: "PROMOTER_APPLICATION",
        submitterOrg,
        ticketUrl: promoterForm.proofUrl,
        claimReason: promoterForm.appReason,
      });
      if (!r.ok) {
        const payload = await r.json().catch(() => ({}));
        toast({ title: "Error", description: payload.error || "Could not submit promoter application. Please try again.", variant: "destructive" });
        return;
      }
    }
    eventMutation.mutate({ type: "NEW_EVENT" });
  };

  const heroCopy: Record<PageMode, { kicker: string; title: string; accent: PageHeroAccent; lede: string }> = {
    landing: {
      kicker: "Portland Pride 2026 · Community submissions",
      title: "Submit",
      accent: "lime",
      lede: "Throwing something? Want the verified badge? Notice we missed one? Pick a door below.",
    },
    submit: {
      kicker: "New listing",
      title: "Submit an Event",
      accent: "lime",
      lede: "Add your Pride Week event to the guide. Verified promoters go live immediately; new accounts enter the review queue.",
    },
    apply: {
      kicker: "Promoter verification",
      title: "Apply as Promoter",
      accent: "cyan",
      lede: "Apply to post events that go live without admin review. Tell us who you are and what you run.",
    },
    suggest: {
      kicker: "Community tip",
      title: "Suggest an Event",
      accent: "magenta",
      lede: "Saw something we missed? Tell us. We read every tip. Good ones go up as unclaimed listings.",
    },
    claim: {
      kicker: "Host your listing",
      title: "Claim an Event",
      accent: "cyan",
      lede: "Already listed but unclaimed? Take ownership to manage your event and connect with the community.",
    },
  };
  const hero = heroCopy[mode];

  const fieldClass = "submit-form__field";
  const ticketRequired = admissionRequiresTicketUrl(eventForm.admission);
  const admissionHint = ADMISSION_OPTIONS.find(o => o.value === eventForm.admission)?.hint;

  const showStepper = !isApproved && mode === "submit" && submitStep && !eventSubmitSuccess;

  return (
    <div className="zine-page submit-page board-page">
      {showAuth && !user && <AuthModal onClose={closeAuth} defaultTab="register" />}
      {mode === "landing" ? (
        <PageHero
          {...promotersHeroProps({ className: "submit-page-hero page-hero--image-title" })}
        />
      ) : (
        <PageHeader
          section="Submit"
          title={hero.title}
          titleAccent={hero.accent}
          kicker={hero.kicker}
          lede={hero.lede}
        />
      )}

      <div className="submit-page__body">

        {/* ── LANDING ── */}
        {mode === "landing" && (
          <div className="submit-stack">

            {/* Status banners */}
            {isApproved && (
              <div className="submit-banner">
                <span className="submit-banner__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <div>
                  <div className="submit-banner__title">Verified promoter</div>
                  <p className="submit-banner__body">You're verified. New events you submit go live immediately, no review queue.</p>
                </div>
              </div>
            )}
            {!isApproved && promoterStatus === "pending" && (
              <div className="submit-banner">
                <span className="submit-banner__icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" {...stroke} strokeWidth={2.2} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                </span>
                <div>
                  <div className="submit-banner__title">Application pending</div>
                  <p className="submit-banner__body">Your promoter application is in the admin queue. You'll get a message when it's reviewed.</p>
                </div>
              </div>
            )}
            {!user && (
              <div className="submit-banner submit-banner--yellow submit-banner--stacked">
                <div>
                  <div className="submit-banner__title">Account required</div>
                  <p className="submit-banner__body">Free account, sixty seconds, then you can submit, apply, or tip us off.</p>
                  <button type="button" className="btn-neon solid submit-banner__cta" onClick={() => openAuth()}>Log in / Join →</button>
                </div>
              </div>
            )}

            {/* Card 1: Submit New Event (+ become a promoter) */}
            <button type="button" className="submit-card" onClick={() => goMode("submit")}>
              <span className="submit-card__icon"><BoltIcon /></span>
              <span className="submit-card__main">
                <span className="submit-card__head">
                  <span className="submit-card__title">{isApproved ? "Submit new event" : "Submit an event + become a promoter"}</span>
                  <span className="submit-card__tag">{isApproved ? "Goes live instantly" : "2 steps · first-time review"}</span>
                </span>
                <span className="submit-card__body">
                  {isApproved
                    ? "You're a verified promoter. Your event goes live the moment you submit."
                    : "Short application first, then your event. Both land in review together and go live together."}
                </span>
              </span>
              <span className="submit-card__arrow">→</span>
            </button>

            {/* Card 2: Apply as Promoter (only when not approved) */}
            {!isApproved && (
              <button type="button" className="submit-card submit-card--cyan" onClick={() => goMode("apply")}>
                <span className="submit-card__icon">
                  <svg width="21" height="21" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5z" /><path d="m9 12 2 2 4-4" /></svg>
                </span>
                <span className="submit-card__main">
                  <span className="submit-card__head">
                    <span className="submit-card__title">Apply as promoter</span>
                    <span className="submit-card__tag">Verification</span>
                  </span>
                  <span className="submit-card__body">Nothing to post yet? Get verified anyway. After that, everything you post goes up the second you hit submit.</span>
                </span>
                <span className="submit-card__arrow">→</span>
              </button>
            )}

            {/* Card 3: Spotted / Suggest an Event */}
            <button type="button" className="submit-card submit-card--orange" onClick={() => goMode("suggest")}>
              <span className="submit-card__icon">
                <svg width="21" height="21" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
              </span>
              <span className="submit-card__main">
                <span className="submit-card__head">
                  <span className="submit-card__title">Spotted an event</span>
                  <span className="submit-card__tag submit-card__tag--ghost">No promoter status needed</span>
                </span>
                <span className="submit-card__body">Saw something we missed? Tell us. We read every tip. Good ones go up as unclaimed listings.</span>
              </span>
              <span className="submit-card__arrow">→</span>
            </button>

            {/* Card 4: Claim an Existing Event */}
            <button type="button" className="submit-card submit-card--neutral" onClick={() => goMode("claim")}>
              <span className="submit-card__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="M4 22V4" /><path d="M4 4h13l-2.5 4L17 12H4" /></svg>
              </span>
              <span className="submit-card__main">
                <span className="submit-card__head">
                  <span className="submit-card__title">Claim an existing event</span>
                  <span className="submit-card__tag">Host access</span>
                </span>
                <span className="submit-card__body">Your event, already on the site, nobody's name on it? Claim it, take the keys, ask for verification while you're at it.</span>
              </span>
              <span className="submit-card__arrow">→</span>
            </button>

            {/* What verified promoters get */}
            <div className="submit-benefits">
              <div className="rainbow-bar rainbow-bar--thick" aria-hidden="true" />
              <div className="submit-benefits__head">
                <h2 className="submit-benefits__title">What verified promoters get</h2>
                <span className="submit-benefits__sticker">Level up</span>
              </div>
              <div className="submit-benefits__grid">
                <div className="submit-benefit submit-benefit--cyan">
                  <span className="submit-benefit__icon"><BoltIcon size={26} /></span>
                  <div className="submit-benefit__title">Go live instantly</div>
                  <p className="submit-benefit__body">No queue, no waiting. Hit submit and it's on the site.</p>
                </div>
                <div className="submit-benefit submit-benefit--magenta">
                  <span className="submit-benefit__icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><path d="m3 11 15-6v14L3 13z" /><path d="M3 11v3h3" /><path d="M8 20v-6" /></svg>
                  </span>
                  <div className="submit-benefit__title">Host tools</div>
                  <p className="submit-benefit__body">Claim your listings, add your co-hosts and talent, pin a broadcast to the top of your event page.</p>
                </div>
                <div className="submit-benefit submit-benefit--yellow">
                  <span className="submit-benefit__icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" {...stroke} aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M14 9h4M14 13h4M6 16c.8-1.4 4.2-1.4 5 0" /></svg>
                  </span>
                  <div className="submit-benefit__title">A promoter profile</div>
                  <p className="submit-benefit__body">Your own page at prideguidepdx.com/u/you. Every event, every link, one address.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Stepper (non-approved submit flow) ── */}
        {showStepper && (
          <div className="submit-form__steps">
            <span className={`submit-form__step ${submitStep === "promoter_app" ? "active" : "done"}`}>1 · Promoter</span>
            <span className="submit-form__step-arrow" aria-hidden="true">→</span>
            <span className={`submit-form__step ${submitStep === "event_details" ? "active" : ""}`}>2 · Event</span>
          </div>
        )}

        {/* ── SUBMIT: Step 1 — Promoter Application (non-approved only) ── */}
        {mode === "submit" && !isApproved && submitStep === "promoter_app" && (
          <div>
            <button type="button" style={backBtnStyle} onClick={backToLanding}>← Back</button>
            <div className="submit-note">
              <div className="submit-note__title">Step 1 of 2 · Promoter application</div>
              <p className="submit-note__body">
                {promoterStatus === "pending"
                  ? "Your promoter application is already in the admin queue. You can still submit your event below — both will be reviewed together."
                  : "Tell us a bit about yourself as a promoter. Once approved, future events you submit go live immediately without review."}
              </p>
            </div>
            <form onSubmit={e => { e.preventDefault(); setSubmitStep("event_details"); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={fieldClass}>
                <label style={labelStyle}>Organization / Event Name (optional)</label>
                <input value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. Queer Night PDX" />
              </div>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Website, Instagram, or portfolio link</label>
                <input value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" placeholder="https://..." />
              </div>
              <div className={`${fieldClass} submit-form__field--magenta`}>
                <label style={labelStyle}>Tell us about you as a promoter *</label>
                <textarea value={promoterForm.appReason} onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))} rows={5} required
                  placeholder="What events do you run or have you run? Your connection to PDX Pride? Any links to your work." style={{ resize: "vertical" }} />
              </div>
              <button type="submit" className="btn-neon solid" style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }}>
                Next, add your event →
              </button>
            </form>
          </div>
        )}

        {/* ── SUBMIT: Event Details (approved users skip straight here) ── */}
        {mode === "submit" && (isApproved || submitStep === "event_details") && (
          <div>
            {eventSubmitSuccess ? (
              <div className="submit-success">
                <div className="submit-success__title">{eventSubmitSuccess.title}</div>
                <p className="submit-success__body" style={{ marginBottom: eventSubmitSuccess.potentialMatches?.length ? 16 : 22 }}>
                  {eventSubmitSuccess.desc}
                </p>
                {eventSubmitSuccess.potentialMatches && eventSubmitSuccess.potentialMatches.length > 0 && (
                  <div style={{ border: "1px solid #444", background: "#111", padding: 14, marginBottom: 22, borderRadius: 3 }}>
                    <p style={{ color: "var(--neon-orange)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                      Similar events in the guide
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 18, color: "#aaa", fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {eventSubmitSuccess.potentialMatches.map(match => (
                        <li key={`${match.title}-${match.venueName}`}>
                          {match.title} @ {match.venueName}
                          {match.confidence === "high" ? " (likely duplicate)" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <button type="button" className="btn-neon solid" onClick={startAnotherEvent}
                    style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }}>
                    Create another event →
                  </button>
                  <button type="button" onClick={finishSubmitFlow} className="submit-hub-link">
                    Back to promoters hub
                  </button>
                </div>
              </div>
            ) : (
            <>
            <button type="button" style={backBtnStyle} onClick={() => isApproved ? backToLanding() : setSubmitStep("promoter_app")}>
              ← {isApproved ? "Back" : "Back to promoter application"}
            </button>
            <form onSubmit={e => { e.preventDefault(); handleSubmitWithEvent(); }} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <ScrollReveal>
              <div style={sectionHeadStyle}>Event details</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className={fieldClass}>
                  <label style={labelStyle}>Event title *</label>
                  <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="Horse Meat Disco" />
                </div>
                <div className={`${fieldClass} submit-form__field--magenta`}>
                  <label style={labelStyle}>Description *</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} required rows={4} placeholder="What's the vibe? Who's it for?" style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className={fieldClass}>
                    <label style={labelStyle}>Venue name *</label>
                    <input value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} required placeholder="Crystal Ballroom" />
                  </div>
                  <div className={`${fieldClass} submit-form__field--cyan`}>
                    <label style={labelStyle}>Neighborhood</label>
                    <select value={eventForm.neighborhood} onChange={e => setEventForm(f => ({ ...f, neighborhood: e.target.value }))}>
                      {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className={fieldClass} style={{ gridColumn: "1/-1" }}>
                    <label style={labelStyle}>Venue address *</label>
                    <input value={eventForm.address} onChange={e => setEventForm(f => ({ ...f, address: e.target.value }))}
                      required={!eventForm.isHouseParty} placeholder={eventForm.isHouseParty ? "Optional for house parties" : "Street address"} />
                  </div>
                  <div className={`${fieldClass} submit-form__field--orange`}>
                    <label style={labelStyle}>Day of week</label>
                    <select value={eventForm.dayOfWeek} onChange={e => {
                      const day = e.target.value;
                      setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultPrideDateTimes(day) }));
                    }}>
                      {PRIDE_WEEK_DAY_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <label style={labelStyle}>Age requirement</label>
                    <select value={eventForm.ageRequirement} onChange={e => setEventForm(f => ({ ...f, ageRequirement: e.target.value }))}>
                      <option value="ALL_AGES">All Ages</option>
                      <option value="18_PLUS">18+</option>
                      <option value="21_PLUS">21+</option>
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <label style={labelStyle}>Start *</label>
                    <input type="datetime-local" value={eventForm.dateStart} onChange={e => setEventForm(f => ({ ...f, dateStart: e.target.value }))} required />
                  </div>
                  <div className={fieldClass}>
                    <label style={labelStyle}>End *</label>
                    <input type="datetime-local" value={eventForm.dateEnd} onChange={e => setEventForm(f => ({ ...f, dateEnd: e.target.value }))} required />
                  </div>
                  <div className={fieldClass}>
                    <label style={labelStyle}>Admission</label>
                    <select value={eventForm.admission} onChange={e => setEventForm(f => ({ ...f, admission: e.target.value }))}>
                      {ADMISSION_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`${fieldClass} submit-form__field--cyan`}>
                    <label style={labelStyle}>Ticket / RSVP link{ticketRequired ? " *" : ""}</label>
                    <input value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://eventbrite.com/..." required={ticketRequired} />
                    <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: 4 }}>
                      {ticketRequired
                        ? "Required for ticketed events."
                        : admissionHint || "Optional — add a link if you have one."}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Event flyer / poster (optional)</label>
                  <ImageUploader endpoint="/api/upload/poster" fieldName="poster" currentUrl={eventForm.posterImageUrl}
                    onUploaded={url => setEventForm(f => ({ ...f, posterImageUrl: url }))} label="Upload flyer" />
                </div>
              </div>
              </ScrollReveal>

              <ScrollReveal delay={40}>
              <div style={sectionHeadStyle}>Event types</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EVENT_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => toggleType(t)} className={`filter-tag ${eventForm.selectedTypes.includes(t) ? "active" : ""}`}>{t}</button>
                ))}
              </div>
              </ScrollReveal>

              <ScrollReveal delay={60}>
              <div style={sectionHeadStyle}>Event flags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <EventTypeTag label="HOUSE PARTY" interactive active={eventForm.isHouseParty} onClick={() => setEventForm(f => ({ ...f, isHouseParty: !f.isHouseParty }))} testId="toggle-house-party" />
                <EventTypeTag label="SEX POSITIVE" interactive active={eventForm.isSexPositive} onClick={() => setEventForm(f => ({ ...f, isSexPositive: !f.isSexPositive }))} testId="toggle-sex-positive" />
                <EventTypeTag label="NUDITY OK" interactive active={eventForm.nudityOk} onClick={() => setEventForm(f => ({ ...f, nudityOk: !f.nudityOk }))} testId="toggle-nudity-ok" />
              </div>
              {eventForm.isHouseParty && (
                <div className="submit-warning" data-testid="house-party-warning">
                  <span className="submit-warning__mark" aria-hidden="true">⚠</span>
                  <div>
                    <div className="submit-warning__title">Heads up, house parties are public</div>
                    <div className="submit-warning__body">
                      We don't have a way to do invite-only. Anyone browsing the guide can see it and show up. Only post if you're genuinely open to the community attending.
                    </div>
                  </div>
                </div>
              )}
              </ScrollReveal>

              <ScrollReveal delay={80}>
              <div style={sectionHeadStyle}>Review &amp; submit</div>
              <p style={{ color: "#8f8c87", fontSize: "0.84rem", lineHeight: 1.6, margin: "0 0 16px" }}>
                {isApproved
                  ? "You're verified. Your event goes live immediately after submitting."
                  : "Both your promoter application and this event go to the admin queue, approved together."}
              </p>
              <button type="submit" disabled={eventMutation.isPending} className="btn-neon solid"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }} data-testid="submit-button">
                {eventMutation.isPending ? "Submitting..." : isApproved ? "Submit Event →" : "Submit Event + Promoter Application →"}
              </button>
              </ScrollReveal>
            </form>
            </>
            )}
          </div>
        )}

        {/* ── APPLY AS PROMOTER ── */}
        {mode === "apply" && (flowSuccess === "apply" ? (
          <div className="submit-success submit-success--cyan">
            <div className="submit-success__title">Application submitted!</div>
            <p className="submit-success__body">Admins will review your promoter request and be in touch. You'll get a message when you're approved.</p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to promoters hub</button>
          </div>
        ) : (
          <div>
            <button type="button" style={backBtnStyle} onClick={backToLanding}>← Back</button>
            {promoterStatus === "pending" && (
              <div className="submit-note submit-note--cyan">
                <div className="submit-note__title">Application already submitted</div>
                <p className="submit-note__body">Your promoter application is in the admin queue. You'll be notified when it's reviewed.</p>
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } applyMutation.mutate(); }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ ...sectionHeadStyle, color: "var(--neon-cyan)" }}>Promoter application</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className={fieldClass}>
                  <label style={labelStyle}>Your name</label>
                  <input value={user?.displayName || user?.username || ""} placeholder="Log in to autofill" disabled style={{ opacity: 0.6 }} />
                </div>
                <div className={fieldClass}>
                  <label style={labelStyle}>Email</label>
                  <input value={user?.email || ""} placeholder="Log in to autofill" disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
              <div className={fieldClass}>
                <label style={labelStyle}>Organization / Event Name (optional)</label>
                <input value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. Queer Night PDX" />
              </div>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Website, Instagram, or portfolio link</label>
                <input value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" placeholder="https://..." />
              </div>
              <div className={`${fieldClass} submit-form__field--magenta`}>
                <label style={labelStyle}>Tell us about you as a promoter *</label>
                <textarea value={promoterForm.appReason} onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))} rows={6} required
                  placeholder="What events do you run or have you run? Your connection to PDX Pride? Any links, social pages, or proof of your work." style={{ resize: "vertical" }} />
              </div>
              <button type="submit" disabled={applyMutation.isPending} className="btn-neon solid solid-cyan"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }}>
                {applyMutation.isPending ? "Submitting..." : "Submit promoter application →"}
              </button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center" }}>
                Admins will review your application. You'll get a message when approved.
              </p>
            </form>
          </div>
        ))}

        {/* ── SUGGEST AN EVENT ── */}
        {mode === "suggest" && (flowSuccess === "suggest" ? (
          <div className="submit-success submit-success--magenta">
            <div className="submit-success__title">Tip received!</div>
            <p className="submit-success__body">Admins will review and may add this event to the guide. Thanks for the heads up.</p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to promoters hub</button>
          </div>
        ) : (
          <div>
            <button type="button" style={backBtnStyle} onClick={backToLanding}>← Back</button>
            <div className="submit-note submit-note--orange">
              <div className="submit-note__title">No promoter account needed</div>
              <p className="submit-note__body">Tip us off, admins review all suggestions. If approved, the event goes live as an unclaimed listing anyone can claim.</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "SUGGEST" }); }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className={`${fieldClass} submit-form__field--orange`}>
                <label style={labelStyle}>Event name *</label>
                <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Queer Dance Night at Wonder Ballroom" />
              </div>
              <div className={fieldClass}>
                <label style={labelStyle}>Venue / location (if known)</label>
                <input value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} placeholder="Venue name or neighborhood" />
              </div>
              <div className={`${fieldClass} submit-form__field--orange`}>
                <label style={labelStyle}>Day</label>
                <select value={eventForm.dayOfWeek} onChange={e => {
                  const day = e.target.value;
                  setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultPrideDateTimes(day) }));
                }}>
                  {PRIDE_WEEK_DAY_OPTIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Ticket / info link (if you have it)</label>
                <input value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://..." />
              </div>
              <div className={fieldClass}>
                <label style={labelStyle}>Where did you spot this?</label>
                <textarea value={promoterForm.suggestNote} onChange={e => setPromoterForm(f => ({ ...f, suggestNote: e.target.value }))} rows={3}
                  placeholder="Instagram, flyer, word of mouth, any context helps." style={{ resize: "vertical" }} />
              </div>
              <button type="submit" disabled={eventMutation.isPending} className="btn-neon solid solid-magenta"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }}>
                {eventMutation.isPending ? "Sending..." : "Send tip →"}
              </button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center" }}>
                Tips go to admins only, not publicly posted.
              </p>
            </form>
          </div>
        ))}

        {/* ── CLAIM EXISTING EVENT ── */}
        {mode === "claim" && (flowSuccess === "claim" ? (
          <div className="submit-success submit-success--cyan">
            <div className="submit-success__title">{isApproved ? "Event claimed!" : "Claim submitted!"}</div>
            <p className="submit-success__body">
              {isApproved ? "You're now the host of this event, it's live on your profile." : "Your claim is pending admin review."}
            </p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to promoters hub</button>
          </div>
        ) : (
          <div>
            <button type="button" style={backBtnStyle} onClick={backToLanding}>← Back</button>
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "CLAIM" }); }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ ...sectionHeadStyle, color: "var(--neon-cyan)" }}>Claim details</div>
              <p style={{ color: "#8f8c87", fontSize: "0.84rem", lineHeight: 1.55, margin: 0 }}>
                {isApproved
                  ? "As a verified promoter, your claim goes live immediately, no admin review."
                  : "Claiming also requests verified promoter status so you can post new listings after approval."}
              </p>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Event to claim *</label>
                <select value={promoterForm.claimEventId} onChange={e => setPromoterForm(f => ({ ...f, claimEventId: e.target.value }))} required data-testid="select-claim-event">
                  <option value="">Select an unclaimed event...</option>
                  {unclaimedEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title} · {ev.venueName} · {ev.dayOfWeek || "TBD"}</option>
                  ))}
                </select>
                {unclaimedError ? (
                  <div style={{ fontSize: "0.76rem", color: "#FF6600", marginTop: 6 }}>
                    Could not load unclaimed events.{" "}
                    <button type="button" onClick={() => refetchUnclaimed()} style={{ background: "none", border: "none", color: "var(--neon-yellow)", cursor: "pointer", padding: 0, fontFamily: "var(--font-display)", fontSize: "0.76rem" }}>Retry</button>
                  </div>
                ) : unclaimedEvents.length === 0 && (
                  <div style={{ fontSize: "0.76rem", color: "var(--text-meta)", marginTop: 6 }}>No unclaimed events are available right now.</div>
                )}
              </div>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>How are you connected to this event? *</label>
                <textarea value={promoterForm.claimReason} onChange={e => setPromoterForm(f => ({ ...f, claimReason: e.target.value }))} rows={4} required
                  placeholder="Tell us your organizer role and include a website, ticketing dashboard, social link, or other proof." style={{ resize: "vertical" }} />
              </div>
              <button type="submit" disabled={eventMutation.isPending} className="btn-neon solid solid-cyan"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }} data-testid="submit-button">
                {eventMutation.isPending ? "Submitting..." : isApproved ? "Claim This Event →" : "Submit Claim + Promoter Request →"}
              </button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center" }}>
                {isApproved ? "Your claim goes live immediately." : "All claims are reviewed before going live."}
              </p>
            </form>
          </div>
        ))}

      </div>
    </div>
  );
}
