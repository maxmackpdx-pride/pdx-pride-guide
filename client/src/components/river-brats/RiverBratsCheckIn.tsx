import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import {
  RIVER_BRATS_HOUR_END,
  RIVER_BRATS_HOUR_START,
  formatRiverBratsHour,
  pacificCurrentHour,
  pacificTodayDate,
} from "@shared/riverBrats";
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
  presence?: "PLANNED" | "HERE";
  gpsVerifiedAt?: string | null;
};

type Props = {
  beachId: NudeBeachTab;
  accent: "orange" | "green";
  /** From ?verify=1 deep link (arrival push) — auto-run the GPS confirm once. */
  autoVerify?: boolean;
  /** From ?chat=1 deep link (Inbox GROUP row) — scroll the chat into view. */
  autoOpenChat?: boolean;
};

export default function RiverBratsCheckIn({ beachId, accent, autoVerify, autoOpenChat }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<CheckinVisibility>("visible");
  const [verifying, setVerifying] = useState(false);
  const autoVerifyRan = useRef(false);
  const autoChatRan = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
    mutationFn: (override?: { arrivalHour?: number }) =>
      fetch("/api/river-brats/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          beachId,
          arrivalHour: override?.arrivalHour ?? hour,
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
      toast({ title: "Checked in", description: "Beach chat is open until 10pm." });
    },
    onError: (err: Error) =>
      toast({ title: "Could not check in", description: err.message, variant: "destructive" }),
  });

  // "I am here" — grab the device location once, confirm presence server-side.
  // Coordinates go straight to the verify endpoint and are never stored.
  const runGpsVerify = () => {
    if (!navigator.geolocation) {
      toast({ title: "No location on this device", description: "You're still listed with your arrival time." });
      return;
    }
    setVerifying(true);
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const r = await fetch("/api/river-brats/checkins/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              beachId,
              date: today,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });
          const data = await r.json().catch(() => ({}));
          if (r.ok && data.ok) {
            queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
            toast({ title: "You're here", description: "Verified on the beach — say hi in chat." });
          } else if (data.error === "TOO_FAR") {
            toast({
              title: "Not quite there yet",
              description: `You look about ${data.distanceM >= 1000 ? `${(data.distanceM / 1000).toFixed(1)}km` : `${data.distanceM}m`} from the beach. Try again when you arrive.`,
              variant: "destructive",
            });
          } else {
            toast({ title: "Couldn't verify", description: data.error || "Try again in a minute.", variant: "destructive" });
          }
        } finally {
          setVerifying(false);
        }
      },
      () => {
        setVerifying(false);
        toast({ title: "Couldn't get your location", description: "No worries — you're still listed as planned." });
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  const imHere = async () => {
    if (!requireAuth()) return;
    if (!mine) {
      const nowHour = Math.min(RIVER_BRATS_HOUR_END, Math.max(RIVER_BRATS_HOUR_START, pacificCurrentHour()));
      try {
        await saveMutation.mutateAsync({ arrivalHour: nowHour });
      } catch {
        return;
      }
    }
    runGpsVerify();
  };

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

  const iAmHere = mine?.presence === "HERE";
  const arrivalDue = !!mine && !iAmHere && pacificCurrentHour() >= mine.arrival_hour;

  // ?verify=1 deep link (arrival push): run the GPS confirm once the viewer's
  // check-in is known.
  useEffect(() => {
    if (!autoVerify || autoVerifyRan.current || isLoading || !user) return;
    autoVerifyRan.current = true;
    if (mine && !iAmHere) runGpsVerify();
  }, [autoVerify, isLoading, user, mine?.id, iAmHere]);

  // ?chat=1 deep link (Inbox GROUP row): bring the inline chat into view once.
  useEffect(() => {
    if (!autoOpenChat || autoChatRan.current || isLoading) return;
    autoChatRan.current = true;
    rootRef.current?.querySelector(".rb-group-chat")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [autoOpenChat, isLoading]);

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
    <div className={`rb-checkin rb-checkin--${accent}`} ref={rootRef}>
      <div className="rb-checkin__pulse">
        <span className="rb-checkin__pulse-dot" aria-hidden />
        <span>
          <strong>{isLoading ? "…" : goingCount}</strong> heading out today · pick when you'll get there
        </span>
      </div>

      {arrivalDue && (
        <div className={`rb-arrival-banner rb-arrival-banner--${accent}`} role="status">
          <span className="rb-arrival-banner__copy">
            You planned {formatRiverBratsHour(mine!.arrival_hour)} — are you at {beachShortLabel}?
          </span>
          <button
            type="button"
            className="rb-checkin__primary"
            disabled={verifying}
            onClick={imHere}
          >
            {verifying ? "Checking…" : "I'm here"}
          </button>
        </div>
      )}

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
              onClick={() => requireAuth() && saveMutation.mutate(undefined)}
            >
              {saveMutation.isPending
                ? "Saving…"
                : checkedIn
                  ? "Update check-in"
                  : "Check in · join chat"}
            </button>
            {!iAmHere && (
              <button
                type="button"
                className="rb-checkin__withdraw"
                disabled={verifying || saveMutation.isPending}
                onClick={imHere}
                title="GPS-confirm you're on the beach"
              >
                {verifying ? "Checking…" : checkedIn ? "I'm here" : "I'm here now"}
              </button>
            )}
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
            Check-ins and the group chat clear at 10pm. Be kind, keep exact meetup details to DMs.
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
                {iAmHere ? (
                  <>
                    <span
                      className="rb-chip rb-chip--here"
                      title={mine.gpsVerifiedAt ? `Verified ${new Date(mine.gpsVerifiedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : undefined}
                    >
                      Here
                    </span>{" "}
                    · on the beach · in the chat
                  </>
                ) : (
                  <>Going · {formatRiverBratsHour(mine.arrival_hour)} · in the chat</>
                )}
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