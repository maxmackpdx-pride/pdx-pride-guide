import { useState } from "react";
import { CardHeartButton } from "./CardHeartButton";
import AuthModal from "@/components/AuthModal";
import { heartLabel, useHeart, type HeartKind, type HeartSnapshot } from "@/hooks/useHearts";
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
    <CardHeartButton active={hearted}
      className={className}
      aria-label={heartLabel(name, hearted).label}
      title={heartLabel(name, hearted).title}
      data-action="heart"
      disabled={pending}
      onClick={event => { event.stopPropagation(); event.preventDefault(); signedIn ? toggle() : onRequireAuth ? onRequireAuth() : setAuth(true); }}
    />
    {auth && <AuthModal onClose={() => setAuth(false)} />}
    </>
  );
}
