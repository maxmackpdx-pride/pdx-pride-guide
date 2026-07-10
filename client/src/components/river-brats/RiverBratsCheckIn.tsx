import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { formatRiverBratsHour, pacificTodayDate } from "@shared/riverBrats";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ds";
import RiverBratsHourChips from "./RiverBratsHourChips";
import RiverBratsReportButton from "./RiverBratsReportButton";

type CheckinRow = {
  id: number;
  user_id: number;
  arrival_hour: number;
  note?: string | null;
  username: string;
  displayName?: string | null;
  avatarChoice?: number;
  photoUrl?: string | null;
};

type Props = {
  beachId: NudeBeachTab;
  accent: "cyan" | "orange";
};

export default function RiverBratsCheckIn({ beachId, accent }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const today = pacificTodayDate();

  const queryKey = ["/api/river-brats/checkins", beachId, today] as const;

  const { data: rows = [], isLoading } = useQuery<CheckinRow[]>({
    queryKey,
    queryFn: () => fetch(`/api/river-brats/checkins?beach=${beachId}&date=${today}`, { credentials: "include" }).then(r => r.json()),
  });

  const mine = user ? rows.find(r => r.user_id === user.id) : undefined;

  const saveMutation = useMutation({
    mutationFn: () =>
      fetch("/api/river-brats/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ beachId, arrivalHour: hour, note: note.trim() || undefined, date: today }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not check in");
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
      toast({ title: "Checked in", description: "You're on today's River Brats board." });
    },
    onError: (err: Error) => toast({ title: "Could not check in", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/river-brats/checkins/${id}`, { method: "DELETE", credentials: "include" }).then(async r => {
        if (!r.ok) throw new Error("Could not remove check-in");
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
      setHour(null);
      setNote("");
    },
  });

  const requireAuth = () => {
    if (user) return true;
    setShowAuth(true);
    return false;
  };

  return (
    <div className="rb-panel">
      <p className="rb-panel__lede">
        <strong>{rows.length}</strong> heading out today · pick when you expect to arrive (7am–9pm).
      </p>

      <div className="rb-compose">
        <div className="rb-compose__label">I'll be there around</div>
        <RiverBratsHourChips value={hour ?? mine?.arrival_hour ?? null} onChange={setHour} accent={accent} />
        <input
          className="rb-input"
          value={note}
          onChange={e => setNote(e.target.value.slice(0, 80))}
          placeholder="Optional note (no addresses)"
          maxLength={80}
        />
        <div className="rb-compose__actions">
          {mine ? (
            <>
              <Button variant="solid" accent={accent === "cyan" ? "cyan" : "orange"} size="sm" disabled={!hour || saveMutation.isPending} onClick={() => requireAuth() && saveMutation.mutate()}>
                Update check-in
              </Button>
              <Button variant="outline" accent="cyan" size="sm" onClick={() => deleteMutation.mutate(mine.id)}>
                Remove
              </Button>
            </>
          ) : (
            <Button variant="solid" accent={accent === "cyan" ? "cyan" : "orange"} size="sm" disabled={hour == null || saveMutation.isPending} onClick={() => requireAuth() && saveMutation.mutate()}>
              Check in for today
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="rb-empty">Loading check-ins…</p>
      ) : rows.length === 0 ? (
        <p className="rb-empty">Nobody's checked in yet today. Be first.</p>
      ) : (
        <ul className="rb-feed">
          {rows.map(row => (
            <li key={row.id} className="rb-card">
              <UserAvatar
                username={row.username}
                displayName={row.displayName}
                photoUrl={row.photoUrl}
                avatarChoice={row.avatarChoice}
                size={36}
              />
              <div className="rb-card__body">
                <div className="rb-card__title">{row.displayName || row.username}</div>
                <div className="rb-card__meta">
                  <span className={`rb-chip rb-chip--${accent}`}>{formatRiverBratsHour(row.arrival_hour)}</span>
                  {row.note ? <span className="rb-card__note">{row.note}</span> : null}
                </div>
              </div>
              {row.user_id !== user?.id ? <RiverBratsReportButton targetType="CHECKIN" targetId={row.id} /> : null}
            </li>
          ))}
        </ul>
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}