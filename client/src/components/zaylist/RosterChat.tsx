import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import UsernameAutocomplete from "@/components/UsernameAutocomplete";

type Kind = "events" | "places";
type State = {
  owner: boolean;
  automatic: boolean;
  role: string | null;
  pending: boolean;
  mode: string;
  rooms: string[];
};
type Invite = { kind: Kind; id: number; title: string; pending: boolean };
type Message = { id: number; username: string; body: string };
const base = "/api/hub/roster-chats";
const roomName = (room: string) =>
  room === "team" ? "Team only" : "Team + promoters";

export function RosterInvitations() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: [base, "mine", user?.id],
    enabled: !!user,
    queryFn: () =>
      apiRequest("GET", base + "/mine").then(
        (r) => r.json() as Promise<Invite[]>,
      ),
  });
  if (!query.data?.length) return null;
  return (
    <section className="zl-section">
      <h2>Your team chats</h2>
      {query.data.map((row) => (
        <RosterChat
          key={row.kind + row.id}
          kind={row.kind}
          id={row.id}
          title={row.title}
        />
      ))}
    </section>
  );
}

export default function RosterChat({
  kind,
  id,
  title = "Team chat",
}: {
  kind: Kind;
  id: number;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="zl-tool"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>{title}</summary>
      {open && <RosterPanel key={kind + id} kind={kind} id={id} />}
    </details>
  );
}

function RosterPanel({ kind, id }: { kind: Kind; id: number }) {
  const { user } = useAuth(),
    qc = useQueryClient(),
    path = base + "/" + kind + "/" + id;
  const [selected, setSelected] = useState("combined"),
    [username, setUsername] = useState(""),
    [role, setRole] = useState("staff");
  const [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  const request = useRef({ body: "", key: "" });
  const scope = [base, kind, id, user?.id];
  const state = useQuery({
    queryKey: [...scope, "settings"],
    queryFn: () =>
      apiRequest("GET", path).then((r) => r.json() as Promise<State>),
    refetchInterval: 15000,
    retry: false,
  });
  const data = state.data;
  const room = data?.rooms.includes(selected) ? selected : data?.rooms[0];
  const messages = useQuery({
    queryKey: [...scope, "messages", room],
    enabled: !!room,
    queryFn: () =>
      apiRequest("GET", path + "/rooms/" + room).then(
        (r) => r.json() as Promise<{ items: Message[] }>,
      ),
    refetchInterval: 5000,
    retry: false,
  });
  async function action(
    method: string,
    suffix: string,
    payload?: object,
    done?: () => void,
  ) {
    if (busy) return;
    setBusy(true);
    setNote("");
    try {
      await apiRequest(method, path + suffix, payload);
      done?.();
      await qc.invalidateQueries({ queryKey: [base] });
    } catch (e) {
      setNote(parseApiError(e, "Could not update the chat."));
    } finally {
      setBusy(false);
    }
  }
  if (state.isError) return <p role="status">Roster chat is unavailable.</p>;
  if (!data) return <p role="status">Loading team chat…</p>;
  return (
    <div>
      {data.pending && (
        <>
          <p>You’ve been invited to this private roster chat.</p>
          <div className="zl-row">
            <button
              className="zl-btn"
              disabled={busy}
              onClick={() => void action("PUT", "/respond", { accept: true })}
            >
              Join chat
            </button>
            <button
              className="zl-btn"
              disabled={busy}
              onClick={() => void action("PUT", "/respond", { accept: false })}
            >
              Decline
            </button>
          </div>
        </>
      )}
      {data.owner && (
        <details className="zl-tool">
          <summary>Manage chat</summary>
          <label>
            Rooms{" "}
            <select
              className="zl-select"
              value={data.mode}
              disabled={busy}
              onChange={(e) =>
                void action("PUT", "/mode", { mode: e.target.value })
              }
            >
              <option value="combined">Team and promoters together</option>
              <option value="separate">
                Separate team room and shared room
              </option>
              <option value="team">Team only</option>
              <option value="off">Turn chats off</option>
            </select>
          </label>
          <form
            className="zl-row"
            onSubmit={(e) => {
              e.preventDefault();
              void action("POST", "/invitations", { username, role }, () => {
                setUsername("");
                setNote("Invitation sent.");
              });
            }}
          >
            <UsernameAutocomplete
              value={username}
              onChange={setUsername}
              placeholder="Invite a member"
            />
            <select
              aria-label="Chat role"
              className="zl-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="staff">Staff</option>
              <option value="promoter">Promoter</option>
              <option value="talent">Talent</option>
            </select>
            <button className="zl-btn" disabled={busy || !username.trim()}>
              Invite
            </button>
            <button
              type="button"
              className="zl-btn"
              disabled={busy || !username.trim()}
              onClick={() =>
                void action(
                  "DELETE",
                  "/invitations/" + encodeURIComponent(username),
                  undefined,
                  () => {
                    setUsername("");
                    setNote("Chat invitation removed.");
                  },
                )
              }
            >
              Remove invitation
            </button>
          </form>
        </details>
      )}
      {room && (
        <>
          <div className="zl-row">
            {data.rooms.map((r) => (
              <button
                key={r}
                className="zl-btn"
                aria-pressed={r === room}
                onClick={() => {
                  setSelected(r);
                  setBody("");
                }}
              >
                {roomName(r)}
              </button>
            ))}
          </div>
          {messages.isError ? (
            <p role="status">Messages are unavailable.</p>
          ) : (
            messages.data && (
              <ul aria-label="Recent messages">
                {messages.data.items.map((m) => (
                  <li key={m.id}>
                    <strong>@{m.username}</strong> {m.body}
                  </li>
                ))}
              </ul>
            )
          )}
          <form
            className="zl-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (request.current.body !== room + body)
                request.current = {
                  body: room + body,
                  key: crypto.randomUUID(),
                };
              void action(
                "POST",
                "/rooms/" + room,
                { body, requestKey: request.current.key },
                () => {
                  setBody("");
                  request.current = { body: "", key: "" };
                },
              );
            }}
          >
            <textarea
              className="zl-input"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-label="Team message"
              maxLength={1500}
            />
            <button className="zl-btn" disabled={busy || !body.trim()}>
              Send
            </button>
          </form>
        </>
      )}
      {data.role && !room && <p>There are no active rooms for your role.</p>}
      {data.role && !data.automatic && user && (
        <button
          className="zl-btn"
          disabled={busy}
          onClick={() =>
            void action(
              "DELETE",
              "/invitations/" + encodeURIComponent(user.username),
            )
          }
        >
          Leave chat
        </button>
      )}
      {note && <p role="status">{note}</p>}
    </div>
  );
}
