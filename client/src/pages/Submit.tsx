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
import type { PageHeroAccent } from "@/components/PageHero";
import BoardHero from "@/components/BoardHero";
import BoardHowItWorks from "@/components/BoardHowItWorks";
import BoardStatsBar from "@/components/BoardStatsBar";
import { BoardFilterChip } from "@/components/BoardActiveSection";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ds";
import { usePageSeo } from "@/hooks/usePageSeo";
import { ADMISSION_OPTIONS, admissionRequiresTicketUrl } from "@shared/admission";
import { SUBMIT_EVENT_TYPE_OPTIONS, submitLabelsToJsonTags } from "@shared/eventTypeTags";
import { PRIDE_WEEK_DAY_OPTIONS, defaultPrideDateTimes } from "@shared/prideWeek";

const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];
const EVENT_TYPES = SUBMIT_EVENT_TYPE_OPTIONS.map(opt => opt.label);

const SUBMIT_RETURN_KEY = "pdx-submit-return";

const sectionHeadStyle: React.CSSProperties = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", letterSpacing: "0.03em", textTransform: "uppercase", color: "var(--neon-yellow)", marginBottom: 14, borderBottom: "1px solid var(--ink-border-faint)", paddingBottom: 8 };

type PageMode = "landing" | "submit" | "apply" | "suggest" | "claim";
type SubmitStep = "promoter_app" | "event_details";
type FlowSuccess = "apply" | "suggest" | "claim";

type SubmitReturnState = {
  mode: PageMode;
  submitStep: SubmitStep;
};

/* ── Inline line-glyph icon stroke set (matches the brand icon system) ── */
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
    "Promoters — Submit & Claim Events | PDX Pride Guide",
    "Submit Pride Week events, apply as a verified promoter, claim listings, or tip the guide about something we missed.",
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
  const initialMode: PageMode = (claimPathEventId || params.get("mode") === "claim")
    ? "claim"
    : params.get("mode") === "apply" ? "apply" : "landing";
  const venueForApply = params.get("venue") || "";

  const [mode, setMode] = useState<PageMode>(initialMode);
  const [submitStep, setSubmitStep] = useState<SubmitStep>("promoter_app");
  const [eventForm, setEventForm] = useState(emptyEventForm());
  const [promoterForm, setPromoterForm] = useState({
    ...emptyPromoterForm(),
    claimEventId: claimPathEventId,
    appReason: venueForApply ? `I want to promote/manage events at ${venueForApply}. ` : "",
  });
  const [submitterOrg, setSubmitterOrg] = useState("");

  const promoterStatus = user?.promoterStatus || "none";
  const isApproved = promoterStatus === "approved" || !!user?.isAdmin;

  const { data: unclaimedEvents = [], isError: unclaimedError, refetch: refetchUnclaimed } = useQuery<Event[]>({
    queryKey: ["/api/events/unclaimed"],
    queryFn: () => apiRequest("GET", "/api/events/unclaimed").then(r => r.json()),
  });

  const { data: allEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
  });
  const venueCount = new Set(allEvents.map(ev => ev.venueName)).size;

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
      title: "Promoters",
      accent: "lime",
      lede: "Got an event? Want to be a verified promoter? Spotted something we are missing? Pick your path below.",
    },
    submit: {
      kicker: "New listing",
      title: "Submit an Event",
      accent: "lime",
      lede: "Add your Pride Week event to the guide. Verified promoters go live immediately. New accounts enter the review queue.",
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
      lede: "Saw a Pride event we are missing? Tip us off. No promoter account needed. Admins review every suggestion.",
    },
    claim: {
      kicker: "Host your listing",
      title: "Claim an Event",
      accent: "cyan",
      lede: "Already listed but unclaimed? Take ownership to manage your event and connect with the community.",
    },
  };
  const hero = heroCopy[mode];

  const ticketRequired = admissionRequiresTicketUrl(eventForm.admission);
  const admissionHint = ADMISSION_OPTIONS.find(o => o.value === eventForm.admission)?.hint;

  const showStepper = !isApproved && mode === "submit" && submitStep && !eventSubmitSuccess;

  const HOW_IT_WORKS = [
    { title: "Pick a path", body: "Submit, apply, tip, or claim. Four doors, one hub.", color: "#ccff00" },
    { title: "Tell us who you are", body: "Log in free. Verified promoters skip the queue later.", color: "#19e3ff" },
    { title: "Send it in", body: "Events and tips go to review. Verified posts go live now.", color: "#ff1fa0" },
    { title: "Own the listing", body: "Hosts, talent, broadcasts, and your public profile.", color: "#ff8c00" },
  ];

  return (
    <div className="zine-page submit-page board-page board-page--makeover">
      {showAuth && !user && <AuthModal onClose={closeAuth} defaultTab="register" />}

      {mode === "landing" ? (
        <BoardHero
          accent="lime"
          kicker={hero.kicker}
          title={<>Promoter <span className="board-hero__title-accent">hub</span></>}
          lede={hero.lede}
          actions={
            <>
              <Button variant="solid" accent="lime" size="lg" arrow onClick={() => goMode("submit")}>
                {isApproved ? "Submit an event" : "Submit + apply"}
              </Button>
              {!isApproved && (
                <Button variant="neon" accent="cyan" size="lg" onClick={() => goMode("apply")}>
                  Apply as promoter
                </Button>
              )}
            </>
          }
        />
      ) : (
        <PageHeader
          section="Promoters"
          title={hero.title}
          titleAccent={hero.accent}
          kicker={hero.kicker}
          lede={hero.lede}
        />
      )}

      {mode === "landing" && (
        <BoardStatsBar
          variant="band"
          showLive={false}
          stats={[
            { num: allEvents.length, label: "Live in the guide", color: "#ccff00" },
            { num: unclaimedEvents.length, label: "Unclaimed, open to grab", color: "#19e3ff" },
            { num: venueCount, label: "Venues repping Pride", color: "#ff1fa0" },
          ]}
        />
      )}

      <div className="submit-page__body">

        {/* ── LANDING ── */}
        {mode === "landing" && (
          <div className="submit-stack submit-stack--makeover">

            {/* Status banners */}
            {isApproved && (
              <div className="submit-banner">
                <span className="submit-banner__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} strokeWidth={2.4} aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <div>
                  <div className="submit-banner__title">Verified promoter</div>
                  <p className="submit-banner__body">You are verified. New events you submit go live immediately, no review queue.</p>
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
                  <p className="submit-banner__body">Your promoter application is in the admin queue. You will get a message when it is reviewed.</p>
                </div>
              </div>
            )}
            {!user && (
              <div className="submit-banner submit-banner--yellow submit-banner--stacked">
                <div>
                  <div className="submit-banner__title">Account required</div>
                  <p className="submit-banner__body">Create a free account or log in to submit, apply, or suggest. It takes a minute.</p>
                  <Button variant="solid" accent="lime" className="submit-banner__cta" onClick={() => openAuth()}>
                    Log in / Join
                  </Button>
                </div>
              </div>
            )}

            <div className="board-steps board-steps--makeover submit-mode-steps" role="list">
              {/* Step 1: Submit New Event */}
              <button type="button" className="board-step board-step--makeover submit-mode-step" onClick={() => goMode("submit")} role="listitem">
                <span className="board-step__num" style={{ color: "#ccff00" }} aria-hidden="true">1</span>
                <h3 className="display panel-heading">{isApproved ? "Submit new event" : "Submit an event + become a promoter"}</h3>
                <p>
                  <span style={{ color: "#ccff00", fontWeight: 700 }}>
                    {isApproved ? "Goes live instantly. " : "2 steps, first-time review. "}
                  </span>
                  {isApproved
                    ? "You are a verified promoter. Your event goes live the moment you submit."
                    : "Short promoter application, then your event. Both go to admin review and go live together once approved."}
                </p>
              </button>

              {!isApproved && (
                <button type="button" className="board-step board-step--makeover submit-mode-step" style={{ ["--card-accent" as string]: "#19e3ff" }} onClick={() => goMode("apply")} role="listitem">
                  <span className="board-step__num" style={{ color: "#19e3ff" }} aria-hidden="true">2</span>
                  <h3 className="display panel-heading">Apply as promoter</h3>
                  <p>
                    <span style={{ color: "#19e3ff", fontWeight: 700 }}>Verification. </span>
                    Not ready to post yet? Get verified now. Once approved, future events go live immediately.
                  </p>
                </button>
              )}

              <button type="button" className="board-step board-step--makeover submit-mode-step" style={{ ["--card-accent" as string]: "#ff1fa0" }} onClick={() => goMode("suggest")} role="listitem">
                <span className="board-step__num" style={{ color: "#ff1fa0" }} aria-hidden="true">{isApproved ? 2 : 3}</span>
                <h3 className="display panel-heading">Spotted an event</h3>
                <p>
                  <span style={{ color: "#ff1fa0", fontWeight: 700 }}>No promoter status needed. </span>
                  Saw a Pride event we are missing? Tip us off. Admins review all tips. Approved ones go live as unclaimed listings.
                </p>
              </button>

              <button type="button" className="board-step board-step--makeover submit-mode-step" style={{ ["--card-accent" as string]: "#8c8980" }} onClick={() => goMode("claim")} role="listitem">
                <span className="board-step__num" style={{ color: "#8c8980" }} aria-hidden="true">{isApproved ? 3 : 4}</span>
                <h3 className="display panel-heading">Claim an existing event</h3>
                <p>
                  <span style={{ color: "#c8c5bc", fontWeight: 700 }}>Host access. </span>
                  See your event already listed but unclaimed? Claim it for host access and request promoter verification.
                </p>
              </button>
            </div>

            <ScrollReveal>
              <BoardHowItWorks
                className="submit-how"
                kickerTone="cyan"
                title={<>How the promoter <span className="board-how__title-accent">hub</span> works</>}
                lede="One place to get events on the map, get verified, tip the team, or claim a listing that is already up."
                steps={HOW_IT_WORKS}
                footerLine="Free forever · community run · no corporate gate"
              />
            </ScrollReveal>

            {/* What verified promoters get */}
            <ScrollReveal>
              <BoardHowItWorks
                className="submit-benefits-how"
                kicker="Level up"
                kickerTone="lime"
                title="What verified promoters get"
                lede="The perks that kick in once you're approved."
                steps={[
                  { title: "Go live instantly", body: "Skip the review queue. Every event you post publishes the moment you hit submit.", color: "#19e3ff" },
                  { title: "Host tools", body: "Claim your listings, add co-hosts and talent, and pin host broadcasts on your event page.", color: "#ff1fa0" },
                  { title: "A promoter profile", body: "Your own public page at prideguidepdx.com/u/you, with every event and link in one spot.", color: "#ccff00" },
                ]}
              />
            </ScrollReveal>
          </div>
        )}

        {/* ── Stepper (non-approved submit flow) ── */}
        {showStepper && (
          <div className="submit-mini-steps">
            <span className={`submit-mini-step${submitStep === "promoter_app" ? " is-active" : " is-done"}`}>
              <span className="submit-mini-step__num" aria-hidden="true">1</span> Promoter
            </span>
            <span className="submit-mini-step-arrow" aria-hidden="true">→</span>
            <span className={`submit-mini-step${submitStep === "event_details" ? " is-active" : ""}`}>
              <span className="submit-mini-step__num" aria-hidden="true">2</span> Event
            </span>
          </div>
        )}

        {/* ── SUBMIT: Step 1 — Promoter Application (non-approved only) ── */}
        {mode === "submit" && !isApproved && submitStep === "promoter_app" && (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back</button>
            <div className="board-section-kicker board-section-kicker--lime">Step 1 of 2</div>
            <h2 className="display section-heading">Promoter application</h2>
            <p className="board-copy-sm">
              {promoterStatus === "pending"
                ? "Your promoter application is already in the admin queue. You can still submit your event below — both will be reviewed together."
                : "Tell us a bit about yourself as a promoter. Once approved, future events you submit go live immediately without review."}
            </p>
            <form onSubmit={e => { e.preventDefault(); setSubmitStep("event_details"); }}>
              <div className="gifting-form-grid">
                <label className="span">
                  Organization / Event Name (optional)
                  <input className="board-text-field" value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. Queer Night PDX" />
                </label>
                <label className="span">
                  Website, Instagram, or portfolio link
                  <input className="board-text-field" value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" placeholder="https://..." />
                </label>
                <label className="span">
                  Tell us about you as a promoter *
                  <textarea className="board-text-field" value={promoterForm.appReason} onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))} rows={5} required
                    placeholder="What events do you run or have you run? Your connection to PDX Pride? Any links to your work." style={{ resize: "vertical" }} />
                </label>
              </div>
              <Button type="submit" variant="solid" accent="lime" size="lg" arrow block>
                Next, add your event
              </Button>
            </form>
          </section>
        )}

        {/* ── SUBMIT: Event Details (approved users skip straight here) ── */}
        {mode === "submit" && (isApproved || submitStep === "event_details") && (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            {eventSubmitSuccess ? (
              <div className="submit-success">
                <div className="submit-success__title">{eventSubmitSuccess.title}</div>
                <p className="submit-success__body" style={{ marginBottom: eventSubmitSuccess.potentialMatches?.length ? 16 : 22 }}>
                  {eventSubmitSuccess.desc}
                </p>
                {eventSubmitSuccess.potentialMatches && eventSubmitSuccess.potentialMatches.length > 0 && (
                  <div style={{ border: "1px solid #444", background: "var(--ink-850)", padding: 14, marginBottom: 22, borderRadius: 3 }}>
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
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={() => isApproved ? backToLanding() : setSubmitStep("promoter_app")}>
              ← {isApproved ? "Back" : "Back to promoter application"}
            </button>
            <form onSubmit={e => { e.preventDefault(); handleSubmitWithEvent(); }} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <ScrollReveal>
              <div style={sectionHeadStyle}>Event details</div>
              <div className="gifting-form-grid">
                <label className="span">
                  Event title *
                  <input className="board-text-field" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="Horse Meat Disco" />
                </label>
                <label className="span">
                  Description *
                  <textarea className="board-text-field" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} required rows={4} placeholder="What's the vibe? Who's it for?" style={{ resize: "vertical" }} />
                </label>
                <label>
                  Venue name *
                  <input className="board-text-field" value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} required placeholder="Crystal Ballroom" />
                </label>
                <label>
                  Neighborhood
                  <select className="board-text-field" value={eventForm.neighborhood} onChange={e => setEventForm(f => ({ ...f, neighborhood: e.target.value }))}>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="span">
                  Venue address *
                  <input className="board-text-field" value={eventForm.address} onChange={e => setEventForm(f => ({ ...f, address: e.target.value }))}
                    required={!eventForm.isHouseParty} placeholder={eventForm.isHouseParty ? "Optional for house parties" : "Street address"} />
                </label>
                <label>
                  Day of week
                  <select className="board-text-field" value={eventForm.dayOfWeek} onChange={e => {
                    const day = e.target.value;
                    setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultPrideDateTimes(day) }));
                  }}>
                    {PRIDE_WEEK_DAY_OPTIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Age requirement
                  <select className="board-text-field" value={eventForm.ageRequirement} onChange={e => setEventForm(f => ({ ...f, ageRequirement: e.target.value }))}>
                    <option value="ALL_AGES">All Ages</option>
                    <option value="18_PLUS">18+</option>
                    <option value="21_PLUS">21+</option>
                  </select>
                </label>
                <label>
                  Start *
                  <input className="board-text-field" type="datetime-local" value={eventForm.dateStart} onChange={e => setEventForm(f => ({ ...f, dateStart: e.target.value }))} required />
                </label>
                <label>
                  End *
                  <input className="board-text-field" type="datetime-local" value={eventForm.dateEnd} onChange={e => setEventForm(f => ({ ...f, dateEnd: e.target.value }))} required />
                </label>
                <label>
                  Admission
                  <select className="board-text-field" value={eventForm.admission} onChange={e => setEventForm(f => ({ ...f, admission: e.target.value }))}>
                    {ADMISSION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Ticket / RSVP link{ticketRequired ? " *" : ""}
                  <input className="board-text-field" value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://eventbrite.com/..." required={ticketRequired} />
                  <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: 4, textTransform: "none", letterSpacing: "normal" }}>
                    {ticketRequired
                      ? "Required for ticketed events."
                      : admissionHint || "Optional — add a link if you have one."}
                  </div>
                </label>
                <label className="span">
                  Event flyer / poster (optional)
                  <ImageUploader endpoint="/api/upload/poster" fieldName="poster" currentUrl={eventForm.posterImageUrl}
                    onUploaded={url => setEventForm(f => ({ ...f, posterImageUrl: url }))} label="Upload flyer" />
                </label>
              </div>
              </ScrollReveal>

              <ScrollReveal delay={40}>
              <div style={sectionHeadStyle}>Event types</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EVENT_TYPES.map(t => (
                  <BoardFilterChip key={t} active={eventForm.selectedTypes.includes(t)} onClick={() => toggleType(t)} accent="lime">
                    {t}
                  </BoardFilterChip>
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
              <Button type="submit" disabled={eventMutation.isPending} variant="solid" accent="lime" size="lg" arrow block data-testid="submit-button">
                {eventMutation.isPending ? "Submitting..." : isApproved ? "Submit Event" : "Submit Event + Promoter Application"}
              </Button>
              </ScrollReveal>
            </form>
            </>
            )}
          </section>
        )}

        {/* ── APPLY AS PROMOTER ── */}
        {mode === "apply" && (flowSuccess === "apply" ? (
          <div className="submit-success submit-success--cyan">
            <div className="submit-success__title">Application submitted!</div>
            <p className="submit-success__body">Admins will review your promoter request and be in touch. You will get a message when you are approved.</p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to promoters hub</button>
          </div>
        ) : (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back</button>
            <div className="board-section-kicker board-section-kicker--cyan">Promoter verification</div>
            <h2 className="display section-heading">Promoter application</h2>
            {promoterStatus === "pending" && (
              <p className="board-copy-sm">Your promoter application is in the admin queue. You'll be notified when it's reviewed.</p>
            )}
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } applyMutation.mutate(); }}>
              <div className="gifting-form-grid">
                <label>
                  Your name
                  <input className="board-text-field" value={user?.displayName || user?.username || ""} placeholder="Log in to autofill" disabled style={{ opacity: 0.6 }} />
                </label>
                <label>
                  Email
                  <input className="board-text-field" value={user?.email || ""} placeholder="Log in to autofill" disabled style={{ opacity: 0.6 }} />
                </label>
                <label className="span">
                  Organization / Event Name (optional)
                  <input className="board-text-field" value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. Queer Night PDX" />
                </label>
                <label className="span">
                  Website, Instagram, or portfolio link
                  <input className="board-text-field" value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" placeholder="https://..." />
                </label>
                <label className="span">
                  Tell us about you as a promoter *
                  <textarea className="board-text-field" value={promoterForm.appReason} onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))} rows={6} required
                    placeholder="What events do you run or have you run? Your connection to PDX Pride? Any links, social pages, or proof of your work." style={{ resize: "vertical" }} />
                </label>
              </div>
              <Button type="submit" disabled={applyMutation.isPending} variant="solid" accent="cyan" size="lg" arrow block>
                {applyMutation.isPending ? "Submitting..." : "Submit promoter application"}
              </Button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 14 }}>
                Admins will review your application. You'll get a message when approved.
              </p>
            </form>
          </section>
        ))}

        {/* ── SUGGEST AN EVENT ── */}
        {mode === "suggest" && (flowSuccess === "suggest" ? (
          <div className="submit-success submit-success--magenta">
            <div className="submit-success__title">Tip received!</div>
            <p className="submit-success__body">Admins will review and may add this event to the guide. Thanks for the heads up.</p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to promoters hub</button>
          </div>
        ) : (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back</button>
            <div className="board-section-kicker board-section-kicker--magenta">Community tip</div>
            <h2 className="display section-heading">Suggest an event</h2>
            <p className="board-copy-sm">Tip us off, admins review all suggestions. If approved, the event goes live as an unclaimed listing anyone can claim.</p>
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "SUGGEST" }); }}>
              <div className="gifting-form-grid">
                <label className="span">
                  Event name *
                  <input className="board-text-field" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Queer Dance Night at Wonder Ballroom" />
                </label>
                <label>
                  Venue / location (if known)
                  <input className="board-text-field" value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} placeholder="Venue name or neighborhood" />
                </label>
                <label>
                  Day
                  <select className="board-text-field" value={eventForm.dayOfWeek} onChange={e => {
                    const day = e.target.value;
                    setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultPrideDateTimes(day) }));
                  }}>
                    {PRIDE_WEEK_DAY_OPTIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </label>
                <label className="span">
                  Ticket / info link (if you have it)
                  <input className="board-text-field" value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://..." />
                </label>
                <label className="span">
                  Where did you spot this?
                  <textarea className="board-text-field" value={promoterForm.suggestNote} onChange={e => setPromoterForm(f => ({ ...f, suggestNote: e.target.value }))} rows={3}
                    placeholder="Instagram, flyer, word of mouth, any context helps." style={{ resize: "vertical" }} />
                </label>
              </div>
              <Button type="submit" disabled={eventMutation.isPending} variant="solid" accent="pink" size="lg" arrow block>
                {eventMutation.isPending ? "Sending..." : "Send tip"}
              </Button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 14 }}>
                Tips go to admins only, not publicly posted.
              </p>
            </form>
          </section>
        ))}

        {/* ── CLAIM EXISTING EVENT ── */}
        {mode === "claim" && (flowSuccess === "claim" ? (
          <div className="submit-success submit-success--cyan">
            <div className="submit-success__title">{isApproved ? "Event claimed!" : "Claim submitted!"}</div>
            <p className="submit-success__body">
              {isApproved ? "You are now the host of this event. It is live on your profile." : "Your claim is pending admin review."}
            </p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to promoters hub</button>
          </div>
        ) : (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back</button>
            <div className="board-section-kicker board-section-kicker--cyan">Host your listing</div>
            <h2 className="display section-heading">Claim details</h2>
            <p className="board-copy-sm">
              {isApproved
                ? "As a verified promoter, your claim goes live immediately, no admin review."
                : "Claiming also requests verified promoter status so you can post new listings after approval."}
            </p>
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "CLAIM" }); }}>
              <div className="gifting-form-grid">
                <label className="span">
                  Event to claim *
                  <select className="board-text-field" value={promoterForm.claimEventId} onChange={e => setPromoterForm(f => ({ ...f, claimEventId: e.target.value }))} required data-testid="select-claim-event">
                    <option value="">Select an unclaimed event...</option>
                    {unclaimedEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title} · {ev.venueName} · {ev.dayOfWeek || "TBD"}</option>
                    ))}
                  </select>
                  {unclaimedError ? (
                    <div style={{ fontSize: "0.76rem", color: "var(--neon-orange)", marginTop: 6, textTransform: "none", letterSpacing: "normal" }}>
                      Could not load unclaimed events.{" "}
                      <button type="button" onClick={() => refetchUnclaimed()} style={{ background: "none", border: "none", color: "var(--neon-yellow)", cursor: "pointer", padding: 0, fontFamily: "var(--font-display)", fontSize: "0.76rem" }}>Retry</button>
                    </div>
                  ) : unclaimedEvents.length === 0 && (
                    <div style={{ fontSize: "0.76rem", color: "var(--text-meta)", marginTop: 6, textTransform: "none", letterSpacing: "normal" }}>No unclaimed events are available right now.</div>
                  )}
                </label>
                <label className="span">
                  How are you connected to this event? *
                  <textarea className="board-text-field" value={promoterForm.claimReason} onChange={e => setPromoterForm(f => ({ ...f, claimReason: e.target.value }))} rows={4} required
                    placeholder="Tell us your organizer role and include a website, ticketing dashboard, social link, or other proof." style={{ resize: "vertical" }} />
                </label>
              </div>
              <Button type="submit" disabled={eventMutation.isPending} variant="solid" accent="cyan" size="lg" arrow block data-testid="submit-button">
                {eventMutation.isPending ? "Submitting..." : isApproved ? "Claim This Event" : "Submit Claim + Promoter Request"}
              </Button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 14 }}>
                {isApproved ? "Your claim goes live immediately." : "All claims are reviewed before going live."}
              </p>
            </form>
          </section>
        ))}

      </div>

      {mode === "landing" && (
        <BoardCloseSeam
          line="Submit it. Claim it. Keep Portland queer."
          url="prideguidepdx.com/submit"
        />
      )}
    </div>
  );
}
