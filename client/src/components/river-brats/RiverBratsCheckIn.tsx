import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NudeBeachTab } from "@shared/nudeBeaches";
import {
  RIVER_BRATS_HOUR_END,
  RIVER_BRATS_HOUR_START,
  beachVenueLabel,
  formatRiverBratsHour,
  pacificCurrentHour,
  pacificTodayDate,
} from "@shared/riverBrats";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/AuthModal";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ds";
import RiverBratsHourChips from "./RiverBratsHourChips";
import RiverBratsReportButton from "./RiverBratsReportButton";
import RiverBratsChatPanel from "./RiverBratsChatPanel";

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
  accent: "cyan" | "orange" | "green";
  /** From ?verify=1 deep link (arrival push) — auto-run the GPS confirm once. */
  autoVerify?: boolean;
  /** From ?chat=1 deep link — auto-open the beach chat once checked in. */
  autoOpenChat?: boolean;
};

function buttonAccentProps(accent: Props["accent"]) {
  if (accent === "green") {
    return {
      accent: "cyan" as const,
      style: { "--_c": "var(--neon-green)", "--_sh": "rgba(0,238,68,0.32)", "--_shx": "rgba(0,238,68,0.46)" },
    };
  }
  if (accent === "orange") return { accent: "orange" as const, style: undefined };
  return { accent: "cyan" as const, style: undefined };
}

export default function RiverBratsCheckIn({ beachId, accent, autoVerify, autoOpenChat }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<CheckinVisibility>("visible");
  const [showChat, setShowChat] = useState(false);
  const [messageTarget, setMessageTarget] = useState<CheckinRow | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [verifying, setVerifying] = useState(false);
  const autoVerifyRan = useRef(false);
  const autoChatRan = useRef(false);
  const today = pacificTodayDate();
  const beachLabel = beachVenueLabel(beachId);
  const btnAccent = buttonAccentProps(accent);

  const queryKey = ["/api/river-brats/checkins", beachId, today] as const;

  const { data: rows = [], isLoading } = useQuery<CheckinRow[]>({
    queryKey,
    queryFn: () => fetch(`/api/river-brats/checkins?beach=${beachId}&date=${today}`, { credentials: "include" }).then(r => r.json()),
  });

  const mine = user ? rows.find(r => (r.userId ?? r.user_id) === user.id) : undefined;

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
      setShowChat(true);
      toast({ title: "Checked in", description: "Beach chat is open until 10pm." });
    },
    onError: (err: Error) => toast({ title: "Could not check in", description: err.message, variant: "destructive" }),
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
            setShowChat(true);
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
        toast({
          title: "Couldn't get your location",
          description: "No worries — you're still listed as planned.",
        });
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  };

  const imHere = async () => {
    if (!requireAuth()) return;
    if (!mine) {
      // Not checked in yet: check in for right now, then verify.
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
        if (!r.ok) throw new Error("Could not withdraw check-in");
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
      setShowChat(false);
      setHour(null);
      setNote("");
      setVisibility("visible");
      toast({ title: "Check-in withdrawn" });
    },
    onError: (err: Error) => toast({ title: "Could not withdraw", description: err.message, variant: "destructive" }),
  });

  const messageMutation = useMutation({
    mutationFn: ({ checkinId, body }: { checkinId: number; body: string }) =>
      fetch(`/api/river-brats/checkins/${checkinId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ beachId, date: today, body }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not send message");
        return data;
      }),
    onSuccess: () => {
      setMessageTarget(null);
      setMessageBody("");
      toast({ title: "Message sent", description: "Find the thread in your inbox." });
    },
    onError: (err: Error) => toast({ title: "Could not send", description: err.message, variant: "destructive" }),
  });

  const requireAuth = () => {
    if (user) return true;
    setShowAuth(true);
    return false;
  };

  const iAmHere = mine?.presence === "HERE";
  const arrivalDue =
    !!mine && !iAmHere && pacificCurrentHour() >= mine.arrival_hour;

  // ?verify=1 deep link (arrival push): run the GPS confirm once when the
  // viewer's check-in is known.
  useEffect(() => {
    if (!autoVerify || autoVerifyRan.current || isLoading || !user) return;
    autoVerifyRan.current = true;
    if (mine && !iAmHere) runGpsVerify();
  }, [autoVerify, isLoading, user, mine?.id, iAmHere]);

  // ?chat=1 deep link (Inbox GROUP row): open the beach chat once.
  useEffect(() => {
    if (!autoOpenChat || autoChatRan.current || isLoading) return;
    if (mine) {
      autoChatRan.current = true;
      setShowChat(true);
    }
  }, [autoOpenChat, isLoading, mine?.id]);

  return (
    <div className="rb-panel">
      <p className="rb-panel__lede">
        <strong>{rows.length}</strong> heading out today · pick when you expect to arrive (7am–9pm).
      </p>

      {arrivalDue && (
        <div className={`rb-arrival-banner rb-arrival-banner--${accent}`} role="status">
          <span className="rb-arrival-banner__copy">
            You planned {formatRiverBratsHour(mine!.arrival_hour)} — are you at {beachLabel}?
          </span>
          <Button
            variant="solid"
            accent={btnAccent.accent}
            style={btnAccent.style}
            size="sm"
            disabled={verifying}
            onClick={imHere}
          >
            {verifying ? "Checking…" : "I'm here"}
          </Button>
        </div>
      )}

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
        <fieldset className="rb-visibility">
          <legend className="rb-visibility__legend">Show as</legend>
          <div className="rb-visibility__options">
            <label className={`rb-visibility__option${visibility === "visible" ? " rb-visibility__option--active" : ""}`}>
              <input
                type="radio"
                name="rb-checkin-visibility"
                checked={visibility === "visible"}
                onChange={() => setVisibility("visible")}
              />
              <span className="rb-visibility__label">@username visible</span>
              <span className="rb-visibility__hint">Others can see your profile and slide into your DMs</span>
            </label>
            <label className={`rb-visibility__option${visibility === "anonymous" ? " rb-visibility__option--active" : ""}`}>
              <input
                type="radio"
                name="rb-checkin-visibility"
                checked={visibility === "anonymous"}
                onChange={() => setVisibility("anonymous")}
              />
              <span className="rb-visibility__label">Stay anonymous</span>
              <span className="rb-visibility__hint">Arrival time only — no name or photo on the list</span>
            </label>
          </div>
        </fieldset>
        <div className="rb-compose__actions">
          {mine ? (
            <>
              <Button
                variant="solid"
                accent={btnAccent.accent}
                style={btnAccent.style}
                size="sm"
                disabled={hour == null || saveMutation.isPending}
                onClick={() => requireAuth() && saveMutation.mutate(undefined)}
              >
                Update check-in
              </Button>
              {!iAmHere && (
                <Button
                  variant="outline"
                  accent="cyan"
                  size="sm"
                  disabled={verifying}
                  onClick={imHere}
                >
                  {verifying ? "Checking…" : "I'm here"}
                </Button>
              )}
              <Button
                variant="outline"
                accent="cyan"
                size="sm"
                onClick={() => setShowChat(true)}
              >
                Open beach chat
              </Button>
              <Button
                variant="outline"
                accent="cyan"
                size="sm"
                disabled={withdrawMutation.isPending}
                onClick={() => withdrawMutation.mutate(mine.id)}
              >
                {withdrawMutation.isPending ? "Withdrawing…" : "Withdraw check-in"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="solid"
                accent={btnAccent.accent}
                style={btnAccent.style}
                size="sm"
                disabled={hour == null || saveMutation.isPending}
                onClick={() => requireAuth() && saveMutation.mutate(undefined)}
              >
                Check in for today
              </Button>
              <Button
                variant="outline"
                accent="cyan"
                size="sm"
                disabled={verifying || saveMutation.isPending}
                onClick={imHere}
              >
                {verifying ? "Checking…" : "I'm here now"}
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="rb-empty">Loading check-ins…</p>
      ) : rows.length === 0 ? (
        <p className="rb-empty">Nobody's checked in yet today. Be first.</p>
      ) : (
        <ul className="rb-feed">
          {rows.map(row => {
            const rowUserId = row.userId ?? row.user_id;
            const isSelf = !!user && rowUserId === user.id;
            const canMessage = !!user && !!mine && rowUserId !== user.id && !row.masked;
            return (
              <li
                key={row.id}
                className={`rb-card${canMessage ? " rb-card--clickable" : ""}`}
                onClick={() => canMessage && setMessageTarget(row)}
                onKeyDown={e => {
                  if (canMessage && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    setMessageTarget(row);
                  }
                }}
                role={canMessage ? "button" : undefined}
                tabIndex={canMessage ? 0 : undefined}
              >
                <UserAvatar
                  username={row.masked ? "anonymous" : row.username}
                  displayName={row.masked ? undefined : row.displayName}
                  photoUrl={row.masked ? null : row.photoUrl}
                  avatarChoice={row.masked ? undefined : row.avatarChoice}
                  size={36}
                />
                <div className="rb-card__body">
                  <div className="rb-card__title">
                    {row.masked ? "Anonymous" : row.displayName || `@${row.username}`}
                  </div>
                  <div className="rb-card__meta">
                    {row.presence === "HERE" ? (
                      <span
                        className="rb-chip rb-chip--here"
                        title={row.gpsVerifiedAt ? `Verified ${new Date(row.gpsVerifiedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : undefined}
                      >
                        Here
                      </span>
                    ) : (
                      <span className={`rb-chip rb-chip--${accent}`}>{formatRiverBratsHour(row.arrival_hour)}</span>
                    )}
                    {row.note ? <span className="rb-card__note">{row.note}</span> : null}
                    {canMessage ? <span className="rb-card__dm-hint">Tap to message →</span> : null}
                  </div>
                </div>
                {isSelf ? (
                  <span className="rb-card__you-pill">You</span>
                ) : rowUserId !== user?.id ? (
                  <RiverBratsReportButton targetType="CHECKIN" targetId={row.id} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {showChat && mine && (
        <RiverBratsChatPanel
          beachId={beachId}
          date={today}
          beachLabel={beachLabel}
          onClose={() => setShowChat(false)}
        />
      )}

      {messageTarget && (
        <div className="rb-dm-backdrop" onClick={() => setMessageTarget(null)}>
          <div
            className="rb-dm-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Message ${messageTarget.displayName || messageTarget.username}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="rb-dm-panel__head">
              <UserAvatar
                username={messageTarget.username}
                displayName={messageTarget.displayName}
                photoUrl={messageTarget.photoUrl}
                avatarChoice={messageTarget.avatarChoice}
                size={42}
              />
              <div className="rb-dm-panel__who">
                <Link
                  href={`/members/${messageTarget.username}`}
                  className="display rb-dm-panel__name rb-dm-panel__profile-link"
                >
                  {messageTarget.displayName || messageTarget.username}
                </Link>
                <div className="rb-dm-panel__context">Both checked in · {beachLabel}</div>
              </div>
              <button type="button" className="rb-dm-panel__close" onClick={() => setMessageTarget(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="rb-dm-panel__body">
              <p className="rb-dm-panel__seed">
                Heading out around {formatRiverBratsHour(messageTarget.arrival_hour)}
                {messageTarget.note ? ` · "${messageTarget.note}"` : ""}. Say hi?
              </p>
            </div>
            <div className="rb-dm-panel__composer">
              <input
                value={messageBody}
                onChange={e => setMessageBody(e.target.value)}
                placeholder="Slide into their DMs…"
                maxLength={500}
              />
              <Button
                variant="solid"
                accent="lime"
                size="sm"
                disabled={!messageBody.trim() || messageMutation.isPending}
                onClick={() => messageMutation.mutate({ checkinId: messageTarget.id, body: messageBody.trim() })}
              >
                Send
              </Button>
            </div>
            <p className="rb-dm-panel__inbox">
              Replies land in <Link href="/inbox">your inbox</Link>.
            </p>
          </div>
        </div>
      )}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}