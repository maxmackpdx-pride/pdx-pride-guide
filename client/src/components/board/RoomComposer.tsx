import { createPortal } from "react-dom";
import { useOpenCardClose } from "@/hooks/useOpenCardClose";
import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";
import { Button, RoomKicker } from "@/components/ds";
import { ROOMS, type RoomKey } from "@/lib/rooms";
import "./RoomComposer.css";

/**
 * Board 17: posting feels the same wherever you post. One sheet with the room rim
 * and 8% bloom, a close button, the room kicker, a title and one intro line. The
 * room keeps its own fields (children), its rules sentence and its verb.
 */
export default function RoomComposer({ id, room, accent, kicker, title, intro, onClose, children, testId }: {
  id: string;
  room: RoomKey;
  /** Overrides the room accent (Gigz tints availability differently from gigs). */
  accent?: string;
  kicker: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
}) {
  const { dialogRef, requestClose } = useOpenCardClose(onClose);
  const color = accent ?? (room === "gigz" ? "var(--room-gigz-ink)" : ROOMS[room].accent);
  return createPortal(<div className="room-composer-backdrop" onClick={requestClose}><section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} onClick={event => event.stopPropagation()} id={id} data-testid={testId} className="gifting-form-panel gifting-form-panel--makeover room-composer pdx-glass-rebind" style={{ "--c": color } as CSSProperties}>
    <button type="button" className="gifting-close" onClick={requestClose} aria-label="Close form"><X size={18} /></button>
    <RoomKicker room={room} accent={accent} as="div">{kicker}</RoomKicker>
    <h2 id={`${id}-title`} className="display section-heading">{title}</h2>
    {intro ? <p className="board-copy-sm">{intro}</p> : null}
    {children}
  </section></div>, document.body);
}

/** The rules line every composer ends with. */
export function ComposerRules({ checked, onChange, children, className = "" }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; className?: string }) {
  return <label className={`gifting-rules ${className}`.trim()}><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />{children}</label>;
}

/** One solid submit in the context primary: acid yellow on boards. */
export function ComposerSubmit({ busy, disabled, onClick, type = "button", testId, children }: { busy: boolean; disabled?: boolean; onClick?: () => void; type?: "button" | "submit"; testId?: string; children: ReactNode }) {
  return <Button type={type} variant="solid" accent="lime" size="lg" arrow data-testid={testId} disabled={busy || disabled} onClick={onClick}>{busy ? "Posting…" : children}</Button>;
}
