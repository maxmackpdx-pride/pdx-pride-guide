import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import ImageUploader from "@/components/ImageUploader";
import EventTypeTag from "@/components/EventTypeTag";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";
import { labelStyle, inputStyle } from "./DashboardProfileEditor";
import EventTalentPanel from "@/components/EventTalentPanel";
import UsernameAutocomplete from "@/components/UsernameAutocomplete";
import { PRIDE_WEEK_DAY_OPTIONS } from "@shared/prideWeek";
import { EVENT_TYPE_PICKER_LABELS } from "@shared/eventTypeTags";
import type { EventEditFormState } from "@/lib/eventEditForm";
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
  showExtras = true,
  embedded = false,
}: {
  editingEvent: { id: number; title: string; isClaimable?: boolean };
  eventForm: EventEditFormState;
  setEventForm: (fn: (f: EventEditFormState) => EventEditFormState) => void;
  hostUpdate: string;
  setHostUpdate: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onPostUpdate: () => void;
  saving: boolean;
  posting: boolean;
  showExtras?: boolean;
  embedded?: boolean;
}) {
  const { toast } = useToast();
  const [coHostUsername, setCoHostUsername] = useState("");

  const { data: eventHosts = [], refetch: refetchHosts } = useQuery<any[]>({
    queryKey: ["/api/events", editingEvent.id, "hosts"],
    queryFn: () => fetch(`/api/events/${editingEvent.id}/hosts`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const addCoHostMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; }) => {
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
      setCoHostUsername("");
      refetchHosts();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleType = (t: string) => setEventForm(f => ({
    ...f,
    selectedTypes: f.selectedTypes.includes(t)
      ? f.selectedTypes.filter(x => x !== t)
      : [...f.selectedTypes, t],
  }));

  const panelClass = embedded ? "event-modal__edit-panel" : "dash-edit-panel";
  const accent = embedded ? "var(--neon-cyan)" : "#19E3FF";

  return (
    <div className={panelClass} style={embedded ? undefined : { borderColor: accent }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 className={embedded ? "display" : "dash-anton"} style={{ fontSize: "1.1rem", color: accent }}>
          {embedded ? "Edit event" : `Editing: ${editingEvent.title}`}
        </h3>
        <button type="button" onClick={onCancel} className={embedded ? "event-modal__btn-ghost" : "dash-mini-btn"} style={{ color: "var(--text-meta)" }}>Cancel</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="dash-edit-grid">
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Event title *</label>
            <input style={inputStyle} value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Description *</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Venue name *</label>
            <input style={inputStyle} value={eventForm.venueName} onChange={e => setEventForm(f => ({ ...f, venueName: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Neighborhood</label>
            <select style={inputStyle} value={eventForm.neighborhood} onChange={e => setEventForm(f => ({ ...f, neighborhood: e.target.value }))}>
              {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Address *</label>
            <input style={inputStyle} value={eventForm.address} onChange={e => setEventForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Day</label>
            <select style={inputStyle} value={eventForm.dayOfWeek} onChange={e => setEventForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
              {PRIDE_WEEK_DAY_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Age requirement</label>
            <select style={inputStyle} value={eventForm.ageRequirement} onChange={e => setEventForm(f => ({ ...f, ageRequirement: e.target.value }))}>
              <option value="ALL_AGES">All Ages</option>
              <option value="18_PLUS">18+</option>
              <option value="21_PLUS">21+</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Start</label>
            <input type="datetime-local" style={inputStyle} value={eventForm.dateStart} onChange={e => setEventForm(f => ({ ...f, dateStart: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>End</label>
            <input type="datetime-local" style={inputStyle} value={eventForm.dateEnd} onChange={e => setEventForm(f => ({ ...f, dateEnd: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Admission</label>
            <select style={inputStyle} value={eventForm.admission} onChange={e => setEventForm(f => ({ ...f, admission: e.target.value }))}>
              <option value="FREE">Free</option>
              <option value="TICKETED">Ticketed</option>
              <option value="SUGGESTED_DONATION">Suggested Donation</option>
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Ticket / RSVP link *</label>
            <input type="url" style={inputStyle} value={eventForm.ticketUrl} onChange={e => setEventForm(f => ({ ...f, ticketUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Event flyer / poster</label>
            <ImageUploader
              endpoint="/api/upload/poster"
              fieldName="poster"
              currentUrl={eventForm.posterImageUrl}
              onUploaded={(url: string) => setEventForm(f => ({ ...f, posterImageUrl: url }))}
              label="UPLOAD FLYER"
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Event types</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {EVENT_TYPE_PICKER_LABELS.map(t => (
              <button key={t} type="button" onClick={() => toggleType(t)}
                className={`filter-tag ${eventForm.selectedTypes.includes(t) ? "active" : ""}`}>{t}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Flags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            <EventTypeTag label="HOUSE PARTY" interactive active={!!eventForm.isHouseParty}
              onClick={() => setEventForm(f => ({ ...f, isHouseParty: !f.isHouseParty }))} />
            <EventTypeTag label="SEX POSITIVE" interactive active={!!eventForm.isSexPositive}
              onClick={() => setEventForm(f => ({ ...f, isSexPositive: !f.isSexPositive }))} />
            <EventTypeTag label="NUDITY OK" interactive active={!!eventForm.nudityOk}
              onClick={() => setEventForm(f => ({ ...f, nudityOk: !f.nudityOk }))} />
          </div>
        </div>
        {showExtras && <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
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
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <UsernameAutocomplete
                value={coHostUsername}
                onChange={setCoHostUsername}
                style={{ flex: 1 }}
                inputStyle={{ ...inputStyle, width: "100%" }}
              />
              <button
                type="button"
                className="dash-btn dash-btn-lime"
                disabled={addCoHostMutation.isPending || !coHostUsername.trim()}
                onClick={() => addCoHostMutation.mutate({ username: coHostUsername, email: "" })}
                style={{ opacity: !coHostUsername.trim() ? 0.5 : 1 }}
              >
                {addCoHostMutation.isPending ? "Adding…" : "Add →"}
              </button>
            </div>
          )}
        </div>}
        {showExtras && <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
          <EventTalentPanel
            eventId={editingEvent.id}
            eventTitle={editingEvent.title}
            dayColor="#19E3FF"
            mode="manage"
            isClaimable={editingEvent.isClaimable}
          />
        </div>}
        {showExtras && <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
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
        </div>}
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={embedded ? "btn-neon solid event-modal__action-btn" : "dash-btn dash-btn-lime active"}
          style={embedded ? undefined : { alignSelf: "flex-start" }}
        >
          {saving ? "Saving..." : embedded ? "Save changes" : "Save event →"}
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
      <div className="dash-gig-edit-grid" style={{ marginTop: 10 }}>
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