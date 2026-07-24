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
import BoardStatsBar from "@/components/BoardStatsBar";
import { BoardFilterChip } from "@/components/BoardActiveSection";
import BoardCloseSeam from "@/components/BoardCloseSeam";
import ScrollReveal from "@/components/ScrollReveal";
import { Button } from "@/components/ds";
import PromoterIntake, {
  type PromoterIntakeAction,
  type PromoterIntakeActionKey,
} from "@/components/promoter/PromoterIntake";
import { usePageSeo } from "@/hooks/usePageSeo";
import { ADMISSION_OPTIONS, admissionRequiresTicketUrl } from "@shared/admission";
import { SUBMIT_EVENT_TYPE_OPTIONS, submitLabelsToJsonTags } from "@shared/eventTypeTags";
import { PRIDE_WEEK_DAY_OPTIONS, defaultPrideDateTimes } from "@shared/prideWeek";

const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];
const EVENT_TYPES = SUBMIT_EVENT_TYPE_OPTIONS.map(opt => opt.label);

const SUBMIT_RETURN_KEY = "pdx-submit-return";

const sectionHeadStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: "1.05rem",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: "var(--panel-lime, #c8fa3c)",
  marginBottom: 14,
  borderBottom: "1px solid var(--panel-border, #1c1c22)",
  paddingBottom: 8,
};

const aboutYouHeadStyle: React.CSSProperties = {
  ...sectionHeadStyle,
  color: "var(--panel-purple, #b06bff)",
};

type PageMode = "landing" | "submit" | "apply" | "suggest" | "claim";
/** Kept for auth-return restore only; submit is a single page now. */
type SubmitStep = "promoter_app" | "event_details";
type FlowSuccess = "apply" | "suggest" | "claim";

type SubmitReturnState = {
  mode: PageMode;
  submitStep: SubmitStep;
};

type StatusChip = { label: string; color: string };

function liveChip(isVerified: boolean): StatusChip {
  return isVerified
    ? { label: "Goes live now", color: "var(--panel-lime, #c8fa3c)" }
    : { label: "Reviewed first", color: "var(--panel-cyan, #19e3ff)" };
}

function StatusChipEl({ chip }: { chip: StatusChip }) {
  return (
    <span className="submit-status-chip" style={{ background: chip.color }}>
      {chip.label}
    </span>
  );
}

type PathDef = {
  key: PageMode;
  title: string;
  forWho: string;
  outcome: string;
  accent: string;
  chip: StatusChip;
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
    "Promoter hub | PDX Pride Guide",
    "Submit events, claim listings, apply as a verified promoter, or tip the guide about something we missed.",
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
  const [flyerReadStatus, setFlyerReadStatus] = useState<"idle" | "reading" | "filled" | "error">("idle");

  // Upload a flyer → read it (OCR + vision) → fill blank fields for review.
  // Never clobbers anything the user already typed; dates come from the flyer
  // when present (the form's default date is only a placeholder).
  const handleFlyerUploaded = async (url: string) => {
    setEventForm(f => ({ ...f, posterImageUrl: url }));
    setFlyerReadStatus("reading");
    try {
      const r = await apiRequest("POST", "/api/flyer-autofill", { uploadUrl: url });
      if (!r.ok) {
        setFlyerReadStatus("error");
        return;
      }
      const data = await r.json();
      const fields = data?.fields || {};
      setEventForm(f => ({
        ...f,
        title: f.title || fields.title || "",
        description: f.description || fields.description || "",
        venueName: f.venueName || fields.venueName || "",
        address: f.address || fields.address || "",
        ticketUrl: f.ticketUrl || fields.ticketUrl || "",
        ...(fields.dateStart ? { dateStart: fields.dateStart } : {}),
        ...(fields.dateEnd ? { dateEnd: fields.dateEnd } : {}),
      }));
      setFlyerReadStatus("filled");
    } catch {
      setFlyerReadStatus("error");
    }
  };
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
    // Single-page submit: no step navigation (submitStep kept only for auth restore).
    if (m === "submit") setSubmitStep(isApproved ? "event_details" : "promoter_app");
  };

  const backToLanding = () => setMode("landing");
  const submitChip = liveChip(isApproved);
  const claimChip = liveChip(isApproved);
  const applyChip: StatusChip = { label: "One-time review", color: "var(--panel-purple, #b06bff)" };
  const suggestChip: StatusChip = { label: "No promoter status", color: "var(--panel-magenta, #ff1fa0)" };

  const submitNote = isApproved
    ? "You're verified. This event publishes the moment you submit."
    : "First submission: we verify you and publish your event together, usually within a day.";
  const claimNote = isApproved
    ? "Verified promoters claim instantly, no review."
    : "Claiming also gets you verified. Reviewed once, then instant after.";

  const paths: PathDef[] = [
    {
      key: "submit",
      title: "Submit an event",
      forWho: "You're running it.",
      outcome: "Put your event on the guide.",
      accent: "var(--neon-yellow, #ccff00)",
      chip: submitChip,
    },
    {
      key: "claim",
      title: "Claim a listing",
      forWho: "It's listed, not yours yet.",
      outcome: "Take the host seat on an event already up.",
      accent: "var(--panel-cyan, #19e3ff)",
      chip: claimChip,
    },
    ...(!isApproved ? [{
      key: "apply" as const,
      title: "Apply as promoter",
      forWho: "Not posting yet, want the fast lane later.",
      outcome: "Get verified once. Skip the queue after.",
      accent: "var(--panel-purple, #b06bff)",
      chip: applyChip,
    }] : []),
    {
      key: "suggest",
      title: "Spotted an event",
      forWho: "Not yours, the guide is missing it.",
      outcome: "Tip us and we will chase it down.",
      accent: "var(--neon-magenta, #ff00cc)",
      chip: suggestChip,
    },
  ];

  /** Deep-glass intake rows — every status chip is the same solid glass pill.
   *  "Goes live now" always lime fill; other chips use the row accent (cyan / purple / magenta). */
  const intakeActions: PromoterIntakeAction[] = paths.map((path) => {
    const goesLive = /goes live/i.test(path.chip.label);
    return {
      key: path.key as PromoterIntakeActionKey,
      title: path.title,
      forWho: path.forWho,
      outcome: path.outcome,
      accent: path.accent,
      badge: {
        label: path.chip.label,
        variant: "solid",
        // Claim row is cyan; "goes live" chip still lime per design
        accent: goesLive ? "var(--neon-yellow, #ccff00)" : path.accent,
      },
    };
  });

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
          title: heldForReview
            ? "Submitted for admin review"
            : autoApproved || isApproved
              ? "Event is live"
              : "Submitted for review",
          desc: heldForReview
            ? (payload.heldReason
              ? `${payload.heldReason}. An admin will merge your updates with the existing listing or publish separately.`
              : "We found a similar event already in the guide. An admin will review before publishing.")
            : autoApproved || isApproved
              ? "Your event is now live on the guide and on your profile."
              : "Your event and promoter application are in the queue. We will publish them together once approved.",
        },
        SUGGEST: {
          title: "Tip received",
          desc: "We will review it and may add the event to the guide. Thanks for the heads up.",
        },
        CLAIM: {
          title: autoApproved || isApproved ? "Event claimed" : "Claim submitted",
          desc: autoApproved || isApproved
            ? "You are now the host of this event. It is live on your profile."
            : "Your claim is in review. We will let you know when it goes live.",
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
      kicker: "HOME · PROMOTERS",
      title: "Promoter hub",
      accent: "lime",
      lede: "Got an event? Want the fast lane? Spotted something we are missing? Pick your path. Every door shows whether it goes live now or hits review first.",
    },
    submit: {
      kicker: "Submit an event",
      title: "Add your event",
      accent: "lime",
      lede: "You're running it. Put your event on the guide.",
    },
    apply: {
      kicker: "Promoter verification",
      title: "Apply as promoter",
      accent: "cyan",
      lede: "Not posting yet, want the fast lane later. Get verified once. Skip the queue after.",
    },
    suggest: {
      kicker: "Community tip",
      title: "Spotted an event",
      accent: "magenta",
      lede: "Not yours, the guide is missing it. Tip us and we will chase it down. Free account required. No promoter status needed.",
    },
    claim: {
      kicker: "Host your listing",
      title: "Claim an event",
      accent: "cyan",
      lede: "It's listed, not yours yet. Take the host seat on an event already up.",
    },
  };
  const hero = heroCopy[mode];

  const ticketRequired = admissionRequiresTicketUrl(eventForm.admission);
  const admissionHint = ADMISSION_OPTIONS.find(o => o.value === eventForm.admission)?.hint;

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
                Submit an event
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

        {/* ── LANDING (Layout A · Sorter) ── */}
        {mode === "landing" && (
          <div className="submit-stack submit-stack--makeover">

            {!isApproved && promoterStatus === "pending" && (
              <div className="submit-banner submit-banner--pending">
                <span className="submit-banner__dot" aria-hidden="true" />
                <div>
                  <div className="submit-banner__title">Application pending</div>
                  <p className="submit-banner__body">
                    Your promoter application is in the review queue. You can still submit and claim now, both go live once you are approved. We will message you.
                  </p>
                </div>
              </div>
            )}
            {!user && (
              <div className="submit-banner submit-banner--account">
                <div>
                  <div className="submit-banner__title">Free account needed for most paths</div>
                  <p className="submit-banner__body">
                    All four paths take a free account (about a minute). Spotting a missing event does not need promoter status, just an account.
                  </p>
                </div>
                <Button variant="solid" accent="lime" className="submit-banner__cta" onClick={() => openAuth()}>
                  Log in / Join
                </Button>
              </div>
            )}

            <PromoterIntake
              isVerified={isApproved}
              actions={intakeActions}
              onSelect={(key) => goMode(key)}
              showSectionHead={false}
            />

            {!isApproved && (
              <div className="submit-clarifier">
                <div className="submit-clarifier__kicker">Submit or Apply, what is the difference?</div>
                <div className="submit-clarifier__cols">
                  <p>
                    <strong className="submit-clarifier__lime">Submit</strong> posts your event now and gets you verified in the same step. Do this if you have an event to list today.
                  </p>
                  <p>
                    <strong className="submit-clarifier__purple">Apply</strong> just gets you verified, with nothing to post yet. Do this if you want the fast lane ready for later.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMIT (one page) ── */}
        {mode === "submit" && (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            {eventSubmitSuccess ? (
              <div className="submit-success submit-success--lime">
                <div className="submit-success__check" aria-hidden="true">✓</div>
                <div className="submit-success__title">{eventSubmitSuccess.title}</div>
                <p className="submit-success__body" style={{ marginBottom: eventSubmitSuccess.potentialMatches?.length ? 16 : 22 }}>
                  {eventSubmitSuccess.desc}
                </p>
                {eventSubmitSuccess.potentialMatches && eventSubmitSuccess.potentialMatches.length > 0 && (
                  <div className="submit-match-box">
                    <p className="submit-match-box__title">Similar events in the guide</p>
                    <ul className="submit-match-box__list">
                      {eventSubmitSuccess.potentialMatches.map(match => (
                        <li key={`${match.title}-${match.venueName}`}>
                          {match.title} @ {match.venueName}
                          {match.confidence === "high" ? " (likely duplicate)" : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="submit-success__actions">
                  <Button type="button" variant="solid" accent="lime" size="lg" arrow block onClick={startAnotherEvent}>
                    Create another event
                  </Button>
                  <button type="button" onClick={finishSubmitFlow} className="submit-hub-link">
                    Back to hub
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>
                  ← Back to hub
                </button>
                <div className="board-section-kicker board-section-kicker--lime">Submit an event</div>
                <h2 className="display section-heading">Add your event</h2>
                <div className="submit-chip-note">
                  <StatusChipEl chip={submitChip} />
                  <span className="submit-chip-note__text">{submitNote}</span>
                </div>
                <form
                  onSubmit={e => { e.preventDefault(); handleSubmitWithEvent(); }}
                  style={{ display: "flex", flexDirection: "column", gap: 24 }}
                >
                  {!isApproved && (
                    <ScrollReveal>
                      <div style={aboutYouHeadStyle}>1 · About you (one time)</div>
                      <div className="gifting-form-grid">
                        <label className="span">
                          Organization or event name (optional)
                          <input
                            className="board-text-field"
                            value={submitterOrg}
                            onChange={e => setSubmitterOrg(e.target.value)}
                            placeholder="e.g. Queer Night PDX"
                          />
                        </label>
                        <label className="span">
                          Website, Instagram, or portfolio link
                          <input
                            className="board-text-field"
                            value={promoterForm.proofUrl}
                            onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))}
                            type="url"
                            placeholder="https://..."
                          />
                        </label>
                        <label className="span">
                          Tell us about you as a promoter *
                          <textarea
                            className="board-text-field"
                            value={promoterForm.appReason}
                            onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))}
                            rows={4}
                            required
                            placeholder="What do you run? Your connection to the PDX scene? Links to your work."
                            style={{ resize: "vertical" }}
                          />
                        </label>
                      </div>
                    </ScrollReveal>
                  )}

                  <ScrollReveal delay={isApproved ? 0 : 40}>
                    <div style={sectionHeadStyle}>{isApproved ? "Your event" : "2 · Your event"}</div>
                    <div className="gifting-form-grid">
                      <label className="span">
                        Event title *
                        <input className="board-text-field" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="Horse Meat Disco" />
                      </label>
                      <label className="span">
                        Description *
                        <textarea className="board-text-field" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} required rows={4} placeholder="What's the vibe? Who is it for?" style={{ resize: "vertical" }} />
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
                        <input
                          className="board-text-field"
                          value={eventForm.address}
                          onChange={e => setEventForm(f => ({ ...f, address: e.target.value }))}
                          required={!eventForm.isHouseParty}
                          placeholder={eventForm.isHouseParty ? "Optional for house parties" : "Street address"}
                        />
                      </label>
                      <label>
                        Day
                        <select
                          className="board-text-field"
                          value={eventForm.dayOfWeek}
                          onChange={e => {
                            const day = e.target.value;
                            setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultPrideDateTimes(day) }));
                          }}
                        >
                          {PRIDE_WEEK_DAY_OPTIONS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Age
                        <select className="board-text-field" value={eventForm.ageRequirement} onChange={e => setEventForm(f => ({ ...f, ageRequirement: e.target.value }))}>
                          <option value="ALL_AGES">All ages</option>
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
                        <input
                          className="board-text-field"
                          value={eventForm.ticketUrl}
                          onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))}
                          type="url"
                          placeholder="https://eventbrite.com/..."
                          required={ticketRequired}
                        />
                        <div className="submit-field-hint">
                          {ticketRequired
                            ? "Required for ticketed events."
                            : admissionHint || "Optional: add a link if you have one."}
                        </div>
                      </label>
                      <label className="span">
                        Event flyer / poster (optional)
                        <ImageUploader
                          endpoint="/api/upload/poster"
                          fieldName="poster"
                          currentUrl={eventForm.posterImageUrl}
                          onUploaded={handleFlyerUploaded}
                          label="Upload flyer"
                        />
                        {flyerReadStatus === "reading" && (
                          <div className="board-copy-sm" style={{ marginTop: 6, opacity: 0.8 }}>
                            Reading your flyer… fields will fill in a moment.
                          </div>
                        )}
                        {flyerReadStatus === "filled" && (
                          <div className="board-copy-sm" style={{ marginTop: 6, color: "var(--panel-purple, #b06bff)" }}>
                            Filled from your flyer — please double-check everything before submitting.
                          </div>
                        )}
                        {flyerReadStatus === "error" && (
                          <div className="board-copy-sm" style={{ marginTop: 6, opacity: 0.8 }}>
                            Couldn't read that one automatically — just fill the form in below.
                          </div>
                        )}
                      </label>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delay={60}>
                    <div style={sectionHeadStyle}>Event tags</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {EVENT_TYPES.map(t => (
                        <BoardFilterChip key={t} active={eventForm.selectedTypes.includes(t)} onClick={() => toggleType(t)} accent="lime">
                          {t}
                        </BoardFilterChip>
                      ))}
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delay={80}>
                    <div style={sectionHeadStyle}>Flags</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <EventTypeTag label="HOUSE PARTY" interactive active={eventForm.isHouseParty} onClick={() => setEventForm(f => ({ ...f, isHouseParty: !f.isHouseParty }))} testId="toggle-house-party" />
                      <EventTypeTag label="SEX POSITIVE" interactive active={eventForm.isSexPositive} onClick={() => setEventForm(f => ({ ...f, isSexPositive: !f.isSexPositive }))} testId="toggle-sex-positive" />
                      <EventTypeTag label="NUDITY OK" interactive active={eventForm.nudityOk} onClick={() => setEventForm(f => ({ ...f, nudityOk: !f.nudityOk }))} testId="toggle-nudity-ok" />
                    </div>
                    {eventForm.isHouseParty && (
                      <div className="submit-warning" data-testid="house-party-warning">
                        <span className="submit-warning__mark" aria-hidden="true">!</span>
                        <div>
                          <div className="submit-warning__title">House parties are public</div>
                          <div className="submit-warning__body">
                            There is no invite-only option. Anyone browsing the guide can see it and show up. Only post if you are open to the community attending.
                          </div>
                        </div>
                      </div>
                    )}
                  </ScrollReveal>

                  <ScrollReveal delay={100}>
                    <Button
                      type="submit"
                      disabled={eventMutation.isPending}
                      variant="solid"
                      accent="lime"
                      size="lg"
                      arrow
                      block
                      data-testid="submit-button"
                    >
                      {eventMutation.isPending
                        ? "Submitting..."
                        : isApproved
                          ? "Submit event, goes live now"
                          : "Submit event for review"}
                    </Button>
                  </ScrollReveal>
                </form>
              </>
            )}
          </section>
        )}

        {/* ── APPLY AS PROMOTER ── */}
        {mode === "apply" && (flowSuccess === "apply" ? (
          <div className="submit-success submit-success--purple">
            <div className="submit-success__check" aria-hidden="true">✓</div>
            <div className="submit-success__title">Application submitted</div>
            <p className="submit-success__body">
              We will review your promoter request and be in touch. You will get a message when you are approved.
            </p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to hub</button>
          </div>
        ) : (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back to hub</button>
            <div className="board-section-kicker" style={{ color: "var(--panel-purple, #b06bff)" }}>Promoter verification</div>
            <h2 className="display section-heading">Apply as promoter</h2>
            <p className="board-copy-sm">
              Get verified once. After that, every event you post goes live with no review. One-time application, reviewed by a human.
            </p>
            {promoterStatus === "pending" && (
              <p className="board-copy-sm">Your promoter application is in the admin queue. You will be notified when it is reviewed.</p>
            )}
            <div className="submit-chip-note" style={{ marginBottom: 22 }}>
              <StatusChipEl chip={applyChip} />
              <span className="submit-chip-note__text">One-time review. No event to post yet.</span>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } applyMutation.mutate(); }}>
              <div className="gifting-form-grid">
                <label>
                  Your name
                  <input className="board-text-field" value={user?.displayName || user?.username || ""} placeholder="Log in to autofill" disabled style={{ opacity: 0.55 }} />
                </label>
                <label>
                  Email
                  <input className="board-text-field" value={user?.email || ""} placeholder="Log in to autofill" disabled style={{ opacity: 0.55 }} />
                </label>
                <label className="span">
                  Organization or event name (optional)
                  <input className="board-text-field" value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. Queer Night PDX" />
                </label>
                <label className="span">
                  Website, Instagram, or portfolio link
                  <input className="board-text-field" value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" placeholder="https://..." />
                </label>
                <label className="span">
                  Tell us about you as a promoter *
                  <textarea
                    className="board-text-field"
                    value={promoterForm.appReason}
                    onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))}
                    rows={5}
                    required
                    placeholder="What do you run or have you run? Your connection to the PDX scene? Links or proof of your work."
                    style={{ resize: "vertical" }}
                  />
                </label>
              </div>
              <Button type="submit" disabled={applyMutation.isPending} variant="solid" accent="cyan" size="lg" arrow block>
                {applyMutation.isPending ? "Submitting..." : "Submit application"}
              </Button>
              <p className="submit-form-foot">
                We review every application. You will get a message when you are approved.
              </p>
            </form>
          </section>
        ))}

        {/* ── SPOTTED AN EVENT ── */}
        {mode === "suggest" && (flowSuccess === "suggest" ? (
          <div className="submit-success submit-success--magenta">
            <div className="submit-success__check" aria-hidden="true">✓</div>
            <div className="submit-success__title">Tip received</div>
            <p className="submit-success__body">
              We will review it and may add the event to the guide. Thanks for the heads up.
            </p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to hub</button>
          </div>
        ) : (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back to hub</button>
            <div className="board-section-kicker board-section-kicker--magenta">Community tip</div>
            <h2 className="display section-heading">Spotted an event</h2>
            <p className="board-copy-sm">
              Saw a Pride event we are missing? Tip us off. You just need a free account, no promoter status required. We review every tip, approved ones go live as unclaimed listings.
            </p>
            <div className="submit-chip-note" style={{ marginBottom: 22 }}>
              <StatusChipEl chip={suggestChip} />
              <span className="submit-chip-note__text">Free account required. No promoter status needed.</span>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "SUGGEST" }); }}>
              <div className="gifting-form-grid">
                <label className="span">
                  Event name *
                  <input className="board-text-field" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Queer Dance Night at Wonder Ballroom" />
                </label>
                <label>
                  Venue or location (if known)
                  <input className="board-text-field" value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} placeholder="Venue name or neighborhood" />
                </label>
                <label>
                  Day
                  <select
                    className="board-text-field"
                    value={eventForm.dayOfWeek}
                    onChange={e => {
                      const day = e.target.value;
                      setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultPrideDateTimes(day) }));
                    }}
                  >
                    {PRIDE_WEEK_DAY_OPTIONS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </label>
                <label className="span">
                  Link (if you have one)
                  <input className="board-text-field" value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://..." />
                </label>
                <label className="span">
                  Where did you spot this?
                  <textarea
                    className="board-text-field"
                    value={promoterForm.suggestNote}
                    onChange={e => setPromoterForm(f => ({ ...f, suggestNote: e.target.value }))}
                    rows={3}
                    placeholder="Instagram, a flyer, word of mouth. Any context helps."
                    style={{ resize: "vertical" }}
                  />
                </label>
              </div>
              <Button type="submit" disabled={eventMutation.isPending} variant="solid" accent="pink" size="lg" arrow block>
                {eventMutation.isPending ? "Sending..." : "Send tip"}
              </Button>
              <p className="submit-form-foot">
                Tips go to the team only, never posted publicly with your name.
              </p>
            </form>
          </section>
        ))}

        {/* ── CLAIM EXISTING EVENT ── */}
        {mode === "claim" && (flowSuccess === "claim" ? (
          <div className="submit-success submit-success--cyan">
            <div className="submit-success__check" aria-hidden="true">✓</div>
            <div className="submit-success__title">{isApproved ? "Event claimed" : "Claim submitted"}</div>
            <p className="submit-success__body">
              {isApproved
                ? "You are now the host of this event. It is live on your profile."
                : "Your claim is in review. We will let you know when it goes live."}
            </p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to hub</button>
          </div>
        ) : (
          <section className="gifting-form-panel gifting-form-panel--makeover">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back to hub</button>
            <div className="board-section-kicker board-section-kicker--cyan">Host your listing</div>
            <h2 className="display section-heading">Claim an event</h2>
            <div className="submit-chip-note" style={{ marginBottom: 22 }}>
              <StatusChipEl chip={claimChip} />
              <span className="submit-chip-note__text">{claimNote}</span>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "CLAIM" }); }}>
              <div className="gifting-form-grid">
                <label className="span">
                  Event to claim *
                  <select
                    className="board-text-field"
                    value={promoterForm.claimEventId}
                    onChange={e => setPromoterForm(f => ({ ...f, claimEventId: e.target.value }))}
                    required
                    data-testid="select-claim-event"
                  >
                    <option value="">Select an unclaimed event...</option>
                    {unclaimedEvents.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title} · {ev.venueName} · {ev.dayOfWeek || "TBD"}</option>
                    ))}
                  </select>
                  {unclaimedError ? (
                    <div className="submit-field-hint submit-field-hint--warn">
                      Could not load unclaimed events.{" "}
                      <button type="button" onClick={() => refetchUnclaimed()} className="submit-inline-retry">Retry</button>
                    </div>
                  ) : unclaimedEvents.length === 0 && (
                    <div className="submit-field-hint">No unclaimed events are available right now.</div>
                  )}
                </label>
                <label className="span">
                  How are you connected to this event? *
                  <textarea
                    className="board-text-field"
                    value={promoterForm.claimReason}
                    onChange={e => setPromoterForm(f => ({ ...f, claimReason: e.target.value }))}
                    rows={4}
                    required
                    placeholder="Your organizer role, plus a website, ticketing dashboard, or social link as proof."
                    style={{ resize: "vertical" }}
                  />
                </label>
              </div>
              <Button type="submit" disabled={eventMutation.isPending} variant="solid" accent="cyan" size="lg" arrow block data-testid="submit-button">
                {eventMutation.isPending
                  ? "Submitting..."
                  : isApproved
                    ? "Claim this event"
                    : "Submit claim for review"}
              </Button>
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
