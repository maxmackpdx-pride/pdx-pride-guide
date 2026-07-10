import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import { formatRiverBratsHour, pacificTodayDate } from "@shared/riverBrats";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import UserAvatar from "@/components/UserAvatar";
import RiverBratsHourChips from "./RiverBratsHourChips";
import RiverBratsGroupChat from "./RiverBratsGroupChat";

type CheckinVisibility = "visible" | "anonymous";

type CheckinRow = {
  id: number;
  user_id: number;
  userId?: number;
  arrival_hour: number;
  note?: string | null;
  username: string;
  displayName?: string | null;
  avatarChoice?: number;
  photoUrl?: string | null;
  isAnonymous?: boolean;
  masked?: boolean;
  isMine?: boolean;
};

type Props = {
  beachId: NudeBeachTab;
  accent: "orange" | "green";
};

export default function RiverBratsCheckIn({ beachId, accent }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<CheckinVisibility>("visible");
  const today = pacificTodayDate();
  const beachShortLabel = beachId === "rooster-rock" ? "Rooster Rock" : "Collins Beach";

  const queryKey = ["/api/river-brats/checkins", beachId, today] as const;

  const { data: rows = [], isLoading } = useQuery<CheckinRow[]>({
    queryKey,
    queryFn: () =>
      fetch(`/api/river-brats/checkins?beach=${beachId}&date=${today}`, { credentials: "include" }).then(r =>
        r.json(),
      ),
  });

  const mine = user ? rows.find(r => (r.userId ?? r.user_id) === user.id) : undefined;
  const checkedIn = Boolean(mine);
  const goingCount = rows.length;

  useEffect(() => {
    if (!mine) return;
    setHour(mine.arrival_hour);
    setNote(mine.note || "");
    setVisibility(mine.isAnonymous ? "anonymous" : "visible");
  }, [mine?.id, mine?.arrival_hour, mine?.note, mine?.isAnonymous]);

  const saveMutation = useMutation({
    mutationFn: () =>
      fetch("/api/river-brats/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          beachId,
          arrivalHour: hour,
          note: note.trim() || undefined,
          date: today,
          isAnonymous: visibility === "anonymous",
        }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not check in");
        return data;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
      toast({ title: "Checked in", description: "Beach chat is open until midnight." });
    },
    onError: (err: Error) =>
      toast({ title: "Could not check in", description: err.message, variant: "destructive" }),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/river-brats/checkins/${id}`, { method: "DELETE", credentials: "include" }).then(async r => {
        if (!r.ok) throw new Error("Could not uncheck in");
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins/chat"] });
      setHour(null);
      setNote("");
      setVisibility("visible");
      toast({ title: "Unchecked in", description: "You're off today's beach list and out of the group chat." });
    },
    onError: (err: Error) =>
      toast({ title: "Could not uncheck in", description: err.message, variant: "destructive" }),
  });

  const uncheckIn = () => {
    if (!mine) return;
    withdrawMutation.mutate(mine.id);
  };

  const requireAuth = () => {
    if (user) return true;
    setShowAuth(true);
    return false;
  };

  const headerAvatars = useMemo(
    () =>
      rows.slice(0, 4).map(row => ({
        key: String(row.id),
        username: row.username,
        displayName: row.displayName,
        photoUrl: row.photoUrl,
        avatarChoice: row.avatarChoice,
        masked: row.masked,
      })),
    [rows],
  );

  const selfLabel =
    visibility === "anonymous" || mine?.masked
      ? "You (anonymous)"
      : `You · @${user?.username ?? mine?.username ?? "you"}`;

  return (
    <div className={`rb-checkin rb-checkin--${accent}`}>
      <div className="rb-checkin__pulse">
        <span className="rb-checkin__pulse-dot" aria-hidden />
        <span>
          <strong>{isLoading ? "…" : goingCount}</strong> heading out today · pick when you'll get there
        </span>
      </div>

      <div className="rb-checkin__grid">
        <section className="rb-checkin__form">
          <div className="rb-checkin__field-label">I'll be there around</div>
          <RiverBratsHourChips value={hour ?? mine?.arrival_hour ?? null} onChange={setHour} accent={accent} />

          <label className="rb-checkin__field-label" htmlFor="rb-checkin-note">
            Optional note
          </label>
          <input
            id="rb-checkin-note"
            className="rb-checkin__input"
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 80))}
            placeholder="e.g. bringing a canopy + cooler (no addresses)"
            maxLength={80}
          />

          <div className="rb-checkin__field-label">Show as</div>
          <div className="rb-checkin__visibility" role="group" aria-label="Visibility">
            <button
              type="button"
              className={`rb-checkin__seg${visibility === "visible" ? " rb-checkin__seg--active" : ""}`}
              onClick={() => setVisibility("visible")}
            >
              <span className="rb-checkin__seg-title">@username</span>
              <span className="rb-checkin__seg-hint">Name + photo on the list and in chat</span>
            </button>
            <button
              type="button"
              className={`rb-checkin__seg${visibility === "anonymous" ? " rb-checkin__seg--active" : ""}`}
              onClick={() => setVisibility("anonymous")}
            >
              <span className="rb-checkin__seg-title">Anonymous</span>
              <span className="rb-checkin__seg-hint">
                Counted in "going" · no name or photo, posts as "Anonymous"
              </span>
            </button>
          </div>

          <div className="rb-checkin__actions">
            <button
              type="button"
              className={`rb-checkin__primary${checkedIn ? " rb-checkin__primary--update" : ""}`}
              disabled={hour == null || saveMutation.isPending}
              onClick={() => requireAuth() && saveMutation.mutate()}
            >
              {saveMutation.isPending
                ? "Saving…"
                : checkedIn
                  ? "Update check-in"
                  : "Check in · join chat"}
            </button>
            {checkedIn && mine && (
              <button
                type="button"
                className="rb-checkin__withdraw"
                disabled={withdrawMutation.isPending}
                onClick={uncheckIn}
              >
                {withdrawMutation.isPending ? "Unchecking…" : "Uncheck in"}
              </button>
            )}
          </div>
          <p className="rb-checkin__fine">
            Check-ins and the group chat clear at midnight. Be kind, keep exact meetup details to DMs.
          </p>
        </section>

        <RiverBratsGroupChat
          beachId={beachId}
          date={today}
          beachShortLabel={beachShortLabel}
          accent={accent}
          locked={!checkedIn}
          checkedIn={checkedIn}
          goingCount={goingCount}
          headerAvatars={headerAvatars}
        />
      </div>

      <div className="rb-checkin__going-row">
        {checkedIn && user && mine ? (
          <div className="rb-checkin__self">
            <UserAvatar
              photoUrl={visibility === "anonymous" ? null : user.photoUrl}
              avatarChoice={user.avatarChoice}
              avatarRing={user.avatarRing}
              displayName={user.displayName}
              username={user.username}
              size={40}
            />
            <div className="rb-checkin__self-copy">
              <div className="rb-checkin__self-name">{selfLabel}</div>
              <div className="rb-checkin__self-meta">
                Going · {formatRiverBratsHour(mine.arrival_hour)} · in the chat
              </div>
              <button
                type="button"
                className="rb-checkin__uncheck"
                disabled={withdrawMutation.isPending}
                onClick={uncheckIn}
              >
                {withdrawMutation.isPending ? "Unchecking…" : "Uncheck in · leave chat"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rb-checkin__self-placeholder">You haven't checked in yet — pick a time to join.</div>
        )}

        <div className="rb-checkin__going-stack">
          {headerAvatars.map((row, index) => (
            <span
              key={row.key}
              className="rb-checkin__going-avatar"
              style={{ marginLeft: index === 0 ? 0 : -8 }}
            >
              <UserAvatar
                username={row.masked ? "anonymous" : row.username}
                displayName={row.masked ? undefined : row.displayName}
                photoUrl={row.masked ? null : row.photoUrl}
                avatarChoice={row.masked ? undefined : row.avatarChoice}
                size={30}
              />
            </span>
          ))}
          <span className="rb-checkin__going-count">{goingCount} going</span>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}