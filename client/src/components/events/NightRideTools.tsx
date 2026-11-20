import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { askAfterzConsent } from "../afterz/NightConsent";
import { useAfterzNights, type AfterzCard } from "../afterz/NightDrawer";
import "./night-rides.css";

export type RideDescriptor = {
  kind: "home" | "afterz" | "carpool";
  meeting: string;
  leaveBy: number | null;
  oneWay: boolean;
  departed: boolean;
};
type RideFields = {
  kind: RideDescriptor["kind"];
  meeting: string;
  leaveBy: number | null;
  oneWay: boolean;
  gathering?: string;
};
const fmt = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const position = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(Error("Location is unavailable on this device."));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
export function VenueCheck({
  base,
  eventId,
  checked,
  refresh,
}: {
  base: string;
  eventId: number;
  checked: boolean;
  refresh: () => void;
}) {
  const [area, setArea] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    setError("");
    try {
      const { coords } = await position();
      await apiRequest("POST", base + "/presence", {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        area,
      });
      refresh();
      askAfterzConsent(eventId, "checkin");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h3>At the venue</h3>
      {checked ? (
        <>
          <p>Checked in for ride matching.</p>
          <button
            onClick={async () => {
              try {
                await apiRequest("DELETE", base + "/presence");
                refresh();
              } catch {
                setError("Could not stop matching. Try again.");
              }
            }}
          >
            Stop ride matching
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void check();
          }}
        >
          <label>
            Home neighborhood
            <input
              value={area}
              maxLength={80}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Kerns"
            />
          </label>
          <p>
            Your GPS confirms you are at the venue. Neighborhood matching lasts
            30 minutes. Your coordinates are discarded.
          </p>
          <button disabled={busy}>
            {busy ? "Checking location…" : "Check in with GPS"}
          </button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function RideOfferForm({
  eventId,
  busy,
  checked,
  send,
}: {
  eventId: number;
  busy: boolean;
  checked: boolean;
  send: (body: RideFields & { area: string; seats: number }) => void;
}) {
  const [kind, setKind] = useState<RideFields["kind"]>("carpool"),
    [oneWay, setOneWay] = useState(false),
    rooms = useAfterzNights();
  const joined = (rooms.data ?? []).filter(
    (r: AfterzCard & { eventId?: number }) =>
      r.eventId === eventId && ["host", "accepted"].includes(r.role),
  );
  return (
    <form
      className="night-ride-offer"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget),
          time = String(data.get("leaveBy") ?? "");
        send({
          kind,
          oneWay: kind === "carpool" && oneWay,
          gathering:
            kind === "afterz" ? String(data.get("gathering")) : undefined,
          area: String(data.get("area")),
          meeting: String(data.get("meeting") ?? ""),
          leaveBy: time ? new Date(time).getTime() : null,
          seats: Number(data.get("seats")),
        });
      }}
    >
      <label>
        Ride type
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as RideFields["kind"])}
        >
          <option value="carpool">Carpool to the event</option>
          <option value="home" disabled={!checked}>
            Offer ride home
          </option>
          <option value="afterz" disabled={!checked || !joined.length}>
            Ride to Afterz
          </option>
        </select>
      </label>
      {kind === "afterz" && (
        <label>
          Afterz
          <select name="gathering" required>
            {joined.map((r) => (
              <option value={r.id} key={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        {kind === "carpool"
          ? "Departure neighborhood"
          : "Destination neighborhood"}
        <input name="area" minLength={2} maxLength={80} required />
      </label>
      <label>
        Meet in view of others
        <input
          name="meeting"
          required={kind !== "afterz"}
          maxLength={100}
          placeholder="e.g. the staffed entrance"
        />
      </label>
      {kind === "carpool" && (
        <label>
          <input
            type="checkbox"
            checked={oneWay}
            onChange={(e) => setOneWay(e.target.checked)}
          />
          One-way trip
        </label>
      )}
      <label>
        Leave by (your local time)
        <input
          type="datetime-local"
          name="leaveBy"
          required={kind !== "carpool" || !oneWay}
        />
      </label>
      <label>
        Passenger seats
        <input
          name="seats"
          type="number"
          min={2}
          max={8}
          defaultValue={2}
          required
        />
      </label>
      <button disabled={busy}>
        Offer{" "}
        {kind === "home"
          ? "ride home"
          : kind === "afterz"
            ? "Afterz ride"
            : "a carpool"}
      </button>
    </form>
  );
}
export function RideHologram({
  plan,
  remaining,
  faces,
}: {
  plan: RideDescriptor;
  remaining: number;
  faces: { username: string; photoUrl: string | null }[];
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="ride-holo"
      aria-label={remaining + " passenger seats available"}
    >
      <span className="ride-seat">{remaining}</span>
      <div aria-hidden="true" className="ride-car">
        <i />
        <b />
        <em />
        <em />
      </div>
      {!!faces.length && (
        <div className="ride-faces">
          {faces.map((p) => (
            <span title={p.username} key={p.username}>
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.username} />
              ) : (
                p.username.slice(0, 1).toUpperCase()
              )}
            </span>
          ))}
        </div>
      )}
      <small>
        {plan.departed
          ? "Departed"
          : plan.leaveBy
            ? plan.leaveBy > now
              ? "Leaves in " + Math.ceil((plan.leaveBy - now) / 60000) + " min"
              : "Leave-by passed"
            : "One way"}
      </small>
    </div>
  );
}
const prompts = [
  "What song should finish the night?",
  "Which local show surprised you?",
  "What is your favorite all-ages venue?",
  "What made you pick this event?",
  "Who would you book for a dream lineup?",
  "What is your perfect late-night snack?",
  "What neighborhood would you explore next?",
  "Which part of tonight would you replay?",
  "What song always fills a dance floor?",
  "What is your go-to road trip album?",
  "Where do you take an out-of-town friend?",
  "Which park has the best views?",
  "What is something you learned recently?",
  "What would you name tonight’s playlist?",
  "What makes a place welcoming?",
  "Who is a local artist more people should know?",
  "What is the best themed party you’ve seen?",
  "Which small venue deserves a shout-out?",
  "Which event would you go to again tomorrow?",
  "What’s your favorite post-show ritual?",
  "What is your most memorable outfit?",
  "What upcoming event are you excited about?",
];
function shuffled() {
  const cards = [...prompts];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.slice(0, 15);
}
let chime: AudioContext | undefined;
function unlock() {
  try {
    chime ??= new AudioContext();
    void chime.resume().catch(() => {});
  } catch {
    /* Device may only support visual alerts. */
  }
}
export function RideSafety({ base, ride }: { base: string; ride: number }) {
  const [cards] = useState(shuffled),
    [card, setCard] = useState(0),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [due, setDue] = useState(0),
    cache = useQueryClient();
  return (
    <section className="ride-safety">
      <details>
        <summary>Conversation cards · 15</summary>
        <p>{cards[card]}</p>
        <button type="button" onClick={() => setCard((card + 1) % 15)}>
          Next · {card + 1}/15
        </button>
      </details>
      <details>
        <summary>Set a safety check-in</summary>
        <p>
          Meet together in view of others. Wait inside with company. Ride with
          the driver and at least two passengers.
        </p>
        <p>
          For a device-level check, arm Check In in Apple Messages or Safety
          Check in Google Personal Safety.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            unlock();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              const pos = f.has("position") ? await position() : undefined;
              const data = await apiRequest(
                "POST",
                base + "/rides/" + ride + "/watch",
                {
                  contact: f.get("contact"),
                  minutes: Number(f.get("minutes")),
                  lat: pos?.coords.latitude,
                  lng: pos?.coords.longitude,
                  consent: true,
                },
              ).then((r) => r.json());
              setDue(data.dueAt);
              void cache.invalidateQueries({
                queryKey: ["/api/night/ride-checks"],
              });
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Trusted contacts · up to three mutual followers
            <input
              name="contact"
              required
              placeholder="@friend, @anotherfriend"
            />
          </label>
          <label>
            Check in after (minutes)
            <input
              type="number"
              min={5}
              max={180}
              defaultValue={30}
              required
              name="minutes"
            />
          </label>
          <label>
            <input type="checkbox" name="position" />
            Keep my last location updated while Zaylist is open and include it
            in the alert
          </label>
          <label>
            <input type="checkbox" required />
            If I miss three prompts, send my selected contacts an inbox alert.
          </label>
          <button disabled={busy}>Arm safety check</button>
        </form>
        {due > 0 && <p role="status">Check-in set for {fmt(due)}.</p>}
        {error && <p role="alert">{error}</p>}
        <a href="tel:911">Call 911</a>
      </details>
    </section>
  );
}
export function RideCheckReminder() {
  const { user } = useAuth(),
    cache = useQueryClient(),
    [error, setError] = useState("");
  const watches = useQuery<
    { ride: number; dueAt: number; stage: number; shareLocation: number }[]
  >({
    queryKey: ["/api/night/ride-checks", user?.id],
    queryFn: () =>
      apiRequest("GET", "/api/night/ride-checks").then((r) => r.json()),
    enabled: !!user,
    refetchInterval: 20000,
    refetchIntervalInBackground: true,
  });
  const w = user ? watches.data?.[0] : undefined;
  useEffect(() => {
    if (!w?.shareLocation || !navigator.geolocation) return;
    let last = 0;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (Date.now() - last < 60_000) return;
        last = Date.now();
        void apiRequest(
          "PUT",
          "/api/night/ride-checks/" + w.ride + "/location",
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
        ).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [w?.ride, w?.shareLocation]);
  useEffect(() => {
    if (!w || w.dueAt > Date.now()) return;
    const ring = () => {
      navigator.vibrate?.([300, 150, 300, 150, 600]);
      if (chime?.state === "running") {
        const o = chime.createOscillator(),
          g = chime.createGain();
        o.connect(g);
        g.connect(chime.destination);
        o.frequency.value = 850;
        g.gain.setValueAtTime(0.18, chime.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, chime.currentTime + 1);
        o.start();
        o.stop(chime.currentTime + 1);
      }
    };
    ring();
    const id = setInterval(ring, 12000);
    return () => clearInterval(id);
  }, [w?.ride, w?.dueAt, w?.stage]);
  if (!w) return null;
  return (
    <aside className="ride-check-banner" aria-live="polite">
      <strong>
        {w.dueAt <= Date.now()
          ? "Ride safety check due"
          : "Ride check at " + fmt(w.dueAt)}
      </strong>
      <button
        onClick={async () => {
          try {
            await apiRequest("DELETE", "/api/night/ride-checks/" + w.ride);
            await cache.invalidateQueries({
              queryKey: ["/api/night/ride-checks"],
            });
            setError("");
          } catch {
            setError("Could not confirm arrival.");
          }
        }}
      >
        I’m safe · finish check
      </button>
      <a href="tel:911">Call 911</a>
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}
export function AtEventDialog({
  poster,
  title,
  onClose,
  children,
}: {
  poster: string | null;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="at-event-dialog"
      aria-label={"At " + title}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") e.stopPropagation();
      }}
    >
      <div
        className="at-event-poster"
        style={
          poster
            ? {
                backgroundImage:
                  "linear-gradient(#0b0a0b99,#0b0a0bf8),url(" +
                  JSON.stringify(poster) +
                  ")",
              }
            : undefined
        }
      />
      <div className="at-event-content">
        <header>
          <small>At the event</small>
          <h2>{title}</h2>
          <button autoFocus onClick={onClose}>
            Back to event
          </button>
        </header>
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
