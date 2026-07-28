/**
 * The Forming a HAÜS workspace: the members-only room behind a forming post.
 *
 * Warm and social on purpose. A house being built, not a project plan. Four tabs
 * over one ink panel: House chat, Places, Dates, People.
 *
 * Design reference: docs/design-handoff-hausing/haus-workspace.jsx
 * Endpoints: server/housing/routes.ts, "the forming workspace" section.
 *
 * Two rules this file exists to honor:
 *  1. The house thread is the EXISTING messaging system. There is no second chat
 *     here, only a door into the floating inbox.
 *  2. Declining someone is quiet. The row goes away and nothing else happens.
 */
import { useState, type CSSProperties, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import { HousingIcon, type HousingIconName } from "@/components/housing/HousingIcon";
import { Btn, Chip, Mono, accentStyle, type ChipTone } from "@/components/housing/HousingPrimitives";
import {
  HOUSING_DATE_KINDS,
  HOUSING_DATE_KIND_LABEL,
  PLACE_STATUSES,
  PLACE_STATUS_LABEL,
  type HousingDateKind,
  type HousingPerson,
  type HousingPostView,
  type PlaceStatus,
} from "@shared/housing";

// --- what the workspace endpoint sends --------------------------------------

type WorkspacePlace = {
  id: number;
  url: string;
  title: string;
  rent?: string | null;
  neighborhood?: string | null;
  sourceDomain?: string | null;
  thumbUrl?: string | null;
  status: string;
  isTarget: boolean;
  managedPostId?: number | null;
  addedBy: string;
  reactions: number;
  comments: number;
  createdAt: string;
};

type WorkspaceDate = {
  id: number;
  kind: string;
  label: string;
  dateOn: string;
  note?: string | null;
  remindAt?: string | null;
  addedBy: string;
};

type WorkspaceRequest = {
  id: number;
  kind: string;
  note?: string | null;
  createdAt: string;
  threadId?: string | null;
  person: {
    userId: number;
    displayName: string;
    username?: string | null;
    photoUrl?: string | null;
    avatarChoice?: number;
    avatarRing?: string | null;
    pronouns?: string | null;
  };
};

type WorkspaceData = {
  isLead: boolean;
  places: WorkspacePlace[];
  dates: WorkspaceDate[];
  requests: WorkspaceRequest[];
  waitlist: number;
};

type TabKey = "chat" | "places" | "dates" | "people";

const TABS: Array<[TabKey, string, HousingIconName]> = [
  ["chat", "House chat", "message"],
  ["places", "Places", "home"],
  ["dates", "Dates", "events"],
  ["people", "People", "community"],
];

/**
 * The shortlist walk. Note this is NOT the order PLACE_STATUSES declares: the
 * chip cycles the way a house actually moves, and Passed sits at the end so one
 * extra tap is the way out rather than the way forward.
 */
const STATUS_CYCLE: PlaceStatus[] = ["INTERESTED", "TOURING", "APPLIED", "CHOSEN", "PASSED"];

const STATUS_TONE: Record<PlaceStatus, ChipTone> = {
  INTERESTED: "",
  TOURING: "accent",
  APPLIED: "accent",
  CHOSEN: "full",
  PASSED: "",
};

// --- small helpers ----------------------------------------------------------

/** One fetch shape for every workspace mutation, with the server's own words on failure. */
async function send(method: string, url: string, body?: unknown): Promise<void> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    let message = "That did not go through";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = String(data.error);
    } catch {
      /* the status alone is all we get, and the fallback line covers it */
    }
    throw new Error(message);
  }
}

function asPlaceStatus(value: string): PlaceStatus {
  return PLACE_STATUSES.includes(value as PlaceStatus) ? (value as PlaceStatus) : "INTERESTED";
}

function asDateKind(value: string): HousingDateKind {
  return HOUSING_DATE_KINDS.includes(value as HousingDateKind) ? (value as HousingDateKind) : "OTHER";
}

/** Dates arrive as plain YYYY-MM-DD, so parse the parts and skip time zone drift. */
function formatDay(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  if (!m) return value || "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function domainOf(place: WorkspacePlace): string {
  if (place.sourceDomain) return place.sourceDomain;
  try {
    return new URL(place.url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// --- House chat -------------------------------------------------------------

/**
 * No message list here on purpose. The house thread is the same thread model as
 * every other Zaylist conversation, so this tab is a door, not a second inbox.
 */
function HouseChatTab({ post, onOpenThread }: { post: HousingPostView; onOpenThread?: () => void }) {
  return (
    <div>
      <div className="hz-note">
        The house thread lives in your inbox with every other Zaylist conversation. One thread,
        everyone in {post.displayName || "the HAÜS"}, and it follows you around the site.
      </div>
      <div className="hz-composer">
        {onOpenThread ? (
          <Btn kind="solid" size="sm" onClick={onOpenThread}>
            <HousingIcon name="message" />
            Open the house chat
          </Btn>
        ) : (
          <Mono micro>Open your inbox to pick the thread up.</Mono>
        )}
      </div>
      <p className="hz-remind">
        <HousingIcon name="alerts" size={13} />
        New members land in the same thread the moment the Lead accepts them.
      </p>
    </div>
  );
}

// --- Places -----------------------------------------------------------------

function PlacesTab({
  post,
  workspace,
  refresh,
}: {
  post: HousingPostView;
  workspace: WorkspaceData;
  refresh: () => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addPlace = useMutation({
    mutationFn: (link: string) => send("POST", `/api/housing/${post.id}/places`, { url: link }),
    onSuccess: () => {
      setUrl("");
      setError(null);
      refresh();
    },
    onError: (err) => setError(errorText(err, "That link did not stick")),
  });

  const setStatus = useMutation({
    mutationFn: (vars: { placeId: number; status: PlaceStatus }) =>
      send("PATCH", `/api/housing/${post.id}/places/${vars.placeId}`, { status: vars.status }),
    onSuccess: refresh,
    onError: (err) => setError(errorText(err, "Could not move that one")),
  });

  const react = useMutation({
    mutationFn: (placeId: number) => send("POST", `/api/housing/${post.id}/places/${placeId}/react`),
    onSuccess: refresh,
  });

  const removePlace = useMutation({
    mutationFn: (placeId: number) => send("DELETE", `/api/housing/${post.id}/places/${placeId}`),
    onSuccess: refresh,
    onError: (err) => setError(errorText(err, "Could not take that one off")),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const link = url.trim();
    if (!link) return;
    addPlace.mutate(link);
  };

  return (
    <div>
      <form className="hz-composer" style={{ paddingTop: 0 }} onSubmit={submit}>
        <input
          className="hz-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a link to a place you found"
          aria-label="Link to a place"
        />
        <Btn size="sm" kind="outline" type="submit" disabled={addPlace.isPending}>
          <HousingIcon name="add" />
          Add
        </Btn>
      </form>
      {error ? (
        <p style={{ color: "var(--c)", fontSize: "var(--meta)", margin: "0 0 10px" }}>{error}</p>
      ) : null}
      <p style={{ color: "var(--text-lo)", fontSize: "var(--meta)", margin: "0 0 14px" }}>
        Links live here for your household only. Zaylist is not listing these places.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {workspace.places.map((pl) => {
          const status = asPlaceStatus(pl.status);
          const meta = [pl.rent, pl.neighborhood, `added by ${pl.addedBy}`].filter(Boolean).join(" · ");
          const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length];
          return (
            <div className="hz-place" key={pl.id}>
              <div className="hz-place__thumb">
                {pl.thumbUrl ? (
                  <img src={pl.thumbUrl} alt="" />
                ) : (
                  <Mono micro>{domainOf(pl)}</Mono>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>
                  <a href={pl.url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                    {pl.title}
                  </a>
                </b>
                {pl.isTarget ? (
                  <div style={{ marginTop: 3 }}>
                    <Mono accent micro>
                      <HousingIcon name="navigate" size={11} /> The target
                    </Mono>
                  </div>
                ) : null}
                <div style={{ marginTop: 4 }}>
                  <Mono micro>{meta}</Mono>
                </div>
                <div className="hz-chiprow" style={{ marginTop: 8 }}>
                  <Chip
                    tone={STATUS_TONE[status]}
                    title={`Tap for ${PLACE_STATUS_LABEL[next]}`}
                    onClick={() => setStatus.mutate({ placeId: pl.id, status: next })}
                  >
                    {PLACE_STATUS_LABEL[status]}
                  </Chip>
                  <Chip title="Say you like it" onClick={() => react.mutate(pl.id)}>
                    <HousingIcon name="favorite" />
                    {pl.reactions}
                  </Chip>
                  <Chip>
                    <HousingIcon name="message" />
                    {pl.comments} comments
                  </Chip>
                  {workspace.isLead ? (
                    <Chip title="Take it off the shortlist" onClick={() => removePlace.mutate(pl.id)}>
                      <HousingIcon name="close" />
                      Remove
                    </Chip>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
        {workspace.places.length === 0 ? (
          <div className="hz-empty">No places yet. Paste the first link and the house can weigh in.</div>
        ) : null}
      </div>
    </div>
  );
}

// --- Dates ------------------------------------------------------------------

function DatesTab({
  post,
  workspace,
  refresh,
}: {
  post: HousingPostView;
  workspace: WorkspaceData;
  refresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<HousingDateKind>("TOUR");
  const [label, setLabel] = useState("");
  const [dateOn, setDateOn] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addDate = useMutation({
    mutationFn: () => send("POST", `/api/housing/${post.id}/dates`, { kind, label, dateOn, note }),
    onSuccess: () => {
      setLabel("");
      setDateOn("");
      setNote("");
      setKind("TOUR");
      setOpen(false);
      setError(null);
      refresh();
    },
    onError: (err) => setError(errorText(err, "Could not add that date")),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !dateOn.trim()) {
      setError("A date needs a label and a day");
      return;
    }
    addDate.mutate();
  };

  return (
    <div>
      {workspace.dates.map((d) => (
        <div className="hz-date" key={d.id}>
          <b>{d.label}</b>
          <div style={{ textAlign: "right" }}>
            <div>
              <Mono accent micro>
                {formatDay(d.dateOn)}
              </Mono>
            </div>
            <div style={{ marginTop: 3 }}>
              <Mono micro>
                {HOUSING_DATE_KIND_LABEL[asDateKind(d.kind)]} · added by {d.addedBy}
              </Mono>
            </div>
          </div>
        </div>
      ))}
      {workspace.dates.length === 0 ? (
        <div className="hz-empty">No dates yet. Add the first tour and everyone gets the reminder.</div>
      ) : null}

      {open ? (
        <form style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }} onSubmit={submit}>
          <select
            className="hz-input"
            value={kind}
            onChange={(e) => setKind(asDateKind(e.target.value))}
            aria-label="What kind of date"
          >
            {HOUSING_DATE_KINDS.map((k) => (
              <option key={k} value={k}>
                {HOUSING_DATE_KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <input
            className="hz-input"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What is happening"
            aria-label="What is happening"
          />
          <input
            className="hz-input"
            type="date"
            value={dateOn}
            onChange={(e) => setDateOn(e.target.value)}
            aria-label="Which day"
          />
          <input
            className="hz-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the house should know (optional)"
            aria-label="Note"
          />
          {error ? <span style={{ color: "var(--c)", fontSize: "var(--meta)" }}>{error}</span> : null}
          <div className="hz-chiprow">
            <Btn size="sm" kind="solid" type="submit" disabled={addDate.isPending}>
              Add it
            </Btn>
            <Btn size="sm" kind="outline" onClick={() => setOpen(false)}>
              Never mind
            </Btn>
          </div>
        </form>
      ) : (
        <div style={{ marginTop: 14 }}>
          <Btn size="sm" kind="outline" onClick={() => setOpen(true)}>
            <HousingIcon name="add" />
            Add a date
          </Btn>
        </div>
      )}

      <p className="hz-remind">
        <HousingIcon name="alerts" size={13} />
        Reminders go out the same way every other Zaylist reminder does.
      </p>
    </div>
  );
}

// --- People -----------------------------------------------------------------

function memberLine(person: HousingPerson): string | null {
  if (person.kind === "PET") return person.species ? `Pet, ${person.species}` : "Pet";
  if (person.kind === "OFFPLATFORM") return "Not on Zaylist yet";
  if (person.role === "COLEAD") return "Co lead";
  return null;
}

function PeopleTab({
  post,
  workspace,
  refresh,
}: {
  post: HousingPostView;
  workspace: WorkspaceData;
  refresh: () => void;
}) {
  // Declining is quiet, so the row leaves the moment it is answered and nothing
  // else on the page reacts.
  const [answered, setAnswered] = useState<number[]>([]);
  const requests = workspace.requests.filter((r) => !answered.includes(r.id));

  const accept = useMutation({
    mutationFn: (requestId: number) => send("POST", `/api/housing/requests/${requestId}/accept`),
    onMutate: (requestId: number) => setAnswered((prev) => [...prev, requestId]),
    onSuccess: refresh,
  });

  const decline = useMutation({
    mutationFn: (requestId: number) => send("POST", `/api/housing/requests/${requestId}/decline`),
    onMutate: (requestId: number) => setAnswered((prev) => [...prev, requestId]),
    onSuccess: refresh,
  });

  const setFull = useMutation({
    mutationFn: (isFull: boolean) => send("POST", `/api/housing/${post.id}/full`, { isFull }),
    onSuccess: refresh,
  });

  const household = post.household ?? [];
  const isFull = !!post.isFull;

  return (
    <div>
      <div className="hz-members">
        {household.map((p) => {
          const line = memberLine(p);
          return (
            <div className="hz-member" key={p.id}>
              <UserAvatar
                photoUrl={p.photoUrl}
                avatarChoice={p.avatarChoice}
                displayName={p.name}
                username={p.username || undefined}
                avatarRing={p.kind === "MEMBER" ? p.avatarRing : "none"}
                size={44}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{p.name}</b>{" "}
                {p.role === "LEAD" ? (
                  <Mono accent micro>
                    Lead
                  </Mono>
                ) : null}
                {line ? <p>{line}</p> : null}
              </div>
            </div>
          );
        })}
        {household.length === 0 ? <div className="hz-empty">Just you so far.</div> : null}
      </div>

      {workspace.isLead && requests.length ? (
        <div style={{ marginTop: 16 }}>
          <Mono accent>Asked to join</Mono>
          {requests.map((r) => (
            <div className="hz-member" key={r.id} style={{ marginTop: 10 }}>
              <UserAvatar
                photoUrl={r.person.photoUrl}
                avatarChoice={r.person.avatarChoice}
                displayName={r.person.displayName}
                username={r.person.username || undefined}
                avatarRing={r.person.avatarRing}
                size={44}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{r.person.displayName}</b>{" "}
                {r.person.pronouns ? <Mono micro>{r.person.pronouns}</Mono> : null}
                {r.note ? <p>{r.note}</p> : null}
                <div className="hz-chiprow" style={{ marginTop: 10 }}>
                  <Chip tone="accent" onClick={() => accept.mutate(r.id)}>
                    Accept and open the chat
                  </Chip>
                  <Chip onClick={() => decline.mutate(r.id)}>Not right now</Chip>
                </div>
              </div>
            </div>
          ))}
          <p style={{ marginTop: 10, color: "var(--text-lo)", fontSize: "var(--meta)" }}>
            Asking to join is asking to chat. Nothing opens until the Lead accepts.
          </p>
        </div>
      ) : null}

      <div className="hz-sect" style={{ marginTop: 16 }}>
        {isFull && workspace.waitlist ? (
          <div style={{ marginBottom: 12 }}>
            <Mono accent>
              {workspace.waitlist} {workspace.waitlist === 1 ? "person" : "people"} on the waiting list
            </Mono>
          </div>
        ) : null}
        {workspace.isLead ? (
          <div className="hz-chiprow">
            <Chip tone={isFull ? "full" : ""} onClick={() => setFull.mutate(!isFull)}>
              {isFull ? "We are full" : "Mark the HAÜS full"}
            </Chip>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// --- the workspace ----------------------------------------------------------

/**
 * Members only. The endpoint answers 403 to everyone else, and this renders
 * nothing at all in that case: a locked door with a sign on it is still a sign.
 */
export function HousingWorkspace({
  post,
  onOpenThread,
}: {
  post: HousingPostView;
  onOpenThread?: () => void;
}): JSX.Element | null {
  const [tab, setTab] = useState<TabKey>("chat");

  const workspaceKey = ["/api/housing", post.id, "workspace"];

  const { data, isLoading } = useQuery<WorkspaceData | null>({
    queryKey: workspaceKey,
    queryFn: async () => {
      const res = await fetch(`/api/housing/${post.id}/workspace`, { credentials: "include" });
      // Not a member, or signed out. Either way there is nothing to show.
      if (res.status === 403 || res.status === 401) return null;
      if (!res.ok) throw new Error("Could not open the workspace");
      return (await res.json()) as WorkspaceData;
    },
  });

  // Anything that changes in here can change the card and the detail view too.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: workspaceKey });
    queryClient.invalidateQueries({ queryKey: ["/api/housing", post.id] });
  };

  if (isLoading || !data) return null;

  return (
    <div className="hz-ws pdx-glass-rebind" style={accentStyle(post.type) as CSSProperties}>
      <div className="hz-wstabs" role="tablist" aria-label="The house hunt">
        {TABS.map(([key, label, icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            className="hz-wstab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
          >
            <HousingIcon name={icon} />
            {label}
          </button>
        ))}
      </div>
      <div className="hz-wsbody" role="tabpanel">
        {tab === "chat" ? (
          <HouseChatTab post={post} onOpenThread={onOpenThread} />
        ) : tab === "places" ? (
          <PlacesTab post={post} workspace={data} refresh={refresh} />
        ) : tab === "dates" ? (
          <DatesTab post={post} workspace={data} refresh={refresh} />
        ) : (
          <PeopleTab post={post} workspace={data} refresh={refresh} />
        )}
      </div>
    </div>
  );
}

export default HousingWorkspace;
