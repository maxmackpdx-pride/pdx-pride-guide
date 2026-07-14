import { Link } from "wouter";
import { Button } from "@/components/ds";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import DashboardNotificationPrefs from "@/components/DashboardNotificationPrefs";

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

/**
 * Hub settings. Only surfaces controls that persist for real:
 * calm mode (theme), notification prefs API, sign out.
 * Fake privacy/follow toggles removed until backend exists.
 */
export default function HubSettings({ onLogout }: Props) {
  const { calmMode, toggleCalmMode } = useTheme();
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);

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
        <p style={{ margin: "8px 0 12px", fontSize: 13, color: "var(--board-muted)", lineHeight: 1.5 }}>
          These save to your account. Same controls as{" "}
          <Link href="/settings/notifications" style={{ color: "var(--panel-cyan)" }}>
            full notification settings
          </Link>
          .
        </p>
        <div style={{ paddingBottom: 16 }}>
          <DashboardNotificationPrefs isAdmin={isAdmin} />
        </div>
      </div>

      <div className="card" style={{ padding: "4px 20px", marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", padding: "16px 0 4px" }}>
          Appearance
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 0", borderTop: "1px solid var(--panel-border)" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>Calm mode</div>
            <div style={{ fontSize: 12.5, color: "var(--board-muted)", marginTop: 2 }}>
              Silence grain, glitch, and glows. Flag rings stay. Saves on this device.
            </div>
          </div>
          <ToggleSwitch on={calmMode} onToggle={toggleCalmMode} />
        </div>
      </div>

      <div className="card" style={{ padding: "18px 20px", marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", marginBottom: 10 }}>
          Privacy
        </div>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--board-muted)", lineHeight: 1.55 }}>
          Public profile visibility, RSVP visibility, and check-in privacy are not live yet. We removed the
          pretend toggles so nothing looks saved when it is not.
        </p>
      </div>

      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", color: "var(--status-bad)", marginBottom: 14 }}>
          Account
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button variant="ghost" accent="cyan" onClick={onLogout}>
            Sign out
          </Button>
          {user?.username && (
            <Link href={`/u/${encodeURIComponent(user.username)}`}>
              <Button variant="ghost" accent="lime">
                Public profile
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
