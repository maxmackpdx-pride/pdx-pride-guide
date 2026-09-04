import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { InboxShell } from "@/components/inbox/InboxShell";
import HubShell from "@/components/hub/HubShell";
import "./Inbox.css";

function threadFromQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("thread")?.trim() || "";
}

export default function Inbox() {
  const { user, logout, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(threadFromQuery() || null);

  usePageSeo(
    "Inbox | Zaylist",
    "Private messages from MIZZED CONNECTION, GIGZ, GIFTZ, SELLZ, THE HAÜZ, event hosts, and check-ins.",
  );

  const { data: adminSession } = useQuery<{ isAdmin?: boolean; isSuperAdmin?: boolean; isPrimaryOwner?: boolean } | null>({
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
  const isPrimaryOwner = Boolean(user?.isPrimaryOwner || adminSession?.isPrimaryOwner);

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

  if (authLoading) {
    return (
      <div className="zine-page inbox-page board-page">
        <div className="inbox-page-gate" aria-live="polite" aria-busy="true">
          <span className="inbox-page-gate__pulse" aria-hidden="true" />
          <p>Loading inbox…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="zine-page inbox-page board-page">
        <div className="inbox-page-gate inbox-page-gate--signed-out">
          <div className="inbox-page-gate__kicker">Private messages</div>
          <h1>Inbox</h1>
          <p>
            Log in to read private threads from MIZZED CONNECTION, GIGZ, GIFTZ, SELLZ, THE HAÜZ, event hosts, and check-ins.
          </p>
          <button type="button" className="pdxBtn pdxBtn--solid pdxBtn--md pdx-glass-rebind inbox-page-gate__action" onClick={() => setShowAuth(true)}>
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
      isPrimaryOwner={isPrimaryOwner}
      userName={user.displayName || user.username || "Member"}
      userHandle={user.username}
      photoUrl={user.photoUrl}
      avatarChoice={user.avatarChoice}
      avatarRing={user.avatarRing}
      unreadCount={unread.count || 0}
      pendingCount={pendingAdmin.count || 0}
      ownerCount={isPrimaryOwner ? (pendingAdmin.ownerCount || 0) : 0}
      kicker="Private messages"
      kickerColor="var(--cyan, #00ffff)"
      title="Inbox"
      lede="Your 1:1 threads from MIZZED CONNECTION, GIGZ, GIFTZ, SELLZ, THE HAÜZ, event hosts, and check-ins. Only you can see these."
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
        className="inbox-page-frame"
      >
        <InboxShell initialThreadId={threadId} onThreadChange={syncThreadUrl} />
      </div>
    </HubShell>
  );
}
