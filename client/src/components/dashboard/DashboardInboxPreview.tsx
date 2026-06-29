import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import { counterpartyAvatar } from "@/lib/inboxAvatar";

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function DashboardInboxPreview({ enabled }: { enabled: boolean }) {
  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () => fetch("/api/messages/unread-count", { credentials: "include" }).then(r => r.ok ? r.json() : { count: 0 }),
    enabled,
  });

  const { data: inbox = [] } = useQuery<any[]>({
    queryKey: ["/api/messages/inbox"],
    queryFn: () => fetch("/api/messages/inbox", { credentials: "include" }).then(r => r.ok ? r.json() : []),
    enabled,
  });

  const threads = inbox.slice(0, 5);

  return (
    <section className="dash-inbox">
      <div className="dash-inbox-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className="dash-inbox-title dash-anton">Inbox</h2>
          {unread.count > 0 && (
            <span className="dash-badge-pulse">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0a0a0a" }} />
              {unread.count} unread
            </span>
          )}
        </div>
        <Link href="/inbox" className="dash-pill-btn">Open inbox →</Link>
      </div>
      <div>
        {threads.length === 0 ? (
          <div style={{ padding: "20px", color: "var(--dash-muted)", fontSize: 14 }}>
            No messages yet. Host an event or reply on the board to start a thread.
          </div>
        ) : (
          threads.map((msg) => {
            const name = msg.fromDisplayName || msg.from_display_name || msg.fromUsername || msg.from_username || "Community";
            const party = counterpartyAvatar(msg, "inbox");
            const unreadMsg = !msg.isRead && !msg.is_read;
            return (
              <Link key={msg.id} href="/inbox">
                <button
                  type="button"
                  className={`dash-thread ${unreadMsg ? "unread" : ""}`}
                >
                  <span className="dash-thread-avatar">
                    <UserAvatar
                      photoUrl={party.photoUrl}
                      avatarChoice={party.avatarChoice ?? undefined}
                      avatarRing={party.avatarRing}
                      displayName={party.displayName || name}
                      username={party.username ?? undefined}
                      size={40}
                    />
                    {unreadMsg && <span className="dash-thread-dot" />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      <span
                        className="dash-anton"
                        style={{ fontSize: 15, color: unreadMsg ? "#fff" : "#bdbab2" }}
                      >
                        {name}
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#6f736c" }}>
                        {formatTime(msg.createdAt || msg.created_at)}
                      </span>
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 13,
                        color: unreadMsg ? "#cbc8c0" : "#7c807a",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {msg.body || msg.subject || "New message"}
                    </span>
                  </span>
                </button>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}