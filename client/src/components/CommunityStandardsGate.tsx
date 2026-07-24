import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  COMMUNITY_STANDARDS_BLOCKS,
  COMMUNITY_STANDARDS_DECLINE_URL,
  COMMUNITY_STANDARDS_GATE_ENABLED,
  COMMUNITY_STANDARDS_VERSION,
  GUEST_STANDARDS_STORAGE_KEY,
  LEGAL_SUMMARY_BLOCKS,
  userHasCurrentCommunityStandards,
  type CommunityStandardsBlock,
} from "@shared/communityStandards";

function StandardsScroll({ blocks }: { blocks: CommunityStandardsBlock[] }) {
  return (
    <div
      className="cs-gate__scroll"
      style={{
        maxHeight: "min(42vh, 320px)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "12px 14px",
        border: "2px solid #000",
        background: "#f7f7f2",
        fontSize: "0.88rem",
        lineHeight: 1.55,
        color: "#111",
        textAlign: "left",
      }}
    >
      {blocks.map((block) => (
        <section key={block.heading} style={{ marginBottom: 16 }}>
          <h3
            style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontWeight: 900,
              fontSize: "0.95rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              margin: "0 0 8px",
              color: "#000",
            }}
          >
            {block.heading}
          </h3>
          {block.paragraphs?.map((p) => (
            <p key={p.slice(0, 48)} style={{ margin: "0 0 8px" }}>
              {p}
            </p>
          ))}
          {block.bullets && block.bullets.length > 0 && (
            <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
              {block.bullets.map((b) => (
                <li key={b} style={{ marginBottom: 4 }}>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#444" }}>
        Full policies also live at{" "}
        <a href="/legal" style={{ color: "#0066aa" }}>
          zaylist.com/legal
        </a>
        . Version {COMMUNITY_STANDARDS_VERSION}.
      </p>
    </div>
  );
}

/**
 * Sitewide Community Standards + legal agreement gate.
 * - Guests: localStorage version stamp
 * - Members: server communityStandardsVersion / agreedAt
 * Agree → continue. Decline → Portland-area drug/public health support site.
 */
export default function CommunityStandardsGate() {
  const { user, loading, refreshUser, logout } = useAuth();
  const [guestOk, setGuestOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!COMMUNITY_STANDARDS_GATE_ENABLED) return;
    try {
      const v = localStorage.getItem(GUEST_STANDARDS_STORAGE_KEY);
      setGuestOk(v === COMMUNITY_STANDARDS_VERSION);
    } catch {
      setGuestOk(false);
    }
  }, []);

  const markGuestAgree = useCallback(() => {
    try {
      localStorage.setItem(GUEST_STANDARDS_STORAGE_KEY, COMMUNITY_STANDARDS_VERSION);
    } catch {
      /* ignore */
    }
    setGuestOk(true);
  }, []);

  const onAgree = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      if (user) {
        const res = await fetch("/api/auth/community-standards/agree", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: COMMUNITY_STANDARDS_VERSION }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not save agreement");
        }
        await refreshUser();
        markGuestAgree();
      } else {
        markGuestAgree();
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }, [user, refreshUser, markGuestAgree]);

  const onDecline = useCallback(async () => {
    setBusy(true);
    try {
      if (user) {
        await fetch("/api/auth/community-standards/decline", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ version: COMMUNITY_STANDARDS_VERSION }),
        }).catch(() => {});
        await logout().catch(() => {});
      }
    } finally {
      window.location.assign(COMMUNITY_STANDARDS_DECLINE_URL);
    }
  }, [user, logout]);

  // Feature flag off: never show the full-screen agreement modal.
  if (!COMMUNITY_STANDARDS_GATE_ENABLED) return null;

  const needsGate = (() => {
    if (loading) return false;
    if (user) return !userHasCurrentCommunityStandards(user);
    return !guestOk;
  })();

  if (!needsGate) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cs-gate-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          color: "#000",
          border: "3px solid #000",
          boxShadow: "8px 8px 0 #19e3ff",
          padding: "22px 20px 18px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-mono, ui-monospace, monospace)",
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            Updated {COMMUNITY_STANDARDS_VERSION} · Required to use the site
          </p>
          <h2
            id="cs-gate-title"
            style={{
              margin: "6px 0 0",
              fontFamily: "var(--font-display, sans-serif)",
              fontWeight: 900,
              fontSize: "1.45rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}
          >
            Community Standards & legal
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "#333", lineHeight: 1.45 }}>
            Zaylist updated its Community Standards. Please read and agree to continue.
            If you do not agree, we will send you to Portland-area drug and public health support
            resources.
          </p>
        </div>

        <StandardsScroll blocks={[...COMMUNITY_STANDARDS_BLOCKS, ...LEGAL_SUMMARY_BLOCKS]} />

        {error ? (
          <div
            style={{
              padding: "8px 12px",
              background: "#FF0040",
              color: "#fff",
              fontSize: "0.85rem",
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAgree()}
            style={{
              flex: "1 1 160px",
              padding: "14px 16px",
              background: "#C8FA3C",
              color: "#000",
              border: "2px solid #000",
              fontFamily: "var(--font-display, sans-serif)",
              fontWeight: 900,
              fontSize: "0.95rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: busy ? "wait" : "pointer",
              boxShadow: "3px 3px 0 #000",
            }}
          >
            {busy ? "Saving…" : "I agree · continue"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDecline()}
            style={{
              flex: "1 1 140px",
              padding: "14px 16px",
              background: "#111",
              color: "#fff",
              border: "2px solid #000",
              fontFamily: "var(--font-display, sans-serif)",
              fontWeight: 900,
              fontSize: "0.85rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            I do not agree
          </button>
        </div>
      </div>
    </div>
  );
}

/** Shared scroll + checkbox for AuthModal join form. */
export function CommunityStandardsSignupBlock({
  agreed,
  onAgreedChange,
}: {
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-display, sans-serif)",
          fontWeight: 900,
          fontSize: "0.72rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: 6,
          color: "#000",
        }}
      >
        Community Standards & legal
      </label>
      <StandardsScroll blocks={[...COMMUNITY_STANDARDS_BLOCKS, ...LEGAL_SUMMARY_BLOCKS]} />
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginTop: 12,
          cursor: "pointer",
          fontSize: "0.88rem",
          lineHeight: 1.4,
          color: "#111",
        }}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          required
          style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0 }}
        />
        <span>
          I agree to the Community Standards, Terms of use, and Privacy policy (required to join).
        </span>
      </label>
    </div>
  );
}
