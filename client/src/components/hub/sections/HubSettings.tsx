import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ds";
import { useTheme } from "@/context/ThemeContext";

type ToggleRow = { key: string; label: string; desc: string };

const NOTIF_SETTINGS: ToggleRow[] = [
  { key: "reminders", label: "Event reminders", desc: "A nudge before events you RSVP to." },
  { key: "followers", label: "New followers", desc: "When someone follows you." },
  { key: "replies", label: "Replies & likes", desc: "Activity on your posts." },
  { key: "digest", label: "Weekly digest", desc: "What your follows are up to, every Monday." },
];

const PRIVACY_SETTINGS: ToggleRow[] = [
  { key: "publicProfile", label: "Public profile", desc: "Anyone can see your profile and posts." },
  { key: "showRsvps", label: "Show my RSVPs", desc: "Let follows see which events you are going to." },
  { key: "showCheckins", label: "Show check-ins", desc: "Post your location when you check in." },
];

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`sw${on ? " on" : ""}`}
      onClick={onToggle}
      aria-pressed={on}
      style={{ border: "none", padding: 0 }}
    >
      <span className="knob" />
    </button>
  );
}

type Props = {
  onLogout: () => void;
};

export default function HubSettings({ onLogout }: Props) {
  const { calmMode, toggleCalmMode } = useTheme();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    reminders: true,
    followers: true,
    replies: true,
    digest: true,
    publicProfile: true,
    showRsvps: true,
    showCheckins: false,
  });

  const toggle = (key: string) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Make it yours
      </div>
      <h1 className="h1">Settings</h1>

      <div className="card" style={{ padding: "4px 20px", marginTop: 20 }}>
        <div className="kick" style={{ letterSpacing: ".16em", padding: "16px 0 4px" }}>
          Notifications
        </div>
        <Link
          href="/settings/notifications"
          className="kick"
          style={{ display: "block", letterSpacing: ".1em", color: "var(--panel-cyan)", marginBottom: 8, fontSize: 10 }}
        >
          Full notification settings →
        </Link>
        {NOTIF_SETTINGS.map((n) => (
          <div key={n.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderTop: "1px solid var(--panel-border)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{n.label}</div>
              <div style={{ fontSize: 12.5, color: "var(--board-muted)", marginTop: 2 }}>{n.desc}</div>
            </div>
            <ToggleSwitch on={!!settings[n.key]} onToggle={() => toggle(n.key)} />
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "4px 20px", marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", padding: "16px 0 4px" }}>
          Privacy
        </div>
        {PRIVACY_SETTINGS.map((n) => (
          <div key={n.key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderTop: "1px solid var(--panel-border)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{n.label}</div>
              <div style={{ fontSize: 12.5, color: "var(--board-muted)", marginTop: 2 }}>{n.desc}</div>
            </div>
            <ToggleSwitch on={!!settings[n.key]} onToggle={() => toggle(n.key)} />
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "4px 20px", marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", padding: "16px 0 4px" }}>
          Appearance
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderTop: "1px solid var(--panel-border)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>Calm mode</div>
            <div style={{ fontSize: 12.5, color: "var(--board-muted)", marginTop: 2 }}>
              Silence grain, glitch, and glows. Flag rings stay.
            </div>
          </div>
          <ToggleSwitch on={calmMode} onToggle={toggleCalmMode} />
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", color: "var(--status-bad)", marginBottom: 14 }}>
          Account
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button variant="ghost" accent="cyan" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}