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
import type { PageHeaderAccent } from "@/components/PageHeader";
import BoardHero, { RainbowHeroWord } from "@/components/BoardHero";
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
import { EVENT_WEEK_DAY_OPTIONS, defaultEventWeekDateTimes } from "@shared/eventWeek";
import "./Submit.css";

const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];
const EVENT_TYPES = SUBMIT_EVENT_TYPE_OPTIONS.map(opt => opt.label);

const SUBMIT_RETURN_KEY = "pdx-submit-return";

type PageMode = "landing" | "submit" | "apply" | "suggest" | "claim";
/** Kept for auth-return restore only; submit is a single page now. */
type SubmitStep = "promoter_app" | "event_details";
type FlowSuccess = "apply" | "suggest" | "claim";

type SubmitReturnState = {
  mode: PageMode;
  submitStep: SubmitStep;
};

type StatusChip = { label: string; color: string };

type FormAccent = "lime" | "cyan" | "purple" | "magenta";

type ProgressItem = {
  label: string;
  complete: boolean;
};

function FormProgress({ items, accent = "lime" }: { items: ProgressItem[]; accent?: FormAccent }) {
  const ready = items.filter(item => item.complete).length;
  const percent = Math.round((ready / items.length) * 100);

  return (
    <aside className={`submit-progress submit-progress--${accent}`} aria-label="Form progress">
      <div className="submit-progress__head">
        <span>Progress</span>
        <span>{ready} of {items.length} sections ready</span>
      </div>
      <div
        className="submit-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={ready}
        aria-valuetext={`${ready} of ${items.length} sections ready`}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <ol className="submit-progress__steps">
        {items.map((item, index) => (
          <li key={item.label} className={item.complete ? "is-complete" : ""}>
            <span aria-hidden="true">{item.complete ? "✓" : index + 1}</span>
            {item.label}
          </li>
        ))}
      </ol>
    </aside>
  );
}

function FormSection({
  number,
  title,
  help,
  accent = "lime",
  children,
}: {
  number: number;
  title: string;
  help?: string;
  accent?: FormAccent;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={`submit-form-section submit-form-section--${accent}`}>
      <legend>
        <span className="submit-form-section__number">{String(number).padStart(2, "0")}</span>
        <span>
          <span className="submit-form-section__title">{title}</span>
          {help && <span className="submit-form-section__help">{help}</span>}
        </span>
      </legend>
      <div className="submit-form-section__body">{children}</div>
    </fieldset>
  );
}

function InlineFormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="submit-inline-error" role="alert" aria-live="assertive">
      <span aria-hidden="true">!</span>
      <div>
        <strong>Could not send this yet</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

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
  ...defaultEventWeekDateTimes("FRI"),
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
    "Promoter hub | Zaylist",
    "Submit events, claim listings, apply as a verified promoter, or tip Zaylist about something we missed.",
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
  const [formError, setFormError] = useState<string | null>(null);
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

  const openAuth = (returnMode: PageMode = mode) => {
    setAuthDismissed(false);
    setShowAuth(true);
    if (returnMode !== "landing") {
      sessionStorage.setItem(SUBMIT_RETURN_KEY, JSON.stringify({
        mode: returnMode,
        submitStep: returnMode === "submit" ? (isApproved ? "event_details" : "promoter_app") : submitStep,
      }));
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
    setFormError(null);
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
    if (!user) { openAuth(m); return; }
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
      outcome: "Put your event on Zaylist.",
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
      forWho: "Not yours  -  Zaylist is missing it.",
      outcome: "Tip us and we will chase it down.",
      accent: "var(--neon-magenta, #ff00cc)",
      chip: suggestChip,
    },
  ];

  /** Deep-glass intake rows - every status chip is the same solid glass pill.
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
      setFormError(null);
      toast({ title: "Application submitted!", description: "Admins will review your promoter request and be in touch." });
      setPromoterForm(emptyPromoterForm());
      setSubmitterOrg("");
      setFlowSuccess("apply");
    },
    onError: (err: Error) => {
      setFormError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
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
      setFormError(null);
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
              : "We found a similar event already on Zaylist. An admin will review before publishing.")
            : autoApproved || isApproved
              ? "Your event is now live on Zaylist and on your profile."
              : "Your event and promoter application are in the queue. We will publish them together once approved.",
        },
        SUGGEST: {
          title: "Tip received",
          desc: "We will review it and may add the event to Zaylist. Thanks for the heads up.",
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
    onError: (err: Error) => {
      setFormError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
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
    setFormError(null);
    if (!isApproved) {
      // Fire promoter application first - bail out if it fails
      const r = await apiRequest("POST", "/api/submit", {
        type: "PROMOTER_APPLICATION",
        submitterOrg,
        ticketUrl: promoterForm.proofUrl,
        claimReason: promoterForm.appReason,
      });
      if (!r.ok) {
        const payload = await r.json().catch(() => ({}));
        const message = payload.error || "Could not submit promoter application. Please try again.";
        setFormError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
        return;
      }
    }
    eventMutation.mutate({ type: "NEW_EVENT" });
  };

  const heroCopy: Record<PageMode, { kicker: string; title: string; accent: PageHeaderAccent; lede: string }> = {
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
      lede: "You're running it. Put your event on Zaylist.",
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
      lede: "Not yours  -  Zaylist is missing it. Tip us and we will chase it down. Free account required. No promoter status needed.",
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
  const submitProgress: ProgressItem[] = [
    ...(!isApproved ? [{ label: "About you", complete: promoterForm.appReason.trim().length > 0 }] : []),
    { label: "Event basics", complete: eventForm.title.trim().length > 0 && eventForm.description.trim().length > 0 },
    {
      label: "Place and time",
      complete: eventForm.venueName.trim().length > 0
        && (eventForm.isHouseParty || eventForm.address.trim().length > 0)
        && eventForm.dateStart.length > 0
        && eventForm.dateEnd.length > 0,
    },
    { label: "Entry and details", complete: !ticketRequired || eventForm.ticketUrl.trim().length > 0 },
  ];
  const applyProgress: ProgressItem[] = [
    { label: "Account", complete: !!user },
    { label: "Promoter background", complete: promoterForm.appReason.trim().length > 0 },
  ];
  const suggestProgress: ProgressItem[] = [
    { label: "Event", complete: eventForm.title.trim().length > 0 },
    { label: "Source", complete: eventForm.ticketUrl.trim().length > 0 || promoterForm.suggestNote.trim().length > 0 },
  ];
  const claimProgress: ProgressItem[] = [
    { label: "Listing", complete: promoterForm.claimEventId.length > 0 },
    { label: "Connection", complete: promoterForm.claimReason.trim().length > 0 },
  ];

  return (
    <div className="zine-page submit-page board-page board-page--makeover">
      {showAuth && !user && <AuthModal onClose={closeAuth} defaultTab="register" />}

      {mode === "landing" ? (
        <BoardHero
          accent="lime"
          kicker={hero.kicker}
          title={<>Promoter <RainbowHeroWord>hub</RainbowHeroWord></>}
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
            { num: allEvents.length, label: "Live on Zaylist", color: "#ccff00" },
            { num: unclaimedEvents.length, label: "Unclaimed, open to grab", color: "#19e3ff" },
            { num: venueCount, label: "Venues repping Pride", color: "#ff1fa0" },
          ]}
        />
      )}

      <div className="submit-page__body">

        {mode !== "landing" && !flowSuccess && !eventSubmitSuccess && (
          <nav className="submit-intent-nav" aria-label="Submission type">
            <button type="button" onClick={backToLanding} className="submit-intent-nav__hub">
              All options
            </button>
            <div className="submit-intent-nav__choices">
              {paths.map(path => (
                <button
                  key={path.key}
                  type="button"
                  onClick={() => goMode(path.key)}
                  className={mode === path.key ? "is-active" : ""}
                  aria-current={mode === path.key ? "page" : undefined}
                  style={{ "--intent-accent": path.accent } as React.CSSProperties}
                >
                  {path.title}
                </button>
              ))}
            </div>
          </nav>
        )}

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
          <section className="gifting-form-panel gifting-form-panel--makeover pdx-glass-rebind">
            {eventSubmitSuccess ? (
              <div className="submit-success submit-success--lime">
                <div className="submit-success__check" aria-hidden="true">✓</div>
                <div className="submit-success__title">{eventSubmitSuccess.title}</div>
                <p className="submit-success__body" style={{ marginBottom: eventSubmitSuccess.potentialMatches?.length ? 16 : 22 }}>
                  {eventSubmitSuccess.desc}
                </p>
                {eventSubmitSuccess.potentialMatches && eventSubmitSuccess.potentialMatches.length > 0 && (
                  <div className="submit-match-box">
                    <p className="submit-match-box__title">Similar events on Zaylist</p>
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
                  className="submit-guided-form"
                  onInput={() => formError && setFormError(null)}
                  onInvalidCapture={() => setFormError("Check the required fields marked with an asterisk, then try again.")}
                  onSubmit={e => { e.preventDefault(); handleSubmitWithEvent(); }}
                >
                  <FormProgress items={submitProgress} />
                  {!isApproved && (
                    <ScrollReveal>
                      <FormSection
                        number={1}
                        title="About you"
                        help="You only do this once. Approval unlocks instant publishing later."
                        accent="purple"
                      >
                        <div className="gifting-form-grid">
                          <label className="span">
                            Organization or event name <span className="submit-optional">Optional</span>
                            <input
                              className="board-text-field"
                              value={submitterOrg}
                              onChange={e => setSubmitterOrg(e.target.value)}
                              placeholder="e.g. After Dark PDX"
                            />
                          </label>
                          <label className="span">
                            Website, Instagram, or portfolio link <span className="submit-optional">Optional</span>
                            <input
                              className="board-text-field"
                              value={promoterForm.proofUrl}
                              onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))}
                              type="url"
                              inputMode="url"
                              placeholder="https://..."
                            />
                          </label>
                          <label className="span">
                            Tell us about you as a promoter <span aria-hidden="true">*</span>
                            <textarea
                              className="board-text-field"
                              value={promoterForm.appReason}
                              onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))}
                              rows={4}
                              required
                              placeholder="What do you run? Your connection to the PDX scene? Links to your work."
                            />
                          </label>
                        </div>
                      </FormSection>
                    </ScrollReveal>
                  )}

                  <ScrollReveal delay={isApproved ? 0 : 40}>
                    <FormSection
                      number={isApproved ? 1 : 2}
                      title="Event basics"
                      help="Give people enough to know what the night is and whether it is for them."
                    >
                      <div className="gifting-form-grid">
                        <label className="span">
                          Event title <span aria-hidden="true">*</span>
                          <input className="board-text-field" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="Horse Meat Disco" />
                        </label>
                        <label className="span">
                          Description <span aria-hidden="true">*</span>
                          <textarea className="board-text-field" value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} required rows={4} placeholder="What's the vibe? Who is it for?" />
                        </label>
                        <label className="span">
                          Event flyer or poster <span className="submit-optional">Optional</span>
                          <ImageUploader
                            endpoint="/api/upload/poster"
                            fieldName="poster"
                            currentUrl={eventForm.posterImageUrl}
                            onUploaded={handleFlyerUploaded}
                            label="Upload flyer"
                          />
                          <div className="submit-upload-status" aria-live="polite">
                            {flyerReadStatus === "reading" && "Reading your flyer. Fields will fill in a moment."}
                            {flyerReadStatus === "filled" && "Filled from your flyer. Double-check everything before submitting."}
                            {flyerReadStatus === "error" && "We could not read that flyer automatically. You can still complete the form."}
                          </div>
                        </label>
                      </div>
                    </FormSection>
                  </ScrollReveal>

                  <ScrollReveal delay={60}>
                    <FormSection
                      number={isApproved ? 2 : 3}
                      title="Place and time"
                      help="Use the public venue information people should use to find the event."
                    >
                      <div className="gifting-form-grid">
                      <label>
                        Venue name <span aria-hidden="true">*</span>
                        <input className="board-text-field" value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} required placeholder="Crystal Ballroom" />
                      </label>
                      <label>
                        Neighborhood
                        <select className="board-text-field" value={eventForm.neighborhood} onChange={e => setEventForm(f => ({ ...f, neighborhood: e.target.value }))}>
                          {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </label>
                      <label className="span">
                        Venue address {!eventForm.isHouseParty && <span aria-hidden="true">*</span>}
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
                            setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultEventWeekDateTimes(day) }));
                          }}
                        >
                          {EVENT_WEEK_DAY_OPTIONS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Start <span aria-hidden="true">*</span>
                        <input className="board-text-field" type="datetime-local" value={eventForm.dateStart} onChange={e => setEventForm(f => ({ ...f, dateStart: e.target.value }))} required />
                      </label>
                      <label>
                        End <span aria-hidden="true">*</span>
                        <input className="board-text-field" type="datetime-local" value={eventForm.dateEnd} onChange={e => setEventForm(f => ({ ...f, dateEnd: e.target.value }))} required />
                      </label>
                      </div>
                    </FormSection>
                  </ScrollReveal>

                  <ScrollReveal delay={80}>
                    <FormSection
                      number={isApproved ? 3 : 4}
                      title="Entry and event details"
                      help="Set access details, then add any tags or flags that help people decide."
                    >
                      <div className="gifting-form-grid">
                      <label>
                        Age
                        <select className="board-text-field" value={eventForm.ageRequirement} onChange={e => setEventForm(f => ({ ...f, ageRequirement: e.target.value }))}>
                          <option value="ALL_AGES">All ages</option>
                          <option value="18_PLUS">18+</option>
                          <option value="21_PLUS">21+</option>
                        </select>
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
                      </div>
                      <div className="submit-choice-group">
                        <div className="submit-choice-group__label">Event tags <span>Choose any that fit</span></div>
                        <div className="submit-choice-row">
                          {EVENT_TYPES.map(t => (
                            <BoardFilterChip key={t} active={eventForm.selectedTypes.includes(t)} onClick={() => toggleType(t)} accent="lime">
                              {t}
                            </BoardFilterChip>
                          ))}
                        </div>
                      </div>
                      <div className="submit-choice-group">
                        <div className="submit-choice-group__label">Flags <span>Choose any that apply</span></div>
                        <div className="submit-choice-row">
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
                                There is no invite-only option. Anyone browsing Zaylist can see it and show up. Only post if you are open to the community attending.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormSection>
                  </ScrollReveal>

                  <ScrollReveal delay={100}>
                    <div className="submit-review-bar">
                      <div>
                        <strong>{isApproved ? "Ready to publish?" : "Ready for review?"}</strong>
                        <span>Check the dates, public location, access details, and flyer before sending.</span>
                      </div>
                      <StatusChipEl chip={submitChip} />
                    </div>
                    <InlineFormError message={formError} />
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
          <section className="gifting-form-panel gifting-form-panel--makeover pdx-glass-rebind">
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
            <form
              className="submit-guided-form"
              onInput={() => formError && setFormError(null)}
              onInvalidCapture={() => setFormError("Tell us about your promoter background, then try again.")}
              onSubmit={e => { e.preventDefault(); setFormError(null); if (!user) { openAuth(); return; } applyMutation.mutate(); }}
            >
              <FormProgress items={applyProgress} accent="purple" />
              <FormSection number={1} title="Your account" help="These details come from your Zaylist account." accent="purple">
                <div className="gifting-form-grid">
                  <label>
                    Your name
                    <input className="board-text-field" value={user?.displayName || user?.username || ""} placeholder="Log in to autofill" disabled />
                  </label>
                  <label>
                    Email
                    <input className="board-text-field" value={user?.email || ""} placeholder="Log in to autofill" disabled />
                  </label>
                </div>
              </FormSection>
              <FormSection number={2} title="Promoter background" help="A human reviews this once. Specific links make verification easier." accent="purple">
                <div className="gifting-form-grid">
                  <label className="span">
                    Organization or event name <span className="submit-optional">Optional</span>
                    <input className="board-text-field" value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. After Dark PDX" />
                  </label>
                  <label className="span">
                    Website, Instagram, or portfolio link <span className="submit-optional">Optional</span>
                    <input className="board-text-field" value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" inputMode="url" placeholder="https://..." />
                  </label>
                  <label className="span">
                    Tell us about you as a promoter <span aria-hidden="true">*</span>
                    <textarea
                      className="board-text-field"
                      value={promoterForm.appReason}
                      onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))}
                      rows={5}
                      required
                      placeholder="What do you run or have you run? Your connection to the PDX scene? Links or proof of your work."
                    />
                  </label>
                </div>
              </FormSection>
              <InlineFormError message={formError} />
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
              We will review it and may add the event to Zaylist. Thanks for the heads up.
            </p>
            <button type="button" onClick={backToLanding} className="submit-hub-link">Back to hub</button>
          </div>
        ) : (
          <section className="gifting-form-panel gifting-form-panel--makeover pdx-glass-rebind">
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
            <form
              className="submit-guided-form"
              onInput={() => formError && setFormError(null)}
              onInvalidCapture={() => setFormError("Add the event name, then try again.")}
              onSubmit={e => { e.preventDefault(); setFormError(null); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "SUGGEST" }); }}
            >
              <FormProgress items={suggestProgress} accent="magenta" />
              <FormSection number={1} title="The event" help="Share whatever you know. Only the event name is required." accent="magenta">
                <div className="gifting-form-grid">
                  <label className="span">
                    Event name <span aria-hidden="true">*</span>
                    <input className="board-text-field" value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Dance Night at Wonder Ballroom" />
                  </label>
                  <label>
                    Venue or location <span className="submit-optional">If known</span>
                    <input className="board-text-field" value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} placeholder="Venue name or neighborhood" />
                  </label>
                  <label>
                    Day
                    <select
                      className="board-text-field"
                      value={eventForm.dayOfWeek}
                      onChange={e => {
                        const day = e.target.value;
                        setEventForm(f => ({ ...f, dayOfWeek: day, ...defaultEventWeekDateTimes(day) }));
                      }}
                    >
                      {EVENT_WEEK_DAY_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </FormSection>
              <FormSection number={2} title="Where you found it" help="A source helps the team verify the event faster." accent="magenta">
                <div className="gifting-form-grid">
                  <label className="span">
                    Link <span className="submit-optional">Optional</span>
                    <input className="board-text-field" value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" inputMode="url" placeholder="https://..." />
                  </label>
                  <label className="span">
                    Where did you spot this? <span className="submit-optional">Optional</span>
                    <textarea
                      className="board-text-field"
                      value={promoterForm.suggestNote}
                      onChange={e => setPromoterForm(f => ({ ...f, suggestNote: e.target.value }))}
                      rows={3}
                      placeholder="Instagram, a flyer, word of mouth. Any context helps."
                    />
                  </label>
                </div>
              </FormSection>
              <InlineFormError message={formError} />
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
          <section className="gifting-form-panel gifting-form-panel--makeover pdx-glass-rebind">
            <button type="button" className="submit-hub-link" style={{ marginBottom: 20 }} onClick={backToLanding}>← Back to hub</button>
            <div className="board-section-kicker board-section-kicker--cyan">Host your listing</div>
            <h2 className="display section-heading">Claim an event</h2>
            <div className="submit-chip-note" style={{ marginBottom: 22 }}>
              <StatusChipEl chip={claimChip} />
              <span className="submit-chip-note__text">{claimNote}</span>
            </div>
            <form
              className="submit-guided-form"
              onInput={() => formError && setFormError(null)}
              onInvalidCapture={() => setFormError("Choose a listing and explain your connection to it, then try again.")}
              onSubmit={e => { e.preventDefault(); setFormError(null); if (!user) { openAuth(); return; } eventMutation.mutate({ type: "CLAIM" }); }}
            >
              <FormProgress items={claimProgress} accent="cyan" />
              <FormSection number={1} title="Choose the listing" help="Only unclaimed events appear here." accent="cyan">
                <div className="gifting-form-grid">
                  <label className="span">
                    Event to claim <span aria-hidden="true">*</span>
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
                      <div className="submit-field-hint submit-field-hint--warn" role="alert">
                        Could not load unclaimed events.{" "}
                        <button type="button" onClick={() => refetchUnclaimed()} className="submit-inline-retry">Retry</button>
                      </div>
                    ) : unclaimedEvents.length === 0 && (
                      <div className="submit-field-hint">No unclaimed events are available right now.</div>
                    )}
                  </label>
                </div>
              </FormSection>
              <FormSection number={2} title="Confirm your connection" help="Give the team enough detail to verify that you represent this event." accent="cyan">
                <div className="gifting-form-grid">
                  <label className="span">
                    How are you connected to this event? <span aria-hidden="true">*</span>
                    <textarea
                      className="board-text-field"
                      value={promoterForm.claimReason}
                      onChange={e => setPromoterForm(f => ({ ...f, claimReason: e.target.value }))}
                      rows={4}
                      required
                      placeholder="Your organizer role, plus a website, ticketing dashboard, or social link as proof."
                    />
                  </label>
                </div>
              </FormSection>
              <InlineFormError message={formError} />
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
          line="Submit it. Claim it. Keep the nights ours."
          url="zaylist.com/submit"
        />
      )}
    </div>
  );
}
