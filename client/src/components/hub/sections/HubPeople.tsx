import { Link } from "wouter";
import { Button } from "@/components/ds";

type PeopleTab = "following" | "followers" | "discover";

const TABS: Array<{ key: PeopleTab; label: string }> = [
  { key: "following", label: "Following" },
  { key: "followers", label: "Followers" },
  { key: "discover", label: "Discover" },
];

/**
 * People hub. Follow graph UI used to show hard-coded fake names that did not
 * save. Until the real social graph ships, keep the shell and honest empty copy.
 */
export default function HubPeople() {
  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Your community
      </div>
      <h1 className="h1">People</h1>

      <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--panel-border)", margin: "20px 0 22px" }}>
        {TABS.map((t) => (
          <span
            key={t.key}
            className="seg"
            style={{ opacity: t.key === "following" ? 1 : 0.45, cursor: "default" }}
            aria-disabled="true"
          >
            {t.label}
          </span>
        ))}
      </div>

      <div
        className="card"
        style={{
          padding: "28px 22px",
          textAlign: "center",
          border: "1px solid var(--panel-border)",
          borderRadius: 12,
        }}
      >
        <div className="kick" style={{ letterSpacing: ".14em", color: "var(--panel-cyan)", marginBottom: 10 }}>
          Follow graph not live yet
        </div>
        <p style={{ margin: "0 auto 18px", maxWidth: 420, fontSize: 14.5, color: "var(--board-muted)", lineHeight: 1.55 }}>
          Following, followers, and discover used to show demo people who were not real accounts and did not
          save. That mock list is gone. When the social graph ships, this is where it will live.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/events">
            <Button variant="neon" accent="cyan" size="sm">
              Browse events
            </Button>
          </Link>
          <Link href="/directory">
            <Button variant="ghost" accent="lime" size="sm">
              Queer directory
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
