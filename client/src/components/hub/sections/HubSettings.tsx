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
      aria-label={on ? "Disable calm mode" : "Enable calm mode"}
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
    <div className="reveal hub-settings">
      <div className="kick hub-settings__hero-kick">Make it yours</div>
      <h1 className="h1">Settings</h1>

      <div className="card hub-settings__card hub-settings__card--tight">
        <div className="kick hub-settings__section-kick">Notifications</div>
        <p className="hub-settings__lede">
          These save to your account - push alerts for messages, events, and account updates.
        </p>
        <div className="hub-settings__prefs">
          <DashboardNotificationPrefs isAdmin={isAdmin} embedded />
        </div>
      </div>

      <div className="card hub-settings__card hub-settings__card--tight">
        <div className="kick hub-settings__section-kick">Appearance</div>
        <div className="hub-settings__row">
          <div className="hub-settings__row-copy">
            <div className="hub-settings__row-title">Calm mode</div>
            <div className="hub-settings__row-desc">
              Silence grain, glitch, and glows. Flag rings stay. Saves on this device.
            </div>
          </div>
          <ToggleSwitch on={calmMode} onToggle={toggleCalmMode} />
        </div>
      </div>

      <div className="card hub-settings__card hub-settings__card--comfortable">
        <div className="kick hub-settings__section-kick hub-settings__section-kick--privacy">Privacy</div>
        <p className="hub-settings__note">
          Public profile visibility, RSVP visibility, and check-in privacy are not live yet. We removed the
          pretend toggles so nothing looks saved when it is not.
        </p>
      </div>

      <div className="card hub-settings__card hub-settings__card--roomy">
        <div className="kick hub-settings__section-kick hub-settings__section-kick--account">Account</div>
        <div className="hub-settings__actions">
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