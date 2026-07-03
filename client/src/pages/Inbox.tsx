import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";
import { InboxShell } from "@/components/inbox/InboxShell";

function threadFromQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("thread")?.trim() || "";
}

export default function Inbox() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(threadFromQuery() || null);

  usePageSeo(
    "Inbox — PDX Pride Guide",
    "Private messages from missed connections, Pride Werk, event hosts, and check-ins.",
  );

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
    <div
      className="inbox-page board-page"
      style={{
        height: "calc(100dvh - 56px)",
        minHeight: 520,
        maxHeight: "100dvh",
        overflow: "hidden",
      }}
    >
      <InboxShell initialThreadId={threadId} onThreadChange={syncThreadUrl} />
    </div>
  );
}