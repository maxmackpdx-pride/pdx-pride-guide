import { useState } from "react";
import { Heart } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useHeart, type HeartKind, type HeartSnapshot } from "@/hooks/useHearts";
import "./HeartButton.css";

/**
 * The heart on events, Placez, Needz and Outzide places. It follows the card's updates and pins the
 * card on the member's Stacks board. Signed-out taps ask the page to open sign in.
 */
export default function HeartButton({ kind, refId, snapshot, onRequireAuth, className = "", label }: {
  kind: HeartKind; refId: string | number; snapshot: HeartSnapshot; onRequireAuth?: () => void; className?: string; label?: string;
}) {
  const { hearted, signedIn, pending, toggle } = useHeart(kind, String(refId), snapshot);
  const [auth, setAuth] = useState(false);
  const name = label || snapshot.title;
  return (
    <>
    <button
      type="button"
      className={`zheart-btn${hearted ? " is-hearted" : ""} ${className}`.trim()}
      aria-pressed={hearted}
      aria-label={hearted ? `Remove heart from ${name}` : `Heart ${name}: follow it and pin it to your Stacks`}
      title={hearted ? "Hearted: following and pinned to your Stacks" : "Heart: follow and pin to your Stacks"}
      disabled={pending}
      onClick={event => { event.stopPropagation(); event.preventDefault(); signedIn ? toggle() : onRequireAuth ? onRequireAuth() : setAuth(true); }}
    >
      <Heart size={18} aria-hidden="true" fill={hearted ? "currentColor" : "none"} />
    </button>
    {auth && <AuthModal onClose={() => setAuth(false)} />}
    </>
  );
}
