import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import {
  CARPOOL_DEPARTURE_AREAS,
  formatRiverBratsHour,
  pacificTodayDate,
  type CarpoolPostType,
} from "@shared/riverBrats";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ds";
import RiverBratsHourChips from "./RiverBratsHourChips";
import RiverBratsReportButton from "./RiverBratsReportButton";

type CarpoolRow = {
  id: number;
  user_id: number;
  post_type: CarpoolPostType;
  departure_area: string;
  leave_hour: number;
  seats?: number | null;
  note: string;
  username: string;
  displayName?: string | null;
  avatarChoice?: number;
  photoUrl?: string | null;
  isMine?: boolean;
  requestCount?: number;
};

type Props = {
  beachId: NudeBeachTab;
  accent: "cyan" | "orange" | "green";
};

export default function RiverBratsCarpool({ beachId, accent }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [postType, setPostType] = useState<CarpoolPostType>("OFFERING_RIDE");
  const [departureArea, setDepartureArea] = useState<string>(CARPOOL_DEPARTURE_AREAS[0]);
  const [leaveHour, setLeaveHour] = useState<number | null>(null);
  const [seats, setSeats] = useState(2);
  const [note, setNote] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const today = pacificTodayDate();

  const queryKey = ["/api/river-brats/carpool", beachId, today] as const;

  const { data: rows = [], isLoading } = useQuery<CarpoolRow[]>({
    queryKey,
    queryFn: () => fetch(`/api/river-brats/carpool?beach=${beachId}&date=${today}`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ["/api/river-brats/carpool", activePostId, "requests"],
    queryFn: () => fetch(`/api/river-brats/carpool/${activePostId}/requests`, { credentials: "include" }).then(r => r.json()),
    enabled: !!activePostId && !!user,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      fetch("/api/river-brats/carpool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          beachId,
          postType,
          departureArea,
          leaveHour,
          seats: postType === "OFFERING_RIDE" ? seats : undefined,
          note,
          tripDate: today,
        }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not post");
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/carpool"] });
      setComposeOpen(false);
      setNote("");
      toast({ title: "Posted", description: "Your carpool is live for today." });
    },
    onError: (err: Error) => toast({ title: "Could not post", description: err.message, variant: "destructive" }),
  });

  const requestMutation = useMutation({
    mutationFn: (postId: number) =>
      fetch(`/api/river-brats/carpool/${postId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note: requestNote }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not request");
        return data;
      }),
    onSuccess: () => {
      setRequestNote("");
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/carpool"] });
      toast({ title: "Request sent" });
    },
    onError: (err: Error) => toast({ title: "Could not request", description: err.message, variant: "destructive" }),
  });

  const selectMutation = useMutation({
    mutationFn: ({ postId, requestId }: { postId: number; requestId: number }) =>
      fetch(`/api/river-brats/carpool/${postId}/select/${requestId}`, {
        method: "POST",
        credentials: "include",
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not select");
        return data;
      }),
    onSuccess: () => {
      setActivePostId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/carpool"] });
      toast({ title: "Rider selected", description: "Check your inbox to coordinate." });
    },
    onError: (err: Error) => toast({ title: "Could not select", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/river-brats/carpool/${id}`, { method: "DELETE", credentials: "include" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/river-brats/carpool"] }),
  });

  const leaveLabel = useMemo(
    () => (postType === "OFFERING_RIDE" ? "Leaving at" : "Need to leave at"),
    [postType],
  );

  const requireAuth = () => {
    if (user) return true;
    setShowAuth(true);
    return false;
  };

  const startCompose = (type: CarpoolPostType) => {
    if (!requireAuth()) return;
    setPostType(type);
    setComposeOpen(true);
  };

  const typeToggle = (
    <div className="rb-type-toggle">
      <button
        type="button"
        className={postType === "OFFERING_RIDE" ? "active" : ""}
        onClick={() => setPostType("OFFERING_RIDE")}
      >
        Offering a ride
      </button>
      <button
        type="button"
        className={postType === "NEED_RIDE" ? "active" : ""}
        onClick={() => setPostType("NEED_RIDE")}
      >
        Needing a ride
      </button>
    </div>
  );

  return (
    <div className="rb-panel">
      <div className="rb-panel__head">
        <p className="rb-panel__lede">Meet at public lots only — share exact details in private messages.</p>
      </div>

      {!composeOpen ? (
        <div className="rb-carpool-start">
          <p className="rb-carpool-start__prompt">What do you need today?</p>
          <div className="rb-type-toggle rb-type-toggle--start">
            <button type="button" onClick={() => startCompose("OFFERING_RIDE")}>Offering a ride</button>
            <button type="button" onClick={() => startCompose("NEED_RIDE")}>Needing a ride</button>
          </div>
        </div>
      ) : (
        <div className="rb-compose">
          {typeToggle}
          <label className="rb-compose__label">
            From
            <select className="rb-select" value={departureArea} onChange={e => setDepartureArea(e.target.value)}>
              {CARPOOL_DEPARTURE_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <div className="rb-compose__label">{leaveLabel}</div>
          <RiverBratsHourChips value={leaveHour} onChange={setLeaveHour} accent={accent} />
          {postType === "OFFERING_RIDE" && (
            <label className="rb-compose__label">
              Seats
              <input className="rb-input rb-input--narrow" type="number" min={1} max={4} value={seats} onChange={e => setSeats(Number(e.target.value))} />
            </label>
          )}
          <textarea className="rb-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Short note — no home addresses or phone numbers" rows={3} />
          <div className="rb-compose__actions">
            <Button variant="solid" accent={accent === "cyan" ? "cyan" : "orange"} size="sm" disabled={leaveHour == null || note.trim().length < 8 || createMutation.isPending} onClick={() => createMutation.mutate()}>
              Post for today
            </Button>
            <button type="button" className="rb-link-btn" onClick={() => setComposeOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="rb-empty">Loading carpools…</p>
      ) : rows.length === 0 ? (
        <p className="rb-empty">No carpools posted for today yet.</p>
      ) : (
        <ul className="rb-feed">
          {rows.map(row => (
            <li key={row.id} className="rb-card rb-card--carpool">
              <UserAvatar username={row.username} displayName={row.displayName} photoUrl={row.photoUrl} avatarChoice={row.avatarChoice} size={36} />
              <div className="rb-card__body">
                <div className="rb-card__title">{row.displayName || row.username}</div>
                <div className="rb-card__meta">
                  <span className="rb-chip">{row.post_type === "OFFERING_RIDE" ? "Offering a ride" : "Needing a ride"}</span>
                  <span>{row.departure_area}</span>
                  <span className={`rb-chip rb-chip--${accent}`}>
                    {row.post_type === "OFFERING_RIDE" ? "Leaving" : "Leave"} {formatRiverBratsHour(row.leave_hour)}
                  </span>
                  {row.seats ? <span>{row.seats} seat{row.seats === 1 ? "" : "s"}</span> : null}
                </div>
                <p className="rb-card__note">{row.note}</p>
                <div className="rb-card__actions">
                  {row.isMine ? (
                    <>
                      <button type="button" className="rb-link-btn" onClick={() => setActivePostId(row.id)}>Requests ({row.requestCount ?? 0})</button>
                      <button type="button" className="rb-link-btn" onClick={() => deleteMutation.mutate(row.id)}>Remove</button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      accent="cyan"
                      size="sm"
                      onClick={() => {
                        if (!requireAuth()) return;
                        if (!requestNote.trim()) {
                          toast({ title: "Add a note", description: "Use the note field below before requesting a ride.", variant: "destructive" });
                          return;
                        }
                        requestMutation.mutate(row.id);
                      }}
                    >
                      Request ride
                    </Button>
                  )}
                  {!row.isMine ? <RiverBratsReportButton targetType="CARPOOL" targetId={row.id} /> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!rows.some(r => r.isMine) && user && (
        <div className="rb-request-box">
          <input className="rb-input" value={requestNote} onChange={e => setRequestNote(e.target.value)} placeholder="Note when requesting a ride (required)" />
        </div>
      )}

      {activePostId && (
        <div className="rb-modal-backdrop" onClick={() => setActivePostId(null)}>
          <div className="rb-modal" onClick={e => e.stopPropagation()}>
            <h3 className="rb-modal__title">Ride requests</h3>
            {requests.length === 0 ? <p className="rb-empty">No requests yet.</p> : (
              <ul className="rb-feed">
                {requests.map((req: any) => (
                  <li key={req.id} className="rb-card">
                    <div className="rb-card__body">
                      <div className="rb-card__title">{req.displayName || req.username}</div>
                      <p className="rb-card__note">{req.note}</p>
                      <Button variant="solid" accent={accent === "cyan" ? "cyan" : "orange"} size="sm" onClick={() => selectMutation.mutate({ postId: activePostId, requestId: req.id })}>
                        Select & message
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}