import { useContext, type ReactNode } from "react";
import { Link } from "wouter";
import { Button, IconButton } from "@/components/ds";
import { X, Share2 } from "lucide-react";
import { DetailRoomLinkContext } from "./DetailRoomLink";
import "./BrowseContinuity.css";
/** One action order and touch target across desktop dialogs and mobile details. */
export default function DetailActions({ onClose, onShare, sharing = false, label, children }: {
  onClose: () => void; onShare?: () => void; sharing?: boolean; label: string; children?: ReactNode;
}) {
  const roomLink = useContext(DetailRoomLinkContext);
  return <div className="detail-actions">
    {roomLink && <Link href={roomLink.href} className="detail-actions__room">OPEN IN {roomLink.room}</Link>}
    {children}
    {onShare && <Button variant="neon" accent="cyan" type="button" onClick={onShare} disabled={sharing} aria-label={`Share ${label}`}><Share2 size={18} aria-hidden="true" /><span>{sharing ? "Sharing…" : "Share"}</span></Button>}
    <IconButton type="button" className="detail-actions__close" onClick={onClose} label={`Close ${label}`} variant="outline" size="md"><X size={20} aria-hidden="true" /></IconButton>
  </div>;
}
