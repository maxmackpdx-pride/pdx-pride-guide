import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import UserAvatar from "@/components/UserAvatar";
import EventTypeTag from "@/components/EventTypeTag";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  EVENT_TALENT_ROLES,
  EVENT_TALENT_ROLE_LABELS,
  type EventTalentRow,
  type EventTalentRole,
} from "@shared/eventTalent";

type Props = {
  eventId: number;
  eventTitle: string;
  dayColor?: string;
  mode: "view" | "manage";
  isClaimable?: boolean;
};

function groupByRole(rows: EventTalentRow[]) {
  const map = new Map<EventTalentRole, EventTalentRow[]>();
  for (const row of rows) {
    const role = row.role as EventTalentRole;
    if (!map.has(role)) map.set(role, []);
    map.get(role)!.push(row);
  }
  return EVENT_TALENT_ROLES.filter(r => map.has(r)).map(role => ({ role, rows: map.get(role)! }));
}

export default function EventTalentPanel({ eventId, eventTitle, dayColor = "#CCFF00", mode, isClaimable }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hostUsername, setHostUsername] = useState("");
  const [hostRole, setHostRole] = useState<EventTalentRole>("DJ");
  const [selfRole, setSelfRole] = useState<EventTalentRole>("DJ");

  const { data: talent = [], refetch } = useQuery<EventTalentRow[]>({
    queryKey: ["/api/events", eventId, "talent", mode],
    queryFn: () => fetch(`/api/events/${eventId}/talent`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
  });

  const live = talent.filter(t => t.status === "LIVE");
  const pending = talent.filter(t => t.status === "PENDING");
  const grouped = groupByRole(live);
  const myRows = user ? talent.filter(t => t.userId === user.id) : [];

  const invalidate = () => refetch();

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${eventId}/talent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: hostUsername, role: hostRole }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not add talent");
      return payload;
    },
    onSuccess: () => {
      toast({ title: "Talent added", description: "They're live on the lineup." });
      setHostUsername("");
      invalidate();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const selfMutation = useMutation({
    mutationFn: async (role: EventTalentRole) => {
      const res = await fetch(`/api/events/${eventId}/talent/self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not submit request");
      return payload;
    },
    onSuccess: (data) => {
      toast({
        title: "Request sent",
        description: data.needsAdmin
          ? "Unclaimed event — admins will review your lineup request."
          : "The event host will review your request in their inbox.",
      });
      invalidate();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (talentId: number) =>
      fetch(`/api/events/${eventId}/talent/${talentId}/approve`, { method: "POST", credentials: "include" })
        .then(async r => {
          const p = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(p.error || "Approve failed");
          return p;
        }),
    onSuccess: () => { toast({ title: "Approved" }); invalidate(); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (talentId: number) =>
      fetch(`/api/events/${eventId}/talent/${talentId}/reject`, { method: "POST", credentials: "include" })
        .then(async r => {
          const p = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(p.error || "Deny failed");
          return p;
        }),
    onSuccess: () => { toast({ title: "Declined" }); invalidate(); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (talentId: number) =>
      fetch(`/api/events/${eventId}/talent/${talentId}`, { method: "DELETE", credentials: "include" })
        .then(async r => {
          const p = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(p.error || "Remove failed");
          return p;
        }),
    onSuccess: () => { toast({ title: "Removed from lineup" }); invalidate(); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const canSelfTag = user && mode === "view";

  return (
    <div className="event-talent-panel" style={{ marginBottom: 20 }}>
      <div className="display" style={{ fontSize: "0.78rem", color: dayColor, letterSpacing: "0.1em", marginBottom: 12 }}>
        LINEUP / TALENT
      </div>

      {grouped.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {grouped.map(({ role, rows }) => (
            <div key={role}>
              <div className="sticker" style={{ color: dayColor, borderColor: dayColor, fontSize: "0.58rem", marginBottom: 8, display: "inline-block" }}>
                {EVENT_TALENT_ROLE_LABELS[role].toUpperCase()}
              </div>
              <div className="event-hosts-row">
                {rows.map(row => (
                  <div key={row.id} className="event-host-card">
                    <UserAvatar
                      photoUrl={row.photoUrl}
                      avatarChoice={row.avatarChoice}
                      avatarRing={row.avatarRing}
                      displayName={row.displayName}
                      username={row.username}
                      size={mode === "manage" ? 44 : 52}
                    />
                    <div className="event-host-meta">
                      <span className="event-host-name">{row.displayName || row.username}</span>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-meta)" }}>@{row.username}</span>
                    </div>
                    {mode === "manage" && (
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(row.id)}
                        disabled={removeMutation.isPending}
                        style={{ background: "none", border: "none", color: "#FF2400", fontSize: "0.65rem", cursor: "pointer", fontFamily: "var(--font-display)" }}
                      >
                        REMOVE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "0.82rem", color: "var(--text-meta)", lineHeight: 1.5, margin: 0 }}>
          No talent tagged yet{isClaimable ? " — unclaimed listing" : ""}.
        </p>
      )}

      {mode === "manage" && pending.length > 0 && (
        <div style={{ marginTop: 16, padding: "12px 14px", border: "2px solid var(--neon-magenta)", background: "rgba(255,0,204,0.05)" }}>
          <div className="display" style={{ fontSize: "0.72rem", color: "var(--neon-magenta)", marginBottom: 10 }}>PENDING REQUESTS</div>
          {pending.map(row => (
            <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <div style={{ fontSize: "0.84rem", color: "#ddd" }}>
                <strong>{row.displayName || row.username}</strong> · {EVENT_TALENT_ROLE_LABELS[row.role as EventTalentRole]}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn-neon solid" style={{ fontSize: "0.65rem", padding: "6px 10px" }}
                  onClick={() => approveMutation.mutate(row.id)} disabled={approveMutation.isPending}>APPROVE</button>
                <button type="button" className="btn-neon" style={{ fontSize: "0.65rem", padding: "6px 10px", borderColor: "#FF2400", color: "#FF2400" }}
                  onClick={() => rejectMutation.mutate(row.id)} disabled={rejectMutation.isPending}>DENY</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "manage" && (
        <div style={{ marginTop: 16, borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-meta)", marginBottom: 8, fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}>
            ADD REGISTERED USER (LIVE IMMEDIATELY)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {EVENT_TALENT_ROLES.map(role => (
              <EventTypeTag key={role} label={EVENT_TALENT_ROLE_LABELS[role].toUpperCase()} interactive active={hostRole === role}
                onClick={() => setHostRole(role)} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={hostUsername}
              onChange={e => setHostUsername(e.target.value)}
              placeholder="@username"
              style={{ flex: 1, minWidth: 140, padding: "8px 10px", background: "#0a0a0a", border: "1px solid #333", color: "#fff", fontSize: "0.82rem" }}
            />
            <button type="button" className="btn-neon solid" style={{ fontSize: "0.72rem", padding: "8px 14px" }}
              disabled={addMutation.isPending || !hostUsername.trim()}
              onClick={() => addMutation.mutate()}>
              {addMutation.isPending ? "ADDING..." : "ADD →"}
            </button>
          </div>
        </div>
      )}

      {canSelfTag && (
        <div style={{ marginTop: 16, borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-meta)", marginBottom: 6, fontFamily: "var(--font-display)", letterSpacing: "0.06em" }}>
            I WORKED THIS EVENT
          </div>
          <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: 10, lineHeight: 1.45 }}>
            Tag yourself — {isClaimable ? "admins" : "the host"} approve before you appear on the public lineup.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {EVENT_TALENT_ROLES.map(role => (
              <EventTypeTag key={role} label={EVENT_TALENT_ROLE_LABELS[role].toUpperCase()} interactive active={selfRole === role}
                onClick={() => setSelfRole(role)} />
            ))}
          </div>
          <button type="button" className="btn-neon" style={{ fontSize: "0.72rem", padding: "8px 14px", borderColor: dayColor, color: dayColor }}
            disabled={selfMutation.isPending || myRows.some(t => t.role === selfRole && (t.status === "LIVE" || t.status === "PENDING"))}
            onClick={() => selfMutation.mutate(selfRole)}>
            {selfMutation.isPending ? "SENDING..." : `REQUEST ${EVENT_TALENT_ROLE_LABELS[selfRole].toUpperCase()} TAG →`}
          </button>
          {myRows.some(t => t.status === "PENDING") && (
            <p style={{ fontSize: "0.75rem", color: "var(--neon-magenta)", marginTop: 8 }}>You have a pending lineup request for this event.</p>
          )}
        </div>
      )}

      {mode === "view" && !user && live.length === 0 && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: 8 }}>Log in to request a talent tag if you worked this event.</p>
      )}
    </div>
  );
}