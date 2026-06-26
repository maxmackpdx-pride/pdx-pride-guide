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

const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];

const EVENT_TYPES = ["Dance Party", "Drag", "Kink", "Social", "Brunch", "Performance", "Fair", "Education", "Trans", "Nightlife", "Sex Positive", "Nudity OK", "Other"];

const labelStyle = { display: "block", fontSize: "0.72rem", fontFamily: "var(--font-display)", color: "var(--text-meta)", marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const };
const sectionHeadStyle = { fontSize: "1rem", color: "var(--neon-yellow)", marginBottom: 12, borderBottom: "1px solid #1a1a1a", paddingBottom: 8 };

type FormStep = 1 | 2 | 3;

export default function Submit() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [location] = useLocation();
  const [activeStep, setActiveStep] = useState<FormStep>(1);
  const infoRef = useRef<HTMLElement>(null);
  const detailsRef = useRef<HTMLElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const claimPathEventId = location.match(/^\/submit\/claim\/(\d+)$/)?.[1] || "";
  const initialMode = (claimPathEventId || params.get("mode") === "claim") ? "claim" : "submit";
  const initialEventId = claimPathEventId || params.get("eventId") || "";
  const [mode, setMode] = useState<"submit" | "claim">(initialMode);
  const [form, setForm] = useState({
    title: "", description: "", venueName: "", address: "", neighborhood: "SE Portland",
    dateStart: "", dateEnd: "", dayOfWeek: "FRI",
    ageRequirement: "ALL_AGES", admission: "FREE", ticketUrl: "",
    posterImageUrl: "",
    isPublic: true, isHouseParty: false,
    isSexPositive: false, nudityOk: false,
    selectedTypes: [] as string[],
    submitterName: "", submitterEmail: "", submitterOrg: "",
    claimReason: "", eventId: initialEventId, type: "NEW_EVENT",
  });

  const { data: unclaimedEvents = [], isError: unclaimedError, refetch: refetchUnclaimed } = useQuery<Event[]>({
    queryKey: ["/api/events/unclaimed"],
    queryFn: () => apiRequest("GET", "/api/events/unclaimed").then(r => r.json()),
    enabled: mode === "claim",
  });

  const promoterStatus = user?.promoterStatus || "none";
  const canSubmitNew = promoterStatus === "approved" || user?.isAdmin;

  useEffect(() => {
    if (!loading && !user) setShowAuth(true);
  }, [loading, user]);

  useEffect(() => {
    const eventId = location.match(/^\/submit\/claim\/(\d+)$/)?.[1];
    if (!eventId) return;
    setMode("claim");
    setForm(f => ({ ...f, eventId }));
  }, [location]);

  useEffect(() => {
    if (!user) return;
    setForm(f => ({
      ...f,
      submitterName: user.displayName || user.username,
      submitterEmail: user.email,
    }));
  }, [user]);

  useEffect(() => {
    const sections = [
      { ref: infoRef, step: 1 as FormStep },
      { ref: detailsRef, step: 2 as FormStep },
      { ref: reviewRef, step: 3 as FormStep },
    ];
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const match = sections.find(s => s.ref.current === visible.target);
          if (match) setActiveStep(match.step);
        }
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-80px 0px -40% 0px" },
    );
    sections.forEach(s => { if (s.ref.current) observer.observe(s.ref.current); });
    return () => observer.disconnect();
  }, [mode]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", "/api/submit", {
        ...data,
        eventTypes: data.selectedTypes,
        type: mode === "claim" ? "CLAIM" : "NEW_EVENT",
      });
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.message || payload.error || "Submission failed");
      return payload;
    },
    onSuccess: () => {
      toast({
        title: mode === "claim" ? "Claim submitted!" : "Submitted!",
        description: mode === "claim"
          ? "Your claim and promoter verification request are pending review."
          : "Your submission is pending review.",
      });
      setForm(f => ({ ...f, title: "", description: "", claimReason: "", eventId: "" }));
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleType = (t: string) => setForm(f => ({
    ...f, selectedTypes: f.selectedTypes.includes(t) ? f.selectedTypes.filter(x => x !== t) : [...f.selectedTypes, t]
  }));

  const step2Label = mode === "claim" ? "Claim Details" : "Event Details";

  return (
    <div className="zine-page submit-page board-page">
      {showAuth && !user && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <PageHero
        kicker="PROMOTERS & ORGANIZERS"
        titleLine1={mode === "submit" ? "SUBMIT" : "CLAIM"}
        titleLine2="AN EVENT"
        accent={mode === "submit" ? "lime" : "cyan"}
        lede="Log in or create an account first. Submissions and claims stay tied to your dashboard while admins review them."
        bgImage="/motifs/portland-sign.jpg"
        bgPosition="center 38%"
      />

      <div className="submit-page__body">
      <div className="submit-form__steps" aria-label="Form progress">
        <span className={`submit-form__step ${activeStep === 1 ? "active" : activeStep > 1 ? "done" : ""}`}>Your Info</span>
        <span className="submit-form__step-arrow">→</span>
        <span className={`submit-form__step ${activeStep === 2 ? "active" : activeStep > 2 ? "done" : ""}`}>{step2Label}</span>
        <span className="submit-form__step-arrow">→</span>
        <span className={`submit-form__step ${activeStep === 3 ? "active" : ""}`}>Review</span>
      </div>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 32, border: "1px solid #222" }}>
        <button onClick={() => setMode("submit")} className={mode === "submit" ? "btn-neon solid" : "btn-neon"} style={{ flex: 1, justifyContent: "center", border: "none" }} data-testid="mode-submit">Submit New Event</button>
        <button onClick={() => setMode("claim")} className={mode === "claim" ? "btn-neon solid" : "btn-neon"} style={{ flex: 1, justifyContent: "center", border: "none", borderLeft: "1px solid #222" }} data-testid="mode-claim">Claim Existing Event</button>
      </div>

      {mode === "submit" && user && !canSubmitNew && (
        <div style={{ border: "2px solid var(--neon-magenta)", background: "rgba(255,0,204,0.06)", padding: 18, marginBottom: 24 }}>
          <div className="display" style={{ color: "var(--neon-magenta)", fontSize: "0.95rem", marginBottom: 6 }}>
            {promoterStatus === "pending" ? "PROMOTER VERIFICATION PENDING" : "VERIFIED PROMOTER REQUIRED"}
          </div>
          <p style={{ color: "#aaa", fontSize: "0.86rem", lineHeight: 1.5 }}>
            {promoterStatus === "pending"
              ? "Your verification request is in the admin queue. Switch to Claim Existing Event to add another claim, or wait for approval."
              : "New events require verified promoter status. Claim an unclaimed listing to request verification — your claim doubles as a promoter application."}
          </p>
        </div>
      )}

      {!user && (
        <div style={{ border: "2px solid var(--neon-yellow)", background: "rgba(204,255,0,0.08)", padding: 18, marginBottom: 24 }}>
          <div className="display" style={{ color: "var(--neon-yellow)", fontSize: "1rem", marginBottom: 6 }}>ACCOUNT REQUIRED</div>
          <p style={{ color: "#aaa", fontSize: "0.86rem", lineHeight: 1.5, marginBottom: 14 }}>
            Create an account or log in, then this form will attach the event or claim to your dashboard for review.
          </p>
          <button type="button" className="btn-neon solid" onClick={() => setShowAuth(true)}>Log In / Join →</button>
        </div>
      )}

      <form onSubmit={e => {
        e.preventDefault();
        if (!user) { setShowAuth(true); return; }
        if (mode === "submit" && !canSubmitNew) return;
        mutation.mutate(form);
      }} style={{ display: "flex", flexDirection: "column", gap: 20, opacity: user ? 1 : 0.6 }}>
        <ScrollReveal>
        <section ref={infoRef}>
          <div className="display" style={sectionHeadStyle}>YOUR INFO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["submitterName", "Your Name *"], ["submitterEmail", "Email *"], ["submitterOrg", "Organization (optional)"]].map(([k, lbl]) => (
              <div key={k} className="submit-form__field" style={{ gridColumn: k === "submitterOrg" ? "1/-1" : "auto" }}>
                <label style={labelStyle}>{lbl}</label>
                <input value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  required={k !== "submitterOrg"} disabled={k !== "submitterOrg"} style={{ opacity: k !== "submitterOrg" ? 0.7 : 1 }} />
              </div>
            ))}
          </div>
        </section>
        </ScrollReveal>

        <ScrollReveal delay={40}>
        <section ref={detailsRef}>
          {mode === "claim" && (
            <>
              <div className="display" style={sectionHeadStyle}>CLAIM DETAILS</div>
              <p style={{ color: "var(--text-meta)", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: 14, marginTop: -4 }}>
                Selecting an event and submitting also requests verified promoter status so you can post new listings after approval.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="submit-form__field submit-form__field--cyan">
                  <label style={labelStyle}>Event to Claim *</label>
                  <select value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))} required data-testid="select-claim-event">
                    <option value="">Select an unclaimed event...</option>
                    {unclaimedEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.title} · {event.venueName} · {event.dayOfWeek || "TBD"}
                      </option>
                    ))}
                  </select>
                  {unclaimedError ? (
                    <div style={{ fontSize: "0.76rem", color: "#FF6600", marginTop: 6 }}>
                      Could not load unclaimed events.{" "}
                      <button type="button" onClick={() => refetchUnclaimed()} style={{ background: "none", border: "none", color: "var(--neon-yellow)", cursor: "pointer", padding: 0, fontFamily: "var(--font-display)", fontSize: "0.76rem" }}>
                        Retry
                      </button>
                    </div>
                  ) : unclaimedEvents.length === 0 && (
                    <div style={{ fontSize: "0.76rem", color: "var(--text-meta)", marginTop: 6 }}>No unclaimed events are available right now.</div>
                  )}
                </div>
                <div className="submit-form__field submit-form__field--cyan">
                  <label style={labelStyle}>How are you connected to this event? *</label>
                  <textarea value={form.claimReason} onChange={e => setForm(f => ({ ...f, claimReason: e.target.value }))} rows={4} required
                    placeholder="Tell us your organizer role and include a website, ticketing dashboard, social link, or other proof."
                    style={{ resize: "vertical" }} />
                </div>
              </div>
            </>
          )}

          {mode === "submit" && <>
            <div className="display" style={sectionHeadStyle}>EVENT DETAILS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="submit-form__field">
                <label style={labelStyle}>Event Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="submit-form__field submit-form__field--magenta">
                <label style={labelStyle}>Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4}
                  style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="submit-form__field">
                  <label style={labelStyle}>Venue Name *</label>
                  <input value={form.venueName} onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} required />
                </div>
                <div className="submit-form__field submit-form__field--cyan">
                  <label style={labelStyle}>Neighborhood</label>
                  <select value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))}>
                    {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="submit-form__field" style={{ gridColumn: "1/-1" }}>
                  <label style={labelStyle}>Venue Address *</label>
                  <input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    required={!form.isHouseParty}
                    placeholder={form.isHouseParty ? "Optional for house parties" : "Street address (required)"}
                  />
                </div>
                <div className="submit-form__field submit-form__field--orange">
                  <label style={labelStyle}>Day of Week</label>
                  <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                    <option value="THU">Thursday July 16</option>
                    <option value="FRI">Friday July 17</option>
                    <option value="SAT">Saturday July 18</option>
                    <option value="SUN">Sunday July 19</option>
                  </select>
                </div>
                <div className="submit-form__field">
                  <label style={labelStyle}>Age Requirement</label>
                  <select value={form.ageRequirement} onChange={e => setForm(f => ({ ...f, ageRequirement: e.target.value }))}>
                    <option value="ALL_AGES">All Ages</option>
                    <option value="18_PLUS">18+</option>
                    <option value="21_PLUS">21+</option>
                  </select>
                </div>
                <div className="submit-form__field">
                  <label style={labelStyle}>Start *</label>
                  <input type="datetime-local" value={form.dateStart} onChange={e => setForm(f => ({ ...f, dateStart: e.target.value }))} required />
                </div>
                <div className="submit-form__field">
                  <label style={labelStyle}>End *</label>
                  <input type="datetime-local" value={form.dateEnd} onChange={e => setForm(f => ({ ...f, dateEnd: e.target.value }))} required />
                </div>
                <div className="submit-form__field">
                  <label style={labelStyle}>Admission</label>
                  <select value={form.admission} onChange={e => setForm(f => ({ ...f, admission: e.target.value }))}>
                    <option value="FREE">Free</option>
                    <option value="TICKETED">Ticketed</option>
                    <option value="SUGGESTED_DONATION">Suggested Donation</option>
                  </select>
                </div>
              </div>
              <div className="submit-form__field submit-form__field--cyan">
                <label style={labelStyle}>Ticket / RSVP Link *</label>
                <input value={form.ticketUrl} onChange={e => setForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://eventbrite.com/... (required)" required />
                <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: 4 }}>Link to buy tickets, RSVP, or find more info. All events must have a link.</div>
              </div>
              <div>
                <label style={labelStyle}>Event Flyer / Poster (optional)</label>
                <ImageUploader
                  endpoint="/api/upload/poster"
                  fieldName="poster"
                  currentUrl={form.posterImageUrl}
                  onUploaded={url => setForm(f => ({ ...f, posterImageUrl: url }))}
                  label="UPLOAD FLYER"
                />
                <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: 6 }}>jpg/png/gif/webp · max 8MB · appears on the event card and detail view</div>
              </div>
            </div>
          </>}
        </section>
        </ScrollReveal>

        {mode === "submit" && <ScrollReveal delay={60}><section>
          <div className="display" style={sectionHeadStyle}>EVENT TYPES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EVENT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={`filter-tag ${form.selectedTypes.includes(t) ? "active" : ""}`}>{t}</button>
            ))}
          </div>
        </section></ScrollReveal>}

        {mode === "submit" && <ScrollReveal delay={80}><section>
          <div className="display" style={sectionHeadStyle}>EVENT FLAGS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <EventTypeTag
              label="HOUSE PARTY"
              interactive
              active={form.isHouseParty}
              onClick={() => setForm(f => ({ ...f, isHouseParty: !f.isHouseParty }))}
              testId="toggle-house-party"
            />
            <EventTypeTag
              label="SEX POSITIVE"
              interactive
              active={form.isSexPositive}
              onClick={() => setForm(f => ({ ...f, isSexPositive: !f.isSexPositive }))}
              testId="toggle-sex-positive"
            />
            <EventTypeTag
              label="NUDITY OK"
              interactive
              active={form.nudityOk}
              onClick={() => setForm(f => ({ ...f, nudityOk: !f.nudityOk }))}
              testId="toggle-nudity-ok"
            />
          </div>

          {form.isHouseParty && (
            <div style={{
              marginTop: 16, padding: "14px 16px",
              border: "2px solid var(--neon-orange)", background: "rgba(255,102,0,0.08)",
              display: "flex", gap: 12, alignItems: "flex-start",
            }} data-testid="house-party-warning">
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", color: "var(--neon-orange)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
                  Heads up — House Parties Are Public
                </div>
                <div style={{ fontSize: "0.82rem", color: "#aaa", lineHeight: 1.5 }}>
                  We don't have a way to do invite-only. If you post it here, it's open to the public. Anyone browsing this guide can see it and show up. Only post your house party if you're genuinely open to the community attending.
                </div>
              </div>
            </div>
          )}
        </section></ScrollReveal>}

        <ScrollReveal delay={100}>
        <section ref={reviewRef}>
          <div className="display" style={sectionHeadStyle}>REVIEW</div>
          <p style={{ color: "#888", fontSize: "0.84rem", lineHeight: 1.6, marginBottom: 16 }}>
            {mode === "claim"
              ? "Double-check your claim proof and selected event. Submitting sends both the claim and your promoter verification request to the admin queue."
              : "All fields look good? Hit submit — your event goes to the review queue before going live."}
          </p>
          <button
            type="submit"
            disabled={mutation.isPending || (mode === "submit" && !canSubmitNew)}
            className="btn-neon solid"
            style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center", width: "100%", opacity: mode === "submit" && !canSubmitNew ? 0.5 : 1 }}
            data-testid="submit-button"
          >
            {mutation.isPending ? "Submitting..." : mode === "claim" ? "Submit Claim + Promoter Request →" : "Submit for Review →"}
          </button>
          <p style={{ color: "var(--text-faint)", fontSize: "0.75rem", textAlign: "center", marginTop: 10 }}>All submissions are reviewed before going live.</p>
        </section>
        </ScrollReveal>
      </form>
      </div>
    </div>
  );
}