import { Link } from "wouter";
import { Button } from "@/components/ds";
import { useAuth } from "@/context/AuthContext";
import DashboardNotificationPrefs from "@/components/DashboardNotificationPrefs";

type Props = {
  onLogout: () => void;
};

/**
 * Hub settings. Only surfaces controls that persist for real:
 * calm mode (theme), notification prefs API, sign out.
 * Fake privacy/follow toggles removed until backend exists.
 */
export default function HubSettings({ onLogout }: Props) {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);

  return (
    <div className="reveal hub-settings">
      <div className="kick hub-settings__hero-kick">Make it yours</div>
      <h1 className="h1">Settings</h1>

      <div className="card hub-settings__card hub-settings__card--comfortable pdx-glass-rebind">
        <div className="kick hub-settings__section-kick hub-settings__section-kick--privacy">Privacy</div>
        <p className="hub-settings__note">
          Public profile visibility, RSVP visibility, and check-in privacy are not live yet. We removed the
          pretend toggles so nothing looks saved when it is not.
        </p>
      </div>

      <div className="card hub-settings__card hub-settings__card--roomy pdx-glass-rebind">
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