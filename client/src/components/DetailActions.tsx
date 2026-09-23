import type { ReactNode } from "react";
import { Button, IconButton } from "@/components/ds";
import { X, Share2 } from "lucide-react";
import "./BrowseContinuity.css";
/** One action order and touch target across desktop dialogs and mobile details. */
export default function DetailActions({ onClose, onShare, sharing = false, label, children }: {
  onClose: () => void; onShare?: () => void; sharing?: boolean; label: string; children?: ReactNode;
}) {
  return <div className="detail-actions">
    {children}
    {onShare && <Button variant="neon" accent="cyan" type="button" onClick={onShare} disabled={sharing} aria-label={`Share ${label}`}><Share2 size={18} aria-hidden="true" /><span>{sharing ? "Sharing…" : "Share"}</span></Button>}
    <IconButton type="button" className="detail-actions__close" onClick={onClose} label={`Close ${label}`} variant="outline" size="md"><X size={20} aria-hidden="true" /></IconButton>
  </div>;
}
