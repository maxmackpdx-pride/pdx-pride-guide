import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";

const SEEN_PREFIX = "pgpdx:glow-nudge:v1:";

/** True when the ring is unset / the explicit "none" default. */
function ringMissing(ring?: string | null): boolean {
  return !ring || ring === "none";
}

/** Still on the default avatar: no uploaded photo and the default choice (1). */
function avatarMissing(photoUrl?: string | null, avatarChoice?: number): boolean {
  return !photoUrl && (!avatarChoice || avatarChoice === 1);
}

/**
 * One-time nudge: reminds members who haven't picked a glow ring and/or a
 * non-default avatar that they can show off their pride. A profile photo counts
 * as "has an avatar" — we never ask them to swap it. Shows once per member
 * (localStorage), then never again whether they act on it or dismiss it.
 */
export default function PrideGlowNudge() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const needsRing = user ? ringMissing(user.avatarRing) : false;
  const needsAvatar = user ? avatarMissing(user.photoUrl, user.avatarChoice) : false;

  const seenKey = user ? `${SEEN_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (loading || !user || !seenKey) return;
    if (!needsRing && !needsAvatar) return;
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(seenKey) === "1";
    } catch {
      alreadySeen = false;
    }
    if (alreadySeen) return;
    // Mark seen the moment we decide to show it, so it truly appears only once.
    try {
      localStorage.setItem(seenKey, "1");
    } catch {
      /* ignore */
    }
    // Small delay so it doesn't jar the first paint / stack over the standards gate.
    const t = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(t);
  }, [loading, user, seenKey, needsRing, needsAvatar]);

  // Escape to dismiss.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const body = useMemo(() => {
    if (needsRing && needsAvatar) {
      return "Pick a glow ring and an avatar to show the world you're here for Pride.";
    }
    if (needsRing) {
      return "Wrap your photo in a pride glow ring to show the world you're here for Pride.";
    }
    return "Pick an avatar to show the world you're here for Pride.";
  }, [needsRing, needsAvatar]);

  if (!open || !user) return null;

  const goEdit = () => {
    setOpen(false);
    setLocation("/dashboard?edit=profile");
  };

  return createPortal(
    <div className="glow-nudge__backdrop" role="presentation" onClick={() => setOpen(false)}>
      <div
        className="glow-nudge"
        role="dialog"
        aria-modal="true"
        aria-labelledby="glow-nudge-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="glow-nudge__x" onClick={() => setOpen(false)} aria-label="Close">
          ✕
        </button>

        <div className="glow-nudge__preview" aria-hidden="true">
          <UserAvatar
            photoUrl={user.photoUrl}
            avatarChoice={user.avatarChoice}
            avatarRing="rainbow"
            displayName={user.displayName}
            username={user.username}
            size={112}
          />
        </div>

        <p className="glow-nudge__kicker">Make it yours</p>
        <h2 id="glow-nudge-title" className="glow-nudge__title display">
          Show off your pride
        </h2>
        <p className="glow-nudge__body">{body}</p>

        <div className="glow-nudge__actions">
          <button type="button" className="glow-nudge__cta display" onClick={goEdit}>
            Pick my glow
          </button>
          <button type="button" className="glow-nudge__later" onClick={() => setOpen(false)}>
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
