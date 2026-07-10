import type { ReactNode } from "react";
import { Link } from "wouter";
import UserAvatar from "@/components/UserAvatar";
import type { AuthUser } from "@/context/AuthContext";

type Props = {
  user: AuthUser;
  stats: Array<{ value: string | number; label: string }>;
  postsCount: number;
  profileEditor?: ReactNode;
  onEditProfile?: () => void;
};

export default function HubProfile({ user, stats, postsCount, profileEditor, onEditProfile }: Props) {
  const displayName = user.displayName || user.username;
  const isPromoter = user.promoterStatus === "approved";

  const samplePosts = [
    { kind: "PHOTO", time: "2d", text: "Parade route signage, batch one done." },
    { kind: "UPDATE", time: "4d", text: "Reminder: the gifting board is live all week." },
    { kind: "VIDEO", time: "1w", text: "Confetti cannon test. Volume warning." },
  ].slice(0, Math.min(3, postsCount || 3));

  return (
    <div className="reveal">
      {profileEditor}

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <UserAvatar
          photoUrl={user.photoUrl}
          avatarChoice={user.avatarChoice}
          avatarRing={user.avatarRing}
          displayName={displayName}
          username={user.username}
          size={72}
        />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="h1">{displayName}</h1>
            {(user.isAdmin || isPromoter) && (
              <span
                className="kick"
                style={{
                  letterSpacing: ".12em",
                  color: "var(--panel-cyan)",
                  border: "1px solid var(--panel-cyan)",
                  padding: "2px 8px",
                  borderRadius: 5,
                }}
              >
                {user.isAdmin ? "Verified" : "Promoter"}
              </span>
            )}
          </div>
          <div className="kick" style={{ letterSpacing: ".08em", marginTop: 8 }}>
            @{user.username}
          </div>
        </div>
      </div>

      {user.bio && (
        <p style={{ margin: "20px 0 0", maxWidth: 540, fontSize: 15, lineHeight: 1.6, color: "var(--board-text)" }}>
          {user.bio}
        </p>
      )}

      <div style={{ display: "flex", gap: 12, margin: "20px 0 26px", flexWrap: "wrap" }}>
        <Link
          href={`/u/${encodeURIComponent(user.username)}`}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--panel-cyan)",
            border: "1px solid var(--panel-cyan)",
            borderRadius: 8,
            padding: "9px 16px",
          }}
        >
          View public profile
        </Link>
        <button
          type="button"
          onClick={onEditProfile}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--board-muted)",
            border: "1px solid var(--panel-border-2)",
            borderRadius: 8,
            padding: "9px 16px",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Edit on your profile page
        </button>
      </div>

      <div
        className="statwrap"
        style={{
          display: "flex",
          border: "1px solid var(--panel-border)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 30,
        }}
      >
        {stats.map((st, i) => (
          <div
            key={st.label}
            style={{
              flex: 1,
              padding: "18px 16px",
              borderRight: i < stats.length - 1 ? "1px solid var(--panel-border)" : undefined,
            }}
          >
            <div className="statnum" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, color: "#fff", lineHeight: 0.85 }}>
              {st.value}
            </div>
            <div className="kick" style={{ letterSpacing: ".12em", marginTop: 8 }}>
              {st.label}
            </div>
          </div>
        ))}
      </div>

      <div className="kick" style={{ marginBottom: 16 }}>
        Your posts
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {samplePosts.map((m, i) => (
          <div key={i} className="card" style={{ overflow: "hidden" }}>
            <div style={{ height: 130, background: "var(--ink-850)", borderBottom: "1px solid var(--panel-border)" }} />
            <div style={{ padding: "13px 14px" }}>
              <div className="kick" style={{ letterSpacing: ".12em", color: "var(--panel-cyan)" }}>
                {m.kind} · {m.time}
              </div>
              <div style={{ fontSize: 13, color: "var(--board-text)", marginTop: 6, lineHeight: 1.45 }}>{m.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}