import { useEffect, useRef, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Event } from "@shared/schema";
import EventTypeTag from "@/components/EventTypeTag";
import PageHero from "@/components/PageHero";
import ScrollReveal from "@/components/ScrollReveal";
import { usePageSeo } from "@/hooks/usePageSeo";
import { SUBMIT_EVENT_TYPE_OPTIONS, submitLabelsToJsonTags } from "@shared/eventTypeTags";

const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];
const EVENT_TYPES = SUBMIT_EVENT_TYPE_OPTIONS.map(opt => opt.label);
const labelStyle = { display: "block", fontSize: "0.72rem", fontFamily: "var(--font-display)", color: "var(--text-meta)", marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const };
const sectionHeadStyle = { fontSize: "1rem", color: "var(--neon-yellow)", marginBottom: 12, borderBottom: "1px solid #1a1a1a", paddingBottom: 8 };

type PageMode = "landing" | "submit" | "apply" | "suggest" | "claim";
type SubmitStep = "promoter_app" | "event_details";

const emptyEventForm = () => ({
  title: "", description: "", venueName: "", address: "", neighborhood: "SE Portland",
  dateStart: "", dateEnd: "", dayOfWeek: "FRI",
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
    "Add your Portland Pride 2026 event to the free PDX Pride community directory. Submit or claim listings for Pride Weekend.",
  );
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
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

  useEffect(() => {
    if (!loading && !user && mode !== "landing") setShowAuth(true);
  }, [loading, user, mode]);

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

  // Promoter application mutation (used by "apply" path and step 1 of "submit" path)
  const applyMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/submit", {
        type: "PROMOTER_APPLICATION",
        submitterOrg,
        ticketUrl: promoterForm.proofUrl,
        claimReason: promoterForm.appReason,
        description: promoterForm.appReason,
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.message || payload.error || "Submission failed");
      return payload;
    },
    onSuccess: () => {
      toast({ title: "Application submitted!", description: "Admins will review your promoter request and be in touch." });
      setPromoterForm(emptyPromoterForm());
      setSubmitterOrg("");
      setMode("landing");
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
    onSuccess: (_, vars) => {
      const msgs: Record<string, { title: string; desc: string }> = {
        NEW_EVENT: { title: "Event submitted!", desc: isApproved ? "Your event is now live." : "Your event and promoter application are in the admin queue." },
        SUGGEST: { title: "Tip received!", desc: "Admins will review and may add this event to the guide." },
        CLAIM: { title: "Claim submitted!", desc: "Your claim and promoter request are pending admin review." },
      };
      const m = msgs[vars.type] || msgs.NEW_EVENT;
      toast({ title: m.title, description: m.desc });
      setEventForm(emptyEventForm());
      setPromoterForm(emptyPromoterForm());
      setSubmitStep("promoter_app");
      setMode("landing");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmitWithEvent = async () => {
    if (!user) { setShowAuth(true); return; }
    if (!isApproved) {
      // Fire both: promoter application + event submission
      await apiRequest("POST", "/api/submit", {
        type: "PROMOTER_APPLICATION",
        submitterOrg,
        ticketUrl: promoterForm.proofUrl,
        claimReason: promoterForm.appReason,
        description: promoterForm.appReason,
      });
    }
    eventMutation.mutate({ type: "NEW_EVENT" });
  };

  const heroCopy: Record<PageMode, { line1: string; line2: string; accent: "lime" | "cyan" | "orange" | "magenta" }> = {
    landing: { line1: "PROMOTERS", line2: "& EVENTS", accent: "lime" },
    submit:  { line1: "SUBMIT", line2: "AN EVENT", accent: "lime" },
    apply:   { line1: "APPLY AS", line2: "PROMOTER", accent: "cyan" },
    suggest: { line1: "SPOTTED", line2: "AN EVENT", accent: "orange" },
    claim:   { line1: "CLAIM", line2: "AN EVENT", accent: "cyan" },
  };
  const hero = heroCopy[mode];

  const fieldClass = "submit-form__field";

  return (
    <div className="zine-page submit-page board-page">
      {showAuth && !user && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <PageHero flipLightLeaks titleLine1={hero.line1} titleLine2={hero.line2} accent={hero.accent} lede="" bgImage="/motifs/portland-sign.jpg" bgPosition="center 38%" />

      <div className="submit-page__body">

        {/* ── LANDING ── */}
        {mode === "landing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "var(--text-meta)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 8 }}>
              Got an event? Want to be a verified promoter? Spotted something we're missing? Pick your path.
            </p>

            {/* Card 1: Submit New Event */}
            <button type="button" onClick={() => { if (!user) { setShowAuth(true); return; } setMode("submit"); setSubmitStep(isApproved ? "event_details" : "promoter_app"); }}
              style={{ textAlign: "left", background: "#0d0d0d", border: "2px solid #C8FA3C", padding: "20px 20px", cursor: "pointer" }}>
              <div className="display" style={{ color: "#C8FA3C", fontSize: "1.1rem", marginBottom: 6 }}>{isApproved ? "SUBMIT NEW EVENT →" : "SUBMIT NEW EVENT + SIGN UP TO BE A PROMOTER →"}</div>
              <p style={{ color: "#aaa", fontSize: "0.84rem", lineHeight: 1.5, margin: 0 }}>
                {isApproved
                  ? "You're a verified promoter — your event goes live after you submit."
                  : "Fill out a short promoter application, then add your event. Both go to admin review. Approved events and promoter status go live together."}
              </p>
            </button>

            {/* Card 2: Apply as Promoter (only shown if not approved) */}
            {!isApproved && (
              <button type="button" onClick={() => { if (!user) { setShowAuth(true); return; } setMode("apply"); }}
                style={{ textAlign: "left", background: "#0d0d0d", border: "2px solid #00FFFF", padding: "20px 20px", cursor: "pointer" }}>
                <div className="display" style={{ color: "#00FFFF", fontSize: "1.1rem", marginBottom: 6 }}>APPLY AS PROMOTER →</div>
                <p style={{ color: "#aaa", fontSize: "0.84rem", lineHeight: 1.5, margin: 0 }}>
                  Not ready to submit an event yet? Apply to be a verified promoter now. Once approved, you can post new events that go live immediately.
                </p>
              </button>
            )}

            {/* Card 3: Suggest an Event */}
            <button type="button" onClick={() => { if (!user) { setShowAuth(true); return; } setMode("suggest"); }}
              style={{ textAlign: "left", background: "#0d0d0d", border: "2px solid #FF6600", padding: "20px 20px", cursor: "pointer" }}>
              <div className="display" style={{ color: "#FF6600", fontSize: "1.1rem", marginBottom: 2 }}>SPOTTED AN EVENT →</div>
              <div className="display" style={{ color: "#FF6600", fontSize: "0.7rem", marginBottom: 8, opacity: 0.7 }}>(EVERYONE)</div>
              <p style={{ color: "#aaa", fontSize: "0.84rem", lineHeight: 1.5, margin: 0 }}>
                Saw a Pride event somewhere and want to tip us off? No promoter account needed. Admins review all tips — approved ones go live as unclaimed listings.
              </p>
            </button>

            {/* Card 4: Claim Existing Event */}
            <button type="button" onClick={() => { if (!user) { setShowAuth(true); return; } setMode("claim"); }}
              style={{ textAlign: "left", background: "#0d0d0d", border: "1px solid #333", padding: "20px 20px", cursor: "pointer" }}>
              <div className="display" style={{ color: "#aaa", fontSize: "1rem", marginBottom: 6 }}>CLAIM EXISTING EVENT →</div>
              <p style={{ color: "#666", fontSize: "0.84rem", lineHeight: 1.5, margin: 0 }}>
                See your event already listed but unclaimed? Claim it to get host access and request promoter verification.
              </p>
            </button>

            {!user && (
              <div style={{ border: "2px solid var(--neon-yellow)", background: "rgba(204,255,0,0.08)", padding: 18, marginTop: 8 }}>
                <div className="display" style={{ color: "var(--neon-yellow)", fontSize: "1rem", marginBottom: 6 }}>ACCOUNT REQUIRED</div>
                <p style={{ color: "#aaa", fontSize: "0.86rem", lineHeight: 1.5, marginBottom: 14 }}>
                  Create a free account or log in to submit, apply, or suggest.
                </p>
                <button type="button" className="btn-neon solid" onClick={() => setShowAuth(true)}>Log In / Join →</button>
              </div>
            )}
          </div>
        )}

        {/* ── SUBMIT: Step 1 — Promoter Application (non-approved only) ── */}
        {mode === "submit" && !isApproved && submitStep === "promoter_app" && (
          <div>
            <button type="button" onClick={() => setMode("landing")} style={{ background: "none", border: "none", color: "var(--text-meta)", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "0.76rem", marginBottom: 20 }}>← BACK</button>
            <div style={{ border: "2px solid #C8FA3C", background: "rgba(200,250,60,0.04)", padding: 18, marginBottom: 24 }}>
              <div className="display" style={{ color: "#C8FA3C", fontSize: "0.95rem", marginBottom: 6 }}>STEP 1 OF 2 — PROMOTER APPLICATION</div>
              <p style={{ color: "#aaa", fontSize: "0.86rem", lineHeight: 1.5, margin: 0 }}>
                {promoterStatus === "pending"
                  ? "Your promoter application is already in the admin queue. You can still submit your event below — both will be reviewed together."
                  : "Tell us a bit about yourself as a promoter. Once approved, future events you submit will go live immediately without review."}
              </p>
            </div>
            <form onSubmit={e => { e.preventDefault(); setSubmitStep("event_details"); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className={fieldClass}>
                <label style={labelStyle}>Organization / Event Name (optional)</label>
                <input value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. Queer Night PDX" />
              </div>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Website, Instagram, or Portfolio Link</label>
                <input value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" placeholder="https://..." />
              </div>
              <div className={`${fieldClass} submit-form__field--magenta`}>
                <label style={labelStyle}>Tell us about you as a promoter *</label>
                <textarea value={promoterForm.appReason} onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))} rows={5} required
                  placeholder="What events do you run or have you run? Your connection to PDX Pride? Any links to your work." style={{ resize: "vertical" }} />
              </div>
              <button type="submit" className="btn-neon solid" style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }}>
                NEXT — ADD YOUR EVENT →
              </button>
            </form>
          </div>
        )}

        {/* ── SUBMIT: Event Details (approved users skip straight here) ── */}
        {mode === "submit" && (isApproved || submitStep === "event_details") && (
          <div>
            <button type="button" onClick={() => isApproved ? setMode("landing") : setSubmitStep("promoter_app")}
              style={{ background: "none", border: "none", color: "var(--text-meta)", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "0.76rem", marginBottom: 20 }}>
              ← {isApproved ? "BACK" : "BACK TO PROMOTER APPLICATION"}
            </button>
            {!isApproved && (
              <div style={{ border: "2px solid #C8FA3C", background: "rgba(200,250,60,0.04)", padding: 14, marginBottom: 20 }}>
                <div className="display" style={{ color: "#C8FA3C", fontSize: "0.82rem" }}>STEP 2 OF 2 — EVENT DETAILS</div>
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); handleSubmitWithEvent(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ScrollReveal>
              <div className="display" style={sectionHeadStyle}>EVENT DETAILS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className={fieldClass}>
                  <label style={labelStyle}>Event Title *</label>
                  <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className={`${fieldClass} submit-form__field--magenta`}>
                  <label style={labelStyle}>Description *</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} required rows={4} style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div className={fieldClass}>
                    <label style={labelStyle}>Venue Name *</label>
                    <input value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} required />
                  </div>
                  <div className={`${fieldClass} submit-form__field--cyan`}>
                    <label style={labelStyle}>Neighborhood</label>
                    <select value={eventForm.neighborhood} onChange={e => setEventForm(f => ({ ...f, neighborhood: e.target.value }))}>
                      {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className={fieldClass} style={{ gridColumn: "1/-1" }}>
                    <label style={labelStyle}>Venue Address *</label>
                    <input value={eventForm.address} onChange={e => setEventForm(f => ({ ...f, address: e.target.value }))}
                      required={!eventForm.isHouseParty} placeholder={eventForm.isHouseParty ? "Optional for house parties" : "Street address (required)"} />
                  </div>
                  <div className={`${fieldClass} submit-form__field--orange`}>
                    <label style={labelStyle}>Day of Week</label>
                    <select value={eventForm.dayOfWeek} onChange={e => setEventForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                      <option value="THU">Thursday July 16</option>
                      <option value="FRI">Friday July 17</option>
                      <option value="SAT">Saturday July 18</option>
                      <option value="SUN">Sunday July 19</option>
                    </select>
                  </div>
                  <div className={fieldClass}>
                    <label style={labelStyle}>Age Requirement</label>
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
                      <option value="FREE">Free</option>
                      <option value="TICKETED">Ticketed</option>
                      <option value="SUGGESTED_DONATION">Suggested Donation</option>
                    </select>
                  </div>
                </div>
                <div className={`${fieldClass} submit-form__field--cyan`}>
                  <label style={labelStyle}>Ticket / RSVP Link *</label>
                  <input value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://eventbrite.com/..." required />
                  <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: 4 }}>All events must have a link.</div>
                </div>
                <div>
                  <label style={labelStyle}>Event Flyer / Poster (optional)</label>
                  <ImageUploader endpoint="/api/upload/poster" fieldName="poster" currentUrl={eventForm.posterImageUrl}
                    onUploaded={url => setEventForm(f => ({ ...f, posterImageUrl: url }))} label="UPLOAD FLYER" />
                </div>
              </div>
              </ScrollReveal>

              <ScrollReveal delay={40}>
              <div className="display" style={sectionHeadStyle}>EVENT TYPES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EVENT_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => toggleType(t)} className={`filter-tag ${eventForm.selectedTypes.includes(t) ? "active" : ""}`}>{t}</button>
                ))}
              </div>
              </ScrollReveal>

              <ScrollReveal delay={60}>
              <div className="display" style={sectionHeadStyle}>EVENT FLAGS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <EventTypeTag label="HOUSE PARTY" interactive active={eventForm.isHouseParty} onClick={() => setEventForm(f => ({ ...f, isHouseParty: !f.isHouseParty }))} testId="toggle-house-party" />
                <EventTypeTag label="SEX POSITIVE" interactive active={eventForm.isSexPositive} onClick={() => setEventForm(f => ({ ...f, isSexPositive: !f.isSexPositive }))} testId="toggle-sex-positive" />
                <EventTypeTag label="NUDITY OK" interactive active={eventForm.nudityOk} onClick={() => setEventForm(f => ({ ...f, nudityOk: !f.nudityOk }))} testId="toggle-nudity-ok" />
              </div>
              {eventForm.isHouseParty && (
                <div style={{ marginTop: 16, padding: "14px 16px", border: "2px solid var(--neon-orange)", background: "rgba(255,102,0,0.08)", display: "flex", gap: 12 }} data-testid="house-party-warning">
                  <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", color: "var(--neon-orange)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
                      Heads up — House Parties Are Public
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#aaa", lineHeight: 1.5 }}>
                      We don't have a way to do invite-only. Anyone browsing this guide can see it and show up. Only post if you're genuinely open to the community attending.
                    </div>
                  </div>
                </div>
              )}
              </ScrollReveal>

              <ScrollReveal delay={80}>
              <div className="display" style={sectionHeadStyle}>REVIEW &amp; SUBMIT</div>
              <p style={{ color: "#888", fontSize: "0.84rem", lineHeight: 1.6, marginBottom: 16 }}>
                {isApproved
                  ? "You're verified — your event goes live immediately after submitting."
                  : "Both your promoter application and this event go to the admin queue. Once approved, your event goes live and you'll be a verified promoter."}
              </p>
              <button type="submit" disabled={eventMutation.isPending} className="btn-neon solid"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }} data-testid="submit-button">
                {eventMutation.isPending ? "Submitting..." : isApproved ? "Submit Event →" : "Submit Event + Promoter Application →"}
              </button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 10 }}>
                {isApproved ? "Event goes live immediately." : "All submissions are reviewed before going live."}
              </p>
              </ScrollReveal>
            </form>
          </div>
        )}

        {/* ── APPLY AS PROMOTER ── */}
        {mode === "apply" && (
          <div>
            <button type="button" onClick={() => setMode("landing")} style={{ background: "none", border: "none", color: "var(--text-meta)", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "0.76rem", marginBottom: 20 }}>← BACK</button>
            {promoterStatus === "pending" && (
              <div style={{ border: "2px solid #00FFFF", background: "rgba(0,255,255,0.06)", padding: 16, marginBottom: 20 }}>
                <div className="display" style={{ color: "#00FFFF", fontSize: "0.9rem", marginBottom: 4 }}>APPLICATION ALREADY SUBMITTED</div>
                <p style={{ color: "#aaa", fontSize: "0.84rem", margin: 0 }}>Your promoter application is in the admin queue. You'll be notified when it's reviewed.</p>
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); if (!user) { setShowAuth(true); return; } applyMutation.mutate(); }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="display" style={sectionHeadStyle}>PROMOTER APPLICATION</div>
              <div className={fieldClass}>
                <label style={labelStyle}>Your Name</label>
                <input value={user?.displayName || user?.username || ""} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className={fieldClass}>
                <label style={labelStyle}>Email</label>
                <input value={user?.email || ""} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className={fieldClass}>
                <label style={labelStyle}>Organization / Event Name (optional)</label>
                <input value={submitterOrg} onChange={e => setSubmitterOrg(e.target.value)} placeholder="e.g. Queer Night PDX" />
              </div>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Website, Instagram, or Portfolio Link</label>
                <input value={promoterForm.proofUrl} onChange={e => setPromoterForm(f => ({ ...f, proofUrl: e.target.value }))} type="url" placeholder="https://..." />
              </div>
              <div className={`${fieldClass} submit-form__field--magenta`}>
                <label style={labelStyle}>Tell us about you as a promoter *</label>
                <textarea value={promoterForm.appReason} onChange={e => setPromoterForm(f => ({ ...f, appReason: e.target.value }))} rows={6} required
                  placeholder="What events do you run or have you run? Your connection to PDX Pride? Any links, social pages, or proof of your work." style={{ resize: "vertical" }} />
              </div>
              <button type="submit" disabled={applyMutation.isPending} className="btn-neon solid"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }}>
                {applyMutation.isPending ? "Submitting..." : "Submit Promoter Application →"}
              </button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 10 }}>
                Admins will review your application. You'll get a message when approved.
              </p>
            </form>
          </div>
        )}

        {/* ── SUGGEST AN EVENT ── */}
        {mode === "suggest" && (
          <div>
            <button type="button" onClick={() => setMode("landing")} style={{ background: "none", border: "none", color: "var(--text-meta)", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "0.76rem", marginBottom: 20 }}>← BACK</button>
            <div style={{ border: "2px solid #FF6600", background: "rgba(255,102,0,0.06)", padding: 16, marginBottom: 20 }}>
              <div className="display" style={{ color: "#FF6600", fontSize: "0.9rem", marginBottom: 4 }}>NO PROMOTER ACCOUNT NEEDED</div>
              <p style={{ color: "#aaa", fontSize: "0.84rem", margin: 0 }}>
                Tip us off — admins review all suggestions. If approved, the event goes live as an unclaimed listing anyone can claim.
              </p>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (!user) { setShowAuth(true); return; } eventMutation.mutate({ type: "SUGGEST" }); }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className={`${fieldClass} submit-form__field--orange`}>
                <label style={labelStyle}>Event Name *</label>
                <input value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Queer Dance Night at Wonder Ballroom" />
              </div>
              <div className={fieldClass}>
                <label style={labelStyle}>Venue / Location (if known)</label>
                <input value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} placeholder="Venue name or neighborhood" />
              </div>
              <div className={`${fieldClass} submit-form__field--orange`}>
                <label style={labelStyle}>Day</label>
                <select value={eventForm.dayOfWeek} onChange={e => setEventForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                  <option value="THU">Thursday July 16</option>
                  <option value="FRI">Friday July 17</option>
                  <option value="SAT">Saturday July 18</option>
                  <option value="SUN">Sunday July 19</option>
                </select>
              </div>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Ticket / Info Link (if you have it)</label>
                <input value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://..." />
              </div>
              <div className={fieldClass}>
                <label style={labelStyle}>Where did you spot this?</label>
                <textarea value={promoterForm.suggestNote} onChange={e => setPromoterForm(f => ({ ...f, suggestNote: e.target.value }))} rows={3}
                  placeholder="Instagram, flyer, word of mouth — any context helps." style={{ resize: "vertical" }} />
              </div>
              <button type="submit" disabled={eventMutation.isPending} className="btn-neon solid"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%", borderColor: "#FF6600", background: "#FF6600", color: "#000" }}>
                {eventMutation.isPending ? "Sending..." : "Send Tip →"}
              </button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 4 }}>
                Tips go to admins only — not publicly posted.
              </p>
            </form>
          </div>
        )}

        {/* ── CLAIM EXISTING EVENT ── */}
        {mode === "claim" && (
          <div>
            <button type="button" onClick={() => setMode("landing")} style={{ background: "none", border: "none", color: "var(--text-meta)", cursor: "pointer", fontFamily: "var(--font-display)", fontSize: "0.76rem", marginBottom: 20 }}>← BACK</button>
            <form onSubmit={e => { e.preventDefault(); if (!user) { setShowAuth(true); return; } eventMutation.mutate({ type: "CLAIM" }); }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="display" style={sectionHeadStyle}>CLAIM DETAILS</div>
              <p style={{ color: "var(--text-meta)", fontSize: "0.82rem", lineHeight: 1.5, marginTop: -4 }}>
                Claiming an event also requests verified promoter status so you can post new listings after approval.
              </p>
              <div className={`${fieldClass} submit-form__field--cyan`}>
                <label style={labelStyle}>Event to Claim *</label>
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
              <button type="submit" disabled={eventMutation.isPending} className="btn-neon solid"
                style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%" }} data-testid="submit-button">
                {eventMutation.isPending ? "Submitting..." : "Submit Claim + Promoter Request →"}
              </button>
              <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 4 }}>
                All claims are reviewed before going live.
              </p>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
