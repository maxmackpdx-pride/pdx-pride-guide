import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { InboxShell } from "@/components/inbox/InboxShell";
import HubShell from "@/components/hub/HubShell";

function threadFromQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("thread")?.trim() || "";
}

export default function Inbox() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(threadFromQuery() || null);

  usePageSeo(
    "Inbox | PDX Pride Guide",
    "Private messages from missed connections, Pride Werk, event hosts, and check-ins.",
  );

  const { data: adminSession } = useQuery<{ isAdmin?: boolean; isSuperAdmin?: boolean } | null>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const r = await fetch("/api/admin/me", { credentials: "include" });
      return r.ok ? r.json() : null;
    },
    enabled: !!user,
    retry: false,
  });

  const { data: unread = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    queryFn: () =>
      fetch("/api/messages/unread-count", { credentials: "include" }).then(r =>
        r.ok ? r.json() : { count: 0 },
      ),
    enabled: !!user,
  });

  const isAdmin = Boolean(user?.isAdmin || adminSession?.isAdmin);
  const isSuperAdmin = Boolean(user?.isSuperAdmin || adminSession?.isSuperAdmin);

  const { data: pendingAdmin = { count: 0, ownerCount: 0 } } = useQuery<{ count: number; ownerCount?: number }>({
    queryKey: ["/api/admin/pending-count"],
    queryFn: () =>
      fetch("/api/admin/pending-count", { credentials: "include" }).then(r =>
        r.ok ? r.json() : { count: 0, ownerCount: 0 },
      ),
    enabled: isAdmin,
    refetchInterval: 90_000,
  });

  const syncThreadUrl = useCallback((id: string | null) => {
    setThreadId(id);
    setLocation(id ? `/inbox?thread=${encodeURIComponent(id)}` : "/inbox");
  }, [setLocation]);

  useEffect(() => {
    const onPopState = () => setThreadId(threadFromQuery() || null);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (!user) {
    return (
      <div className="zine-page inbox-page board-page" style={{ minHeight: "100vh" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <p style={{ color: "#9d9a92", marginBottom: 24, lineHeight: 1.6 }}>
            Log in to read private threads from missed connections, Pride Werk, event hosts, and check-ins.
          </p>
          <button type="button" className="btn-neon" onClick={() => setShowAuth(true)}>
            LOG IN / JOIN
          </button>
        </div>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <HubShell
      mode="member"
      memberView="inbox"
      isAdminUser={isAdmin}
      isSuperAdmin={isSuperAdmin}
      userName={user.displayName || user.username || "Member"}
      userHandle={user.username}
      photoUrl={user.photoUrl}
      avatarChoice={user.avatarChoice}
      avatarRing={user.avatarRing}
      unreadCount={unread.count || 0}
      pendingCount={pendingAdmin.count || 0}
      ownerCount={isSuperAdmin ? (pendingAdmin.ownerCount || 0) : 0}
      kicker="Private messages"
      kickerColor="var(--cyan, #00ffff)"
      title="Inbox"
      lede="Your 1:1 threads from Spotted, Pride Werk, event hosts, and check-ins. Only you can see these."
      onLogout={() => logout()}
      onMemberNavigate={(view) => {
        if (view === "posts") setLocation("/dashboard?view=posts");
        else if (view === "home") setLocation("/dashboard");
      }}
    >
      <button
        type="button"
        className="hub-back-btn"
        onClick={() => setLocation("/dashboard")}
      >
        <ChevronLeft size={15} strokeWidth={2.4} aria-hidden />
        Back to hub
      </button>
      <div
        className="inbox-page"
        style={{
          height: "min(70dvh, 720px)",
          minHeight: 420,
          overflow: "hidden",
          borderRadius: 14,
          border: "1px solid #1c1c22",
        }}
      >
        <InboxShell initialThreadId={threadId} onThreadChange={syncThreadUrl} />
      </div>
    </HubShell>
  );
}