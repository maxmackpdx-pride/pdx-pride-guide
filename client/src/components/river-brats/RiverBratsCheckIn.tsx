import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import type { DayForecastBrief, NudeBeachTab, NudeBeachesSnapshot } from "@shared/nudeBeaches";
import { resolveBeachPosterUrl } from "@shared/eventPoster";
import {
  RIVER_BRATS_DEPART_HOUR_END,
  RIVER_BRATS_HOUR_END,
  RIVER_BRATS_HOUR_START,
  beachCheckinDateOptions,
  isRiverBratsChatOpen,
  defaultDepartHour,
  formatBeachCheckinDateLabel,
  formatRiverBratsHour,
  formatRiverBratsWindow,
  pacificCurrentHour,
  pacificTodayDate,
} from "@shared/riverBrats";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AuthModal from "@/components/AuthModal";
import UserAvatar from "@/components/UserAvatar";
import { memberProfileHref } from "@/lib/avatarLinks";
import EventLinkChoiceMenu from "@/components/EventLinkChoiceMenu";
import {
  downloadIcsFileForBeachCheckin,
  googleCalendarUrlForBeachCheckin,
} from "@/lib/eventLinks";
import RiverBratsHourChips from "./RiverBratsHourChips";
import RiverBratsGroupChat from "./RiverBratsGroupChat";

/** Compact “people GPS-verified on site” chip — only renders when count > 0. */
function OnLocationPill({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  const label =
    count === 1 ? "1 on location" : `${count > 9 ? "9+" : count} on location`;
  return (
    <span
      className={`rb-on-site${className ? ` ${className}` : ""}`}
      title="GPS-verified at the beach right now"
      role="status"
      aria-label={label}
    >
      <MapPin size={11} strokeWidth={2.4} aria-hidden />
      <span className="rb-on-site__n">{count > 9 ? "9+" : count}</span>
      <span className="rb-on-site__lbl">on site</span>
    </span>
  );
}

type CheckinVisibility = "visible" | "anonymous";

type CheckinRow = {
  id: number;
  user_id: number;
  userId?: number;
  arrival_hour: number;
  depart_hour?: number | null;
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
  calendarDate?: string;
};

type Props = {
  beachId: NudeBeachTab;
  accent: "orange" | "green";
  /** From ?verify=1 deep link (arrival push) — auto-run the GPS confirm once. */
  autoVerify?: boolean;
  /** From ?chat=1 deep link (Inbox GROUP row) — scroll the chat into view. */
  autoOpenChat?: boolean;
  /** Jump to Carpool tab for this plan day. */
  onGoToCarpool?: (date: string) => void;
};

export default function RiverBratsCheckIn({
  beachId,
  accent,
  autoVerify,
  autoOpenChat,
  onGoToCarpool,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuth, setShowAuth] = useState(false);
  const [showCalPicker, setShowCalPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => pacificTodayDate());
  const [hour, setHour] = useState<number | null>(null);
  const [departHour, setDepartHour] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<CheckinVisibility>("visible");
  const [verifying, setVerifying] = useState(false);
  const autoVerifyRan = useRef(false);
  const autoChatRan = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = pacificTodayDate();
  const dateOptions = useMemo(() => beachCheckinDateOptions(), []);
  const isViewingToday = selectedDate === today;
  const beachShortLabel = beachId === "rooster-rock" ? "Rooster Rock" : "Collins Beach";
  const posterUrl = resolveBeachPosterUrl(beachId);

  const queryKey = ["/api/river-brats/checkins", beachId, selectedDate] as const;

  const { data: rows = [], isLoading } = useQuery<CheckinRow[]>({
    queryKey,
    queryFn: () =>
      fetch(`/api/river-brats/checkins?beach=${beachId}&date=${selectedDate}`, { credentials: "include" }).then(r =>
        r.json(),
      ),
    // Beach day: poll so the small on-location pill pops when someone verifies.
    refetchInterval: selectedDate === pacificTodayDate() ? 20_000 : false,
  });

  const { data: beachesPayload } = useQuery<{ data?: NudeBeachesSnapshot } | NudeBeachesSnapshot>({
    queryKey: ["/api/nude-beaches"],
    queryFn: () => apiRequest("GET", "/api/nude-beaches").then(r => r.json()),
    staleTime: 5 * 60_000,
  });

  const forecastDays: DayForecastBrief[] = useMemo(() => {
    const snap =
      beachesPayload && "data" in beachesPayload && beachesPayload.data
        ? beachesPayload.data
        : (beachesPayload as NudeBeachesSnapshot | undefined);
    if (!snap) return [];
    const live = beachId === "rooster-rock" ? snap.roosterRock : snap.sauvieIsland;
    return live?.forecastDays ?? [];
  }, [beachesPayload, beachId]);

  const dayForecast = useMemo(
    () => forecastDays.find(d => d.date === selectedDate) ?? null,
    [forecastDays, selectedDate],
  );

  const mine = user ? rows.find(r => (r.userId ?? r.user_id) === user.id) : undefined;
  const checkedIn = Boolean(mine);
  // Anonymous check-ins are counted in "going" but never connected to the group
  // chat — they can't read or post, since the chat is not anonymous.
  const isAnon = Boolean(mine?.isAnonymous);
  // Day-room opens 48h before the beach day and closes 10pm that day.
  const chatWindowOpen = isRiverBratsChatOpen(selectedDate);
  const inChat = checkedIn && !isAnon && chatWindowOpen;
  const goingCount = rows.length;
  /** GPS-verified “I'm here” — independent of chat window (chat is 48h calendar). */
  const onLocationCount = useMemo(
    () => rows.filter(r => r.presence === "HERE").length,
    [rows],
  );

  const departHourOptions = useMemo(() => {
    const start = (hour ?? mine?.arrival_hour ?? RIVER_BRATS_HOUR_START) + 1;
    const list: number[] = [];
    for (let h = start; h <= RIVER_BRATS_DEPART_HOUR_END; h++) list.push(h);
    return list.length ? list : [RIVER_BRATS_DEPART_HOUR_END];
  }, [hour, mine?.arrival_hour]);

  useEffect(() => {
    if (isLoading) return;
    if (mine) {
      setHour(mine.arrival_hour);
      setDepartHour(
        mine.depart_hour != null && mine.depart_hour > mine.arrival_hour
          ? mine.depart_hour
          : defaultDepartHour(mine.arrival_hour),
      );
      setNote(mine.note || "");
      setVisibility(mine.isAnonymous ? "anonymous" : "visible");
      return;
    }
    setHour(null);
    setDepartHour(null);
    setNote("");
    setVisibility("visible");
    setShowCalPicker(false);
  }, [selectedDate, isLoading, mine?.id, mine?.arrival_hour, mine?.depart_hour, mine?.note, mine?.isAnonymous]);

  // When arrival moves past leave, nudge leave forward.
  useEffect(() => {
    if (hour == null) return;
    if (departHour == null || departHour <= hour) {
      setDepartHour(defaultDepartHour(hour));
    }
  }, [hour]); // eslint-disable-line react-hooks/exhaustive-deps

  const calendarPayload = useMemo(() => {
    if (hour == null || departHour == null) return null;
    return {
      id: mine?.id,
      beachId,
      calendarDate: selectedDate,
      arrivalHour: hour,
      departHour,
      note: note.trim() || null,
    };
  }, [mine?.id, beachId, selectedDate, hour, departHour, note]);

  const saveMutation = useMutation({
    mutationFn: (override?: { arrivalHour?: number; departHour?: number }) => {
      const arrival = override?.arrivalHour ?? hour;
      const depart = override?.departHour ?? departHour;
      return fetch("/api/river-brats/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          beachId,
          arrivalHour: arrival,
          departHour: depart,
          note: note.trim() || undefined,
          date: selectedDate,
          isAnonymous: visibility === "anonymous",
        }),
      }).then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Could not check in");
        return data;
      });
    },
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins/mine"] });
      const dayLabel = formatBeachCheckinDateLabel(selectedDate);
      toast({
        title: "Checked in",
        description: chatWindowOpen
          ? "Beach chat is open until 10pm. Add it to your calendar if you want."
          : `You're on the ${dayLabel} list. Chat opens 48 hours before that day. Add it to your calendar if you want.`,
      });
      if (row?.id) {
        // Keep local calendar payload id for ICS UID stability after first save.
      }
    },
    onError: (err: Error) =>
      toast({ title: "Could not check in", description: err.message, variant: "destructive" }),
  });

  // "I am here" — grab the device location once, confirm presence server-side.
  // Coordinates go straight to the verify endpoint and are never stored.
  const runGpsVerify = () => {
    if (!isViewingToday) {
      toast({ title: "Not today yet", description: "You can confirm you're here on the day of your check-in." });
      return;
    }
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
              date: selectedDate,
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
    if (!isViewingToday) {
      toast({ title: "Not today yet", description: "Switch to Today to confirm you're at the beach." });
      return;
    }
    if (!mine) {
      const nowHour = Math.min(RIVER_BRATS_HOUR_END, Math.max(RIVER_BRATS_HOUR_START, pacificCurrentHour()));
      const leave = defaultDepartHour(nowHour);
      try {
        await saveMutation.mutateAsync({ arrivalHour: nowHour, departHour: leave });
        setHour(nowHour);
        setDepartHour(leave);
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
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/river-brats/checkins/chat"] });
      setHour(null);
      setDepartHour(null);
      setNote("");
      setVisibility("visible");
      setShowCalPicker(false);
      toast({ title: "Unchecked in", description: "You're off that beach list and out of the group chat." });
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
  const arrivalDue = !!mine && !iAmHere && isViewingToday && pacificCurrentHour() >= mine.arrival_hour;

  // ?verify=1 deep link (arrival push): run the GPS confirm once the viewer's
  // check-in is known.
  useEffect(() => {
    if (!autoVerify || autoVerifyRan.current || isLoading || !user) return;
    autoVerifyRan.current = true;
    if (mine && !iAmHere && isViewingToday) runGpsVerify();
  }, [autoVerify, isLoading, user, mine?.id, iAmHere, isViewingToday]);

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

  const dayLabel = formatBeachCheckinDateLabel(selectedDate);
  const canSave = hour != null && departHour != null && departHour > hour && !saveMutation.isPending;

  const openCalendarForPlan = (payload = calendarPayload) => {
    if (!payload) return;
    setShowCalPicker(true);
  };

  return (
    <div className={`rb-checkin rb-checkin--${accent}`} ref={rootRef}>
      <div className="rb-checkin__hero-card">
        <img
          src={posterUrl}
          alt=""
          className="rb-checkin__poster"
          width={160}
          height={200}
          decoding="async"
        />
        <div className="rb-checkin__hero-copy">
          <div className="rb-checkin__poster-kicker">Beach day flyer</div>
          <div className="rb-checkin__poster-title">{beachShortLabel}</div>
          <p className="rb-checkin__poster-lede">
            Plan up to 7 days out, say how long you&apos;ll stay, and drop it on your calendar like an event.
          </p>
        </div>
      </div>

      <div className="rb-checkin__pulse">
        <span className="rb-checkin__pulse-dot" aria-hidden />
        <span className="rb-checkin__pulse-copy">
          <strong>{isLoading ? "…" : goingCount}</strong>{" "}
          {isViewingToday ? "heading out today" : `planned for ${dayLabel}`}
          {isViewingToday ? " · pick when you&apos;ll get there" : " · chat opens 48h before that day"}
        </span>
        {isViewingToday && <OnLocationPill count={onLocationCount} />}
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
          <div className="rb-checkin__field-label">Day</div>
          <div className="rb-date-chips" role="group" aria-label="Check-in day">
            {dateOptions.map(d => (
              <button
                key={d}
                type="button"
                className={`rb-date-chip${selectedDate === d ? " active" : ""}`}
                onClick={() => {
                  setSelectedDate(d);
                  setShowCalPicker(false);
                  if (!mine || mine.calendarDate !== d) {
                    // Don't wipe form when switching days unless clearing a foreign day plan.
                    if (!user) {
                      setHour(null);
                      setDepartHour(null);
                    }
                  }
                }}
              >
                {formatBeachCheckinDateLabel(d)}
              </button>
            ))}
          </div>

          <div className="rb-checkin__field-label">I&apos;ll be there around</div>
          <RiverBratsHourChips value={hour ?? mine?.arrival_hour ?? null} onChange={setHour} accent={accent} />

          <div className="rb-checkin__field-label">Staying until about</div>
          <RiverBratsHourChips
            value={departHour}
            onChange={setDepartHour}
            accent={accent}
            hours={departHourOptions}
            aria-label="Leave time"
          />

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
                Counted in &quot;going&quot; · no name or photo, stays off the group chat
              </span>
            </button>
          </div>

          <div className="rb-checkin__actions">
            <button
              type="button"
              className={`rb-checkin__primary${checkedIn ? " rb-checkin__primary--update" : ""}`}
              disabled={!canSave}
              onClick={() => requireAuth() && saveMutation.mutate(undefined)}
            >
              {saveMutation.isPending
                ? "Saving…"
                : checkedIn
                  ? "Update check-in"
                  : visibility === "anonymous"
                    ? "Check in"
                    : isViewingToday
                      ? "Check in · join chat"
                      : "Check in · plan ahead"}
            </button>
            {checkedIn && calendarPayload && (
              <div className="event-link-choice-anchor rb-checkin__cal-wrap">
                <button
                  type="button"
                  className="rb-checkin__withdraw"
                  data-testid="button-beach-add-to-calendar"
                  onClick={() => openCalendarForPlan()}
                >
                  Add to calendar
                </button>
                <EventLinkChoiceMenu
                  floating
                  open={showCalPicker}
                  onClose={() => setShowCalPicker(false)}
                  title="Add beach day to calendar"
                  options={[
                    {
                      label: "Google Calendar",
                      hint: "Opens in browser",
                      onClick: () =>
                        window.open(googleCalendarUrlForBeachCheckin(calendarPayload), "_blank", "noopener,noreferrer"),
                    },
                    {
                      label: "Apple Calendar / iCal",
                      hint: "Downloads .ics file",
                      onClick: () => downloadIcsFileForBeachCheckin(calendarPayload),
                    },
                  ]}
                />
              </div>
            )}
            {isViewingToday && !iAmHere && (
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
            Plan up to 7 days ahead. Chat opens 48 hours before that day and clears at 10pm. Be kind, keep exact meetup details to DMs.
          </p>

          {checkedIn && !isViewingToday && (
            <div className="rb-checkin__plan-next" data-testid="beach-plan-carpool-prompt">
              <div className="rb-checkin__plan-next-kicker">{dayLabel} forecast</div>
              {dayForecast ? (
                <p className="rb-checkin__plan-next-weather">
                  {dayForecast.highF != null ? (
                    <strong>{dayForecast.highF}°F</strong>
                  ) : null}
                  {dayForecast.highF != null && dayForecast.shortForecast ? " · " : null}
                  {dayForecast.shortForecast || "Forecast loading…"}
                  {dayForecast.wind ? ` · Wind ${dayForecast.wind}` : null}
                </p>
              ) : (
                <p className="rb-checkin__plan-next-weather">
                  Day forecast not loaded yet. Check the conditions panel above, or refresh in a moment.
                </p>
              )}
              <p className="rb-checkin__plan-next-ask">Interested in carpooling that day?</p>
              <button
                type="button"
                className="rb-checkin__plan-next-btn"
                onClick={() => onGoToCarpool?.(selectedDate)}
              >
                Open carpool for {dayLabel}
              </button>
            </div>
          )}
        </section>

        <RiverBratsGroupChat
          beachId={beachId}
          date={selectedDate}
          beachShortLabel={beachShortLabel}
          accent={accent}
          locked={!inChat}
          checkedIn={inChat}
          anonymous={isAnon}
          goingCount={goingCount}
          onLocationCount={onLocationCount}
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
                    · on the beach {isAnon ? "· off the chat (anonymous)" : "· in the chat"}
                  </>
                ) : (
                  <>
                    {dayLabel} · {formatRiverBratsWindow(mine.arrival_hour, mine.depart_hour)}{" "}
                    {isAnon
                      ? "· off the chat (anonymous)"
                      : chatWindowOpen
                        ? "· in the chat"
                        : "· chat opens 48h before that day"}
                  </>
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
          <div className="rb-checkin__self-placeholder">
            You haven&apos;t checked in for {dayLabel.toLowerCase()} yet — pick a time and how long you&apos;ll stay.
          </div>
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
                href={row.masked ? null : memberProfileHref(row.username)}
                size={30}
              />
            </span>
          ))}
          <span className="rb-checkin__going-count">{goingCount} going</span>
          <OnLocationPill count={onLocationCount} className="rb-on-site--stack" />
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
