import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import ImageUploader from "@/components/ImageUploader";
import EventTypeTag from "@/components/EventTypeTag";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { labelStyle, inputStyle } from "./DashboardProfileEditor";

const EVENT_TYPES = ["Dance Party", "Drag", "Kink", "Social", "Brunch", "Performance", "Fair", "Education", "Trans", "Nightlife", "Sex Positive", "Nudity OK", "Other"];
const NEIGHBORHOODS = ["NE Portland", "SE Portland", "N Portland", "NW Portland", "SW Portland", "Downtown", "Pearl District", "Other"];

export function DashboardEventEditForm({
  editingEvent,
  eventForm,
  setEventForm,
  hostUpdate,
  setHostUpdate,
  onCancel,
  onSave,
  onPostUpdate,
  saving,
  posting,
}: {
  editingEvent: any;
  eventForm: any;
  setEventForm: (fn: (f: any) => any) => void;
  hostUpdate: string;
  setHostUpdate: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onPostUpdate: () => void;
  saving: boolean;
  posting: boolean;
}) {
  const { toast } = useToast();
  const [coHostForm, setCoHostForm] = useState({ username: "", email: "" });

  const { data: eventHosts = [], refetch: refetchHosts } = useQuery<any[]>({
    queryKey: ["/api/events", editingEvent.id, "hosts"],
    queryFn: () => fetch(`/api/events/${editingEvent.id}/hosts`).then(r => r.ok ? r.json() : []),
  });

  const addCoHostMutation = useMutation({
    mutationFn: async (data: { username: string; email: string }) => {
      const res = await fetch(`/api/events/${editingEvent.id}/hosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not add co-host");
      return payload;
    },
    onSuccess: () => {
      toast({ title: "Co-host added" });
      setCoHostForm({ username: "", email: "" });
      refetchHosts();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleType = (t: string) => setEventForm((f: any) => ({
    ...f,
    eventTypes: f.eventTypes.includes(t) ? f.eventTypes.filter((x: string) => x !== t) : [...f.eventTypes, t],
  }));

  return (
    <div className="dash-edit-panel" style={{ borderColor: "#19E3FF" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 className="dash-anton" style={{ fontSize: "1.1rem", color: "#19E3FF" }}>Editing: {editingEvent.title}</h3>
        <button type="button" onClick={onCancel} className="dash-mini-btn" style={{ color: "var(--text-meta)" }}>Cancel</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Event title *</label>
            <input style={inputStyle} value={eventForm.title} onChange={e => setEventForm((f: any) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Description *</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={eventForm.description} onChange={e => setEventForm((f: any) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Venue name *</label>
            <input style={inputStyle} value={eventForm.venueName} onChange={e => setEventForm((f: any) => ({ ...f, venueName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Neighborhood</label>
            <select style={inputStyle} value={eventForm.neighborhood} onChange={e => setEventForm((f: any) => ({ ...f, neighborhood: e.target.value }))}>
              {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Address *</label>
            <input style={inputStyle} value={eventForm.address} onChange={e => setEventForm((f: any) => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Day</label>
            <select style={inputStyle} value={eventForm.dayOfWeek} onChange={e => setEventForm((f: any) => ({ ...f, dayOfWeek: e.target.value }))}>
              <option value="THU">Thursday July 16</option>
              <option value="FRI">Friday July 17</option>
              <option value="SAT">Saturday July 18</option>
              <option value="SUN">Sunday July 19</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Age requirement</label>
            <select style={inputStyle} value={eventForm.ageRequirement} onChange={e => setEventForm((f: any) => ({ ...f, ageRequirement: e.target.value }))}>
              <option value="ALL_AGES">All Ages</option>
              <option value="18_PLUS">18+</option>
              <option value="21_PLUS">21+</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Start</label>
            <input type="datetime-local" style={inputStyle} value={eventForm.dateStart} onChange={e => setEventForm((f: any) => ({ ...f, dateStart: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>End</label>
            <input type="datetime-local" style={inputStyle} value={eventForm.dateEnd} onChange={e => setEventForm((f: any) => ({ ...f, dateEnd: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Admission</label>
            <select style={inputStyle} value={eventForm.admission} onChange={e => setEventForm((f: any) => ({ ...f, admission: e.target.value }))}>
              <option value="FREE">Free</option>
              <option value="TICKETED">Ticketed</option>
              <option value="SUGGESTED_DONATION">Suggested Donation</option>
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Ticket / RSVP link *</label>
            <input type="url" style={inputStyle} value={eventForm.ticketUrl} onChange={e => setEventForm((f: any) => ({ ...f, ticketUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Event flyer / poster</label>
            <ImageUploader
              endpoint="/api/upload/poster"
              fieldName="poster"
              currentUrl={eventForm.posterImageUrl}
              onUploaded={(url: string) => setEventForm((f: any) => ({ ...f, posterImageUrl: url }))}
              label="UPLOAD FLYER"
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Event types</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {EVENT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={`filter-tag ${eventForm.eventTypes.includes(t) ? "active" : ""}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Flags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            <EventTypeTag label="HOUSE PARTY" interactive active={!!eventForm.isHouseParty}
              onClick={() => setEventForm((f: any) => ({ ...f, isHouseParty: !f.isHouseParty }))} />
            <EventTypeTag label="SEX POSITIVE" interactive active={!!eventForm.isSexPositive}
              onClick={() => setEventForm((f: any) => ({ ...f, isSexPositive: !f.isSexPositive }))} />
            <EventTypeTag label="NUDITY OK" interactive active={!!eventForm.nudityOk}
              onClick={() => setEventForm((f: any) => ({ ...f, nudityOk: !f.nudityOk }))} />
          </div>
        </div>
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
          <label style={labelStyle}>Event hosts ({eventHosts.length}/3)</label>
          {eventHosts.length > 0 && (
            <div className="event-hosts-row" style={{ marginTop: 10, marginBottom: 12 }}>
              {eventHosts.map((host: any) => (
                <div key={host.userId} className="event-host-card">
                  <UserAvatar
                    photoUrl={host.photoUrl}
                    avatarChoice={host.avatarChoice}
                    avatarRing={host.avatarRing}
                    displayName={host.displayName}
                    username={host.username}
                    size={48}
                  />
                  <div className="event-host-meta">
                    <span className="event-host-name">{host.displayName || host.username}</span>
                    {host.role === "PRIMARY" && <span className="event-host-role">Primary</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {eventHosts.length < 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <input
                style={inputStyle}
                placeholder="Co-host username"
                value={coHostForm.username}
                onChange={e => setCoHostForm(f => ({ ...f, username: e.target.value }))}
              />
              <input
                style={inputStyle}
                type="email"
                placeholder="Co-host email"
                value={coHostForm.email}
                onChange={e => setCoHostForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
          )}
          {eventHosts.length < 3 && (
            <button
              type="button"
              className="dash-btn dash-btn-lime"
              disabled={addCoHostMutation.isPending || !coHostForm.username.trim() || !coHostForm.email.trim()}
              onClick={() => addCoHostMutation.mutate(coHostForm)}
              style={{ marginBottom: 16, opacity: !coHostForm.username.trim() || !coHostForm.email.trim() ? 0.5 : 1 }}
            >
              {addCoHostMutation.isPending ? "Adding..." : "Add co-host →"}
            </button>
          )}
        </div>
        <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
          <label style={labelStyle}>Post host update</label>
          <p style={{ fontSize: "0.76rem", color: "var(--text-meta)", marginBottom: 8, lineHeight: 1.4 }}>
            Pinned on your event detail page (max 2 visible, newest first).
          </p>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            value={hostUpdate}
            onChange={e => setHostUpdate(e.target.value)}
            placeholder="Door time change, weather note, last-minute info..."
            maxLength={1000}
          />
          <button
            type="button"
            onClick={onPostUpdate}
            disabled={!hostUpdate.trim() || posting}
            className="dash-btn dash-btn-lime"
            style={{ marginTop: 10, opacity: !hostUpdate.trim() || posting ? 0.5 : 1 }}
          >
            {posting ? "Posting..." : "Post update →"}
          </button>
        </div>
        <button type="button" onClick={onSave} disabled={saving} className="dash-btn dash-btn-lime active" style={{ alignSelf: "flex-start" }}>
          {saving ? "Saving..." : "Save event →"}
        </button>
      </div>
    </div>
  );
}

export function DashboardGigEditForm({
  gigForm,
  setGigForm,
  onSave,
  onCancel,
}: {
  gigForm: { title: string; description: string; skills: string; compensation: string; location: string };
  setGigForm: (fn: (f: typeof gigForm) => typeof gigForm) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="dash-edit-panel" style={{ borderColor: "#FF8C00", marginBottom: 8 }}>
      <h3 className="dash-anton" style={{ color: "#FF8C00", fontSize: "1rem", marginBottom: 12 }}>Edit gig post</h3>
      <input style={inputStyle} value={gigForm.title} onChange={e => setGigForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" />
      <textarea style={{ ...inputStyle, marginTop: 10, minHeight: 90, resize: "vertical" }} value={gigForm.description} onChange={e => setGigForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
        <input style={inputStyle} value={gigForm.skills} onChange={e => setGigForm(f => ({ ...f, skills: e.target.value }))} placeholder="Skills" />
        <input style={inputStyle} value={gigForm.compensation} onChange={e => setGigForm(f => ({ ...f, compensation: e.target.value }))} placeholder="Compensation" />
        <input style={inputStyle} value={gigForm.location} onChange={e => setGigForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={onSave} className="dash-btn dash-btn-lime active" style={{ borderColor: "#FF8C00", background: "#FF8C00" }}>Save</button>
        <button type="button" onClick={onCancel} className="dash-btn dash-btn-ghost">Cancel</button>
      </div>
    </div>
  );
}