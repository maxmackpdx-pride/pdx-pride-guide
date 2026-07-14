import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/PageHeader";
import AuthModal from "@/components/AuthModal";
import { useEffect, useState } from "react";

/**
 * Standalone route kept for bookmarks/deep links.
 * Logged-in users are sent to hub Settings (canonical notification prefs UI).
 */
export default function NotificationSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation("/dashboard?section=settings");
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="zine-page board-page">
        <PageHeader
          section="Account"
          title="Notification settings"
          titleAccent="cyan"
          lede="Sign in to manage push alerts for messages, events, and account updates."
        />
        <div className="dash-inner" style={{ maxWidth: 640, padding: "24px 20px 64px" }}>
          <p style={{ color: "#8c8980", marginBottom: 16 }}>You need to be logged in to change notification settings.</p>
          <button
            type="button"
            className="site-login-button"
            onClick={() => setShowAuth(true)}
          >
            LOG IN / JOIN
          </button>
        </div>
        {showAuth && (
          <AuthModal
            onClose={() => {
              setShowAuth(false);
            }}
          />
        )}
      </div>
    );
  }

  // Redirecting to hub Settings
  return null;
}
