import { useEffect, useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";

const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];

// Must match TYPE_FILTERS tags on Events page (minus FREE/TICKETED/21+/ALL AGES/PUBLIC which are derived from other fields)
const EVENT_TYPES = ["Dance Party", "Drag", "Kink", "Social", "Brunch", "Performance", "Fair", "Education", "Trans", "Nightlife", "Sex Positive", "Nudity OK", "Other"];

const inputStyle = { width: "100%", background: "#111", border: "1px solid #222", color: "#fff", padding: "10px 12px", fontSize: "0.88rem", fontFamily: "var(--font-body)", boxSizing: "border-box" as const };
const labelStyle = { display: "block", fontSize: "0.72rem", fontFamily: "var(--font-display)", color: "#555", marginBottom: 5, letterSpacing: "0.06em", textTransform: "uppercase" as const };
const sectionHeadStyle = { fontSize: "1rem", color: "var(--neon-yellow)", marginBottom: 12, borderBottom: "1px solid #1a1a1a", paddingBottom: 8 };

export default function Submit() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const initialMode = params.get("mode") === "claim" ? "claim" : "submit";
  const initialEventId = params.get("eventId") || "";
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

  const { data: unclaimedEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/events/unclaimed"],
    queryFn: () => apiRequest("GET", "/api/events/unclaimed").then(r => r.json()),
    enabled: mode === "claim",
  });

  useEffect(() => {
    if (!loading && !user) setShowAuth(true);
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    setForm(f => ({
      ...f,
      submitterName: user.displayName || user.username,
      submitterEmail: user.email,
    }));
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", "/api/submit", {
        ...data,
        eventTypes: data.selectedTypes,
        type: mode === "claim" ? "CLAIM" : "NEW_EVENT",
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your submission is pending review." });
      setForm(f => ({ ...f, title: "", description: "", claimReason: "", eventId: "" }));
    },
    onError: () => toast({ title: "Error", description: "Something went wrong. Try again.", variant: "destructive" }),
  });

  const toggle = (key: keyof typeof form) => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }));
  const toggleType = (t: string) => setForm(f => ({
    ...f, selectedTypes: f.selectedTypes.includes(t) ? f.selectedTypes.filter(x => x !== t) : [...f.selectedTypes, t]
  }));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 20px" }}>
      {showAuth && !user && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      <div className="sticker" style={{ color: "var(--neon-cyan)", borderColor: "var(--neon-cyan)", marginBottom: 16 }}>Promoters &amp; Organizers</div>
      <h1 className="display" style={{ fontSize: "2.5rem", marginBottom: 8 }}>
        {mode === "submit" ? "SUBMIT AN EVENT" : "CLAIM AN EVENT"}
      </h1>
      <p style={{ color: "#666", marginBottom: 32, lineHeight: 1.6 }}>
        Log in or create an account first. Submissions and claims stay tied to your dashboard while admins review them.
      </p>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 40, border: "1px solid #222" }}>
        <button onClick={() => setMode("submit")} className={mode === "submit" ? "btn-neon solid" : "btn-neon"} style={{ flex: 1, justifyContent: "center", border: "none" }} data-testid="mode-submit">Submit New Event</button>
        <button onClick={() => setMode("claim")} className={mode === "claim" ? "btn-neon solid" : "btn-neon"} style={{ flex: 1, justifyContent: "center", border: "none", borderLeft: "1px solid #222" }} data-testid="mode-claim">Claim Existing Event</button>
      </div>

      {!user && (
        <div style={{ border: "2px solid var(--neon-yellow)", background: "rgba(204,255,0,0.08)", padding: 18, marginBottom: 24 }}>
          <div className="display" style={{ color: "var(--neon-yellow)", fontSize: "1rem", marginBottom: 6 }}>ACCOUNT REQUIRED</div>
          <p style={{ color: "#aaa", fontSize: "0.86rem", lineHeight: 1.5, marginBottom: 14 }}>
            Create an account or log in, then this form will attach the event or claim to your dashboard for review.
          </p>
          <button type="button" className="btn-neon solid" onClick={() => setShowAuth(true)}>Log In / Join →</button>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); if (!user) { setShowAuth(true); return; } mutation.mutate(form); }} style={{ display: "flex", flexDirection: "column", gap: 20, opacity: user ? 1 : 0.6 }}>
        {/* Contact */}
        <section>
          <div className="display" style={sectionHeadStyle}>YOUR INFO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["submitterName", "Your Name *"], ["submitterEmail", "Email *"], ["submitterOrg", "Organization (optional)"]].map(([k, label]) => (
              <div key={k} style={{ gridColumn: k === "submitterOrg" ? "1/-1" : "auto" }}>
                <label style={labelStyle}>{label}</label>
                <input value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  required={k !== "submitterOrg"} disabled={k !== "submitterOrg"} style={{ ...inputStyle, opacity: k !== "submitterOrg" ? 0.7 : 1 }} />
              </div>
            ))}
          </div>
        </section>

        {mode === "claim" && (
          <section>
            <div className="display" style={sectionHeadStyle}>CLAIM DETAILS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>Event to Claim *</label>
                <select value={form.eventId} onChange={e => setForm(f => ({ ...f, eventId: e.target.value }))} required style={inputStyle} data-testid="select-claim-event">
                  <option value="">Select an unclaimed event...</option>
                  {unclaimedEvents.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} · {event.venueName} · {event.dayOfWeek || "TBD"}
                    </option>
                  ))}
                </select>
                {unclaimedEvents.length === 0 && (
                  <div style={{ fontSize: "0.76rem", color: "#555", marginTop: 6 }}>No unclaimed events are available right now.</div>
                )}
              </div>
              <div>
                <label style={labelStyle}>How are you connected to this event? *</label>
                <textarea value={form.claimReason} onChange={e => setForm(f => ({ ...f, claimReason: e.target.value }))} rows={4} required
                  placeholder="Tell us your organizer role and include a website, ticketing dashboard, social link, or other proof."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          </section>
        )}

        {/* Event details */}
        {mode === "submit" && <section>
          <div className="display" style={sectionHeadStyle}>EVENT DETAILS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={labelStyle}>Event Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={4}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Venue Name *</label>
                <input value={form.venueName} onChange={e => setForm(f => ({ ...f, venueName: e.target.value }))} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Neighborhood</label>
                <select value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} style={inputStyle}>
                  {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Venue Address *</label>
                <input
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  required={!form.isHouseParty}
                  placeholder={form.isHouseParty ? "Optional for house parties" : "Street address (required)"}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Day of Week</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))} style={inputStyle}>
                  <option value="THU">Thursday July 16</option>
                  <option value="FRI">Friday July 17</option>
                  <option value="SAT">Saturday July 18</option>
                  <option value="SUN">Sunday July 19</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Age Requirement</label>
                <select value={form.ageRequirement} onChange={e => setForm(f => ({ ...f, ageRequirement: e.target.value }))} style={inputStyle}>
                  <option value="ALL_AGES">All Ages</option>
                  <option value="18_PLUS">18+</option>
                  <option value="21_PLUS">21+</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Start *</label>
                <input type="datetime-local" value={form.dateStart} onChange={e => setForm(f => ({ ...f, dateStart: e.target.value }))} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End *</label>
                <input type="datetime-local" value={form.dateEnd} onChange={e => setForm(f => ({ ...f, dateEnd: e.target.value }))} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Admission</label>
                <select value={form.admission} onChange={e => setForm(f => ({ ...f, admission: e.target.value }))} style={inputStyle}>
                  <option value="FREE">Free</option>
                  <option value="TICKETED">Ticketed</option>
                  <option value="SUGGESTED_DONATION">Suggested Donation</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Ticket / RSVP Link *</label>
              <input value={form.ticketUrl} onChange={e => setForm(f => ({ ...f, ticketUrl: e.target.value }))} type="url" placeholder="https://eventbrite.com/... (required)" required style={inputStyle} />
              <div style={{ fontSize: "0.72rem", color: "#444", marginTop: 4 }}>Link to buy tickets, RSVP, or find more info. All events must have a link.</div>
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
              <div style={{ fontSize: "0.72rem", color: "#444", marginTop: 6 }}>jpg/png/gif/webp · max 8MB · appears on the event card and detail view</div>
            </div>
          </div>
        </section>}

        {/* Event Types / Tags */}
        {mode === "submit" && <section>
          <div className="display" style={sectionHeadStyle}>EVENT TYPES</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {EVENT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={`filter-tag ${form.selectedTypes.includes(t) ? "active" : ""}`}>{t}</button>
            ))}
          </div>
        </section>}

        {/* Event Flags */}
        {mode === "submit" && <section>
          <div className="display" style={sectionHeadStyle}>EVENT FLAGS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              ["isHouseParty", "House Party"],
            ].map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 12px", border: "1px solid #222", background: (form as any)[key] ? "#1a1a0a" : "transparent" }}>
                <input type="checkbox" checked={(form as any)[key]} onChange={() => toggle(key as keyof typeof form)} style={{ accentColor: "var(--neon-yellow)" }} />
                <span style={{ fontSize: "0.8rem", fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: (form as any)[key] ? "var(--neon-yellow)" : "#666" }}>{label}</span>
              </label>
            ))}
          </div>

          {/* House party public warning */}
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
        </section>}

        <button type="submit" disabled={mutation.isPending} className="btn-neon solid" style={{ fontSize: "1rem", padding: "14px 0", justifyContent: "center" }} data-testid="submit-button">
          {mutation.isPending ? "Submitting..." : mode === "claim" ? "Submit Claim Request →" : "Submit for Review →"}
        </button>
        <p style={{ color: "#444", fontSize: "0.75rem", textAlign: "center" }}>All submissions are reviewed before going live.</p>
      </form>
    </div>
  );
}
