import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import DashboardNotificationPrefs from "@/components/DashboardNotificationPrefs";
import AuthModal from "@/components/AuthModal";
import { useState } from "react";

export default function NotificationSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);

  const { data: adminSession } = useQuery<{ isAdmin?: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      return r.ok ? r.json() : null;
    },
    enabled: Boolean(user),
    retry: false,
  });
  const isAdmin = Boolean(user?.isAdmin || adminSession?.isAdmin);

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
              // If login succeeds AuthContext updates; user may still need refresh of route
              if (window.location.pathname.includes("/settings/notifications")) {
                setLocation("/settings/notifications");
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="zine-page board-page">
      <PageHeader
        section="Account"
        title="Notification settings"
        titleAccent="cyan"
        kicker={`@${user.username}`}
        lede="Choose which push alerts you get on this device and for your account during Pride and year-round."
        tagline={
          <>
            <Link href="/dashboard" className="dash-tagline-link">
              Hub
            </Link>
            {" · "}
            <Link href="/inbox" className="dash-tagline-link">
              Inbox
            </Link>
          </>
        }
      />
      <div className="dash-inner" style={{ maxWidth: 640, padding: "8px 20px 64px" }}>
        <DashboardNotificationPrefs isAdmin={isAdmin} />
      </div>
    </div>
  );
}
