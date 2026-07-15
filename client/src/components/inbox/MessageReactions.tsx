import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  MESSAGE_REACTIONS,
  MESSAGE_REACTION_BY_CODE,
  type MessageReactionCode,
  type MessageReactionSummary,
  isMessageReactionCode,
} from "@shared/messageReactions";

const LONG_PRESS_MS = 420;

function normalize(
  list: Array<{ code: string; count: number; mine: boolean }> | MessageReactionSummary[] | undefined,
): MessageReactionSummary[] {
  if (!list?.length) return [];
  return list
    .filter((r) => isMessageReactionCode(r.code) && r.count > 0)
    .map((r) => ({
      code: r.code as MessageReactionCode,
      count: Number(r.count) || 0,
      mine: Boolean(r.mine),
    }));
}

function ReactionTray({
  chips,
  pending,
  onPick,
}: {
  chips: MessageReactionSummary[];
  pending: boolean;
  onPick: (code: MessageReactionCode) => void;
}) {
  return (
    <div className="msg-rxn__tray" role="toolbar" aria-label="React to message">
      {MESSAGE_REACTIONS.map((r) => {
        const active = chips.some((c) => c.code === r.code && c.mine);
        return (
          <button
            key={r.code}
            type="button"
            className={`msg-rxn__opt${active ? " is-mine" : ""}${r.code === "gay" ? " msg-rxn__opt--gay" : ""}`}
            aria-label={r.aria}
            aria-pressed={active}
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              onPick(r.code);
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

function ReactionChips({
  chips,
  disabled,
  pending,
  onPick,
}: {
  chips: MessageReactionSummary[];
  disabled?: boolean;
  pending: boolean;
  onPick: (code: MessageReactionCode) => void;
}) {
  if (!chips.length) return null;
  return (
    <div className="msg-rxn__chips" aria-label="Reactions">
      {chips.map((c) => {
        const def = MESSAGE_REACTION_BY_CODE[c.code];
        return (
          <button
            key={c.code}
            type="button"
            className={`msg-rxn__chip${c.mine ? " is-mine" : ""}${c.code === "gay" ? " msg-rxn__chip--gay" : ""}`}
            aria-label={`${def?.aria || c.code}${c.count > 1 ? `, ${c.count}` : ""}${c.mine ? ", yours" : ""}`}
            aria-pressed={c.mine}
            disabled={disabled || pending}
            onClick={(e) => {
              e.stopPropagation();
              onPick(c.code);
            }}
          >
            <span className="msg-rxn__chip-label">{def?.label || c.code}</span>
            {c.count > 1 ? <span className="msg-rxn__chip-n">{c.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

type LongPressState = {
  open: boolean;
  pending: boolean;
  bind: {
    onPointerDown: (e: ReactPointerEvent) => void;
    onPointerMove: (e: ReactPointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onPointerLeave: () => void;
    onContextMenu: (e: ReactMouseEvent) => void;
  };
  tray: ReactNode;
  chips: ReactNode;
  wrapRef: React.RefObject<HTMLDivElement>;
};

function useLongPressReactions({
  reactions,
  disabled,
  onToggle,
}: {
  reactions?: Array<{ code: string; count: number; mine: boolean }>;
  disabled?: boolean;
  onToggle: (code: MessageReactionCode) => void | Promise<void>;
}): LongPressState {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null!);
  const chipsList = normalize(reactions);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      const el = wrapRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startPress = (x: number, y: number) => {
    if (disabled || pending) return;
    pressOrigin.current = { x, y };
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setOpen(true);
      try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(12);
        }
      } catch {
        /* ignore */
      }
    }, LONG_PRESS_MS);
  };

  const movePress = (x: number, y: number) => {
    const o = pressOrigin.current;
    if (!o || timerRef.current == null) return;
    if (Math.hypot(x - o.x, y - o.y) > 12) clearTimer();
  };

  const endPress = () => {
    clearTimer();
    pressOrigin.current = null;
  };

  const handleToggle = async (code: MessageReactionCode) => {
    if (disabled || pending) return;
    setPending(true);
    try {
      await onToggle(code);
    } finally {
      setPending(false);
      setOpen(false);
    }
  };

  return {
    open,
    pending,
    wrapRef,
    bind: {
      onPointerDown: (e: ReactPointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        if (e.target instanceof Element && e.target.closest("button.msg-rxn__opt, button.msg-rxn__chip")) {
          return;
        }
        startPress(e.clientX, e.clientY);
      },
      onPointerMove: (e: ReactPointerEvent) => movePress(e.clientX, e.clientY),
      onPointerUp: endPress,
      onPointerCancel: endPress,
      onPointerLeave: endPress,
      onContextMenu: (e: ReactMouseEvent) => {
        e.preventDefault();
        if (!disabled) setOpen(true);
      },
    },
    tray: open ? (
      <ReactionTray chips={chipsList} pending={pending} onPick={(c) => void handleToggle(c)} />
    ) : null,
    chips: (
      <ReactionChips
        chips={chipsList}
        disabled={disabled}
        pending={pending}
        onPick={(c) => void handleToggle(c)}
      />
    ),
  };
}

/**
 * Wrap any bubble markup so long-press / right-click opens the reaction tray.
 */
export function LongPressReactable({
  messageId,
  self,
  reactions,
  disabled,
  onToggle,
  children,
  className,
}: {
  messageId: string | number;
  self?: boolean;
  reactions?: Array<{ code: string; count: number; mine: boolean }>;
  disabled?: boolean;
  onToggle: (code: MessageReactionCode) => void | Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const rxn = useLongPressReactions({ reactions, disabled, onToggle });
  return (
    <div
      ref={rxn.wrapRef}
      className={`msg-rxn-wrap${self ? " msg-rxn-wrap--self" : " msg-rxn-wrap--other"}${className ? ` ${className}` : ""}`}
      data-message-id={messageId}
      {...rxn.bind}
    >
      {rxn.tray}
      {children}
      {rxn.chips}
    </div>
  );
}

/**
 * Inbox overlay bubble with long-press reactions (👍 👎 😂 😢 ❤️ 💔 GAY!).
 * Social posts keep separate ♥ / 💬 engagement.
 */
export function MessageBubbleWithReactions({
  messageId,
  body,
  self,
  reactions,
  disabled,
  onToggle,
  timeLabel,
}: {
  messageId: string | number;
  body: string;
  self: boolean;
  reactions?: Array<{ code: string; count: number; mine: boolean }>;
  disabled?: boolean;
  onToggle: (code: MessageReactionCode) => void | Promise<void>;
  timeLabel?: string;
}) {
  const rxn = useLongPressReactions({ reactions, disabled, onToggle });
  return (
    <div
      ref={rxn.wrapRef}
      className={`inbox-exp-bubble-wrap msg-rxn-wrap${self ? " inbox-exp-bubble-wrap--self" : " inbox-exp-bubble-wrap--other"}`}
      data-message-id={messageId}
    >
      {rxn.tray}
      <div
        className={`inbox-exp-bubble${self ? " inbox-exp-bubble--self" : " inbox-exp-bubble--other"}${rxn.open ? " is-reacting" : ""}`}
        {...rxn.bind}
      >
        {body}
      </div>
      {rxn.chips}
      {timeLabel ? <div className="inbox-exp-bubble__time">{timeLabel}</div> : null}
    </div>
  );
}
