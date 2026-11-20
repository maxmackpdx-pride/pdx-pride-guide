import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { outzPlaceHref, type OutzPlace } from "@shared/outz";
import type { OutzForecastDay } from "@shared/outzDetails";
import AuthModal from "@/components/AuthModal";
import "./buddy-hosting.css";

type Outing = {
  id: number;
  title: string;
  venueName: string;
  dateStart: string;
  poster: string | null;
  place: string;
};
const events = "/api/outz/buddies";
function read<T>(url: string) {
  return apiRequest("GET", url).then((r) => r.json() as Promise<T>);
}
export function UpcomingBuddies({ place }: { place?: string }) {
  const url = events + (place ? "?place=" + encodeURIComponent(place) : "");
  const list = useQuery<Outing[]>({
    queryKey: [events, place ?? null],
    queryFn: () => read(url),
  });
  if (list.isPending) return <p role="status">Loading outings…</p>;
  if (list.isError)
    return (
      <button onClick={() => void list.refetch()}>
        Retry upcoming outings
      </button>
    );
  if (!list.data.length)
    return <p>No upcoming Buddies outings{place ? " here" : ""}.</p>;
  return (
    <div className="buddy-upcoming">
      {list.data.map((e) => (
        <Link href={"/events/" + e.id} key={e.id}>
          {e.poster && <img loading="lazy" src={e.poster} alt="" />}
          <span>
            <small>
              {e.dateStart.slice(0, 10)} · {e.venueName}
            </small>
            <strong>{e.title}</strong>
          </span>
        </Link>
      ))}
    </div>
  );
}
export default function BuddyHosting({
  place,
  onIntent,
}: {
  place: OutzPlace;
  onIntent: (intent: "ride" | "buddy") => void;
}) {
  const { user } = useAuth(),
    [auth, setAuth] = useState(false),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [duplicate, setDuplicate] = useState<Outing[]>([]),
    [key, setKey] = useState(() => crypto.randomUUID());
  const cache = useQueryClient(),
    operator = useQuery<{ id: number; name: string } | null>({
      queryKey: [events, "operator", place.id],
      queryFn: () => read(events + "/operator/" + encodeURIComponent(place.id)),
    });
  return (
    <section className="buddy-hosting">
      <h3>Plan your event</h3>
      <div className="buddy-actions">
        <button onClick={() => onIntent("ride")}>Carpool</button>
        <button onClick={() => onIntent("buddy")}>Buddy Finder</button>
        <button onClick={() => (user ? setEditing((v) => !v) : setAuth(true))}>
          Host an outing
        </button>
      </div>
      {operator.data && (
        <Link href={"/directory/" + operator.data.id}>
          Visit {operator.data.name} in Placez
        </Link>
      )}
      {editing && (
        <form
          onChange={() => {
            setKey(crypto.randomUUID());
            setDuplicate([]);
            setError("");
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const form = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              const response = await fetch("/api/submit", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                  "Content-Type": "application/json",
                  "Idempotency-Key": key,
                },
                body: JSON.stringify({
                  type: "NEW_EVENT",
                  outzPlaceId: place.id,
                  title: form.get("title"),
                  description: form.get("description"),
                  venueName: place.name,
                  dateStart: form.get("start"),
                  dateEnd: form.get("end"),
                  eventTypes: ["SOCIAL"],
                  ageRequirement: form.get("age"),
                  admission: form.get("admission"),
                  isPublic: true,
                  isPrivate: false,
                  isHouseParty: false,
                  overlapConfirmed: duplicate.length > 0,
                }),
              });
              const result = await response.json();
              if (!response.ok) {
                if (result.matches?.length) setDuplicate(result.matches);
                throw Error(result.error || "Could not submit outing.");
              }
              setNotice(
                result.autoApproved
                  ? "Your outing is in Events."
                  : "Your outing was submitted for event review.",
              );
              setEditing(false);
              setDuplicate([]);
              setKey(crypto.randomUUID());
              void cache.invalidateQueries({ queryKey: [events] });
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Outing name
            <input
              name="title"
              required
              minLength={3}
              maxLength={100}
              placeholder={"Group outing at " + place.name}
            />
          </label>
          <label>
            What’s the plan?
            <textarea name="description" required maxLength={2000} />
          </label>
          <label>
            Starts · Pacific
            <input name="start" type="datetime-local" required />
          </label>
          <label>
            Ends · Pacific
            <input name="end" type="datetime-local" required />
          </label>
          <label>
            Age group
            <select name="age">
              <option value="ALL_AGES">All ages</option>
              <option value="18_PLUS">18+</option>
              <option value="21_PLUS">21+</option>
            </select>
          </label>
          <label>
            Admission
            <select name="admission">
              <option value="FREE">Free</option>
              <option value="PAID">Paid</option>
              <option value="DONATION">Donation</option>
            </select>
          </label>
          {error && <p role="alert">{error}</p>}
          {duplicate.map((e) => (
            <Link key={e.id} href={"/events/" + e.id}>
              Open {e.title}
            </Link>
          ))}
          <button disabled={busy}>
            {busy
              ? "Submitting…"
              : duplicate.length
                ? "This is a separate outing · submit"
                : "Submit outing"}
          </button>
        </form>
      )}
      {notice && <p role="status">{notice}</p>}
      <UpcomingBuddies place={place.id} />
      {auth && <AuthModal onClose={() => setAuth(false)} />}
    </section>
  );
}
type Details = {
  place: string;
  host: boolean;
  requests: { id: number; username: string }[];
  state?: string;
  ended: boolean;
  forecast: OutzForecastDay | null;
  updatedAt: string | null;
};
export function BuddyEvent({ id, venue }: { id: number; venue: string }) {
  const { user } = useAuth(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const url = events + "/event/" + id,
    details = useQuery<Details | null>({
      queryKey: [url, user?.id],
      queryFn: () => read(url),
    });
  if (!details.data) return null;
  const { place, host, forecast, state, requests, ended } = details.data;
  const act = async (action: string, userId?: number) => {
    setBusy(true);
    setError("");
    try {
      await apiRequest("POST", url + "/cohost", { action, userId });
      await details.refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="buddy-hosting">
      <h3>Buddies outing</h3>
      {forecast ? (
        <p>
          <strong>{forecast.date}</strong> · {forecast.summary}
          {forecast.highF != null && " · High " + forecast.highF + "°F"}
          {forecast.lowF != null && " · Low " + forecast.lowF + "°F"}.{" "}
          {(forecast.rainChance ?? 0) >= 35 ||
          /rain|shower|snow/i.test(forecast.summary)
            ? "Bring a waterproof layer and shoes with grip."
            : (forecast.lowF ?? Infinity) < 50
              ? "Pack a warm layer for cooler hours."
              : "Bring layers for changing conditions."}
        </p>
      ) : (
        <p>The destination forecast for this day is unavailable.</p>
      )}
      {ended ? (
        <Link href={outzPlaceHref({ id: place, name: venue })}>
          Rate the destination
        </Link>
      ) : host ? (
        <>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const username = String(
                new FormData(e.currentTarget).get("username"),
              );
              setBusy(true);
              try {
                await apiRequest("POST", "/api/events/" + id + "/hosts", {
                  username,
                });
                setNotice("Co-host added.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Add a co-host
              <input required name="username" placeholder="@username" />
            </label>
            <button disabled={busy}>Add co-host</button>
          </form>
          {requests.map((r) => (
            <div key={r.id}>
              @{r.username} requested to co-host.{" "}
              <button disabled={busy} onClick={() => void act("approve", r.id)}>
                Approve
              </button>
              <button disabled={busy} onClick={() => void act("decline", r.id)}>
                Decline
              </button>
            </div>
          ))}
        </>
      ) : (
        user && (
          <button
            disabled={busy || !!state}
            onClick={() => void act("request")}
          >
            {state === "pending"
              ? "Co-host request sent"
              : state === "declined"
                ? "Co-host request declined"
                : "Request to co-host"}
          </button>
        )
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
