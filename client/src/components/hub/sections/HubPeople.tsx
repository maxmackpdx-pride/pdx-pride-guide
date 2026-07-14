import { Link } from "wouter";
import { Button } from "@/components/ds";

/**
 * People hub stub. Follow graph list is not live here yet.
 * Follow works on public profiles at /u/... — no fake Following/Followers/Discover chrome.
 */
export default function HubPeople() {
  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Your community
      </div>
      <h1 className="h1">People</h1>

      <div
        className="card"
        style={{
          marginTop: 22,
          padding: "28px 22px",
          textAlign: "center",
          border: "1px solid var(--panel-border)",
          borderRadius: 12,
        }}
      >
        <div className="kick" style={{ letterSpacing: ".14em", color: "var(--panel-cyan)", marginBottom: 10 }}>
          Hub list not live yet
        </div>
        <p style={{ margin: "0 auto 18px", maxWidth: 420, fontSize: 14.5, color: "var(--board-muted)", lineHeight: 1.55 }}>
          Follow works on public profiles at{" "}
          <span style={{ color: "var(--panel-cyan)" }}>/u/…</span>
          {" — "}this hub list (Following / Followers / Discover) is not live yet. It will land here when the social graph ships.
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
