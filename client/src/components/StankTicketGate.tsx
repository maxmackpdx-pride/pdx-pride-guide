import { useCallback } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";

/** Only shown when arriving from the direct Stank secret-story close path. */
export const STANK_TICKET_URL = "https://members.pdxsanctuary.com/events/93071";

type Props = {
  /** Primary: continue into Zaylist signup (Join). */
  onContinue: () => void;
  /** Optional dismiss without signup. */
  onClose?: () => void;
};

/**
 * Interstitial after direct secret-story exit: push Yes Coach tickets via
 * Zaylist signup, with a small escape hatch to the venue ticket page.
 */
export default function StankTicketGate({ onContinue, onClose }: Props) {
  const handleClose = useCallback(() => {
    (onClose ?? onContinue)();
  }, [onClose, onContinue]);
  const dialogRef = useModalA11y({ onClose: handleClose });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
      onClick={handleClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stank-ticket-gate-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#050a05",
          color: "#5bff5b",
          border: "3px solid #5bff5b",
          boxShadow: "0 0 40px rgba(91,255,91,0.35), 6px 6px 0 #1a3d1a",
          width: "100%",
          maxWidth: 440,
          padding: "32px 28px 24px",
          position: "relative",
          textAlign: "center",
        }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 10,
              right: 14,
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "#5bff5b",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        )}

        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#33ff33",
            marginBottom: 14,
          }}
        >
          Stank · Yes Coach
        </div>

        <h2
          id="stank-ticket-gate-title"
          style={{
            margin: 0,
            fontFamily: "var(--font-display, system-ui)",
            fontWeight: 900,
            fontSize: "clamp(1.15rem, 4.2vw, 1.45rem)",
            lineHeight: 1.25,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "#5bff5b",
            textShadow: "0 0 18px rgba(91,255,91,0.45)",
          }}
        >
          Get your Yes Coach tickets before they are gone - through Zaylist
        </h2>

        <p
          style={{
            margin: "16px 0 0",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 13,
            lineHeight: 1.45,
            color: "rgba(91,255,91,0.75)",
          }}
        >
          Join free to grab tickets in the Guide and stay in the loop for Pride.
        </p>

        <button
          type="button"
          onClick={onContinue}
          style={{
            marginTop: 24,
            width: "100%",
            border: "3px solid #5bff5b",
            background: "#5bff5b",
            color: "#050a05",
            fontFamily: "var(--font-display, system-ui)",
            fontWeight: 900,
            fontSize: "1.05rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "14px 18px",
            cursor: "pointer",
            boxShadow: "0 0 24px rgba(91,255,91,0.4)",
          }}
        >
          Continue
        </button>

        <a
          href={STANK_TICKET_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 16,
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.06em",
            color: "rgba(91,255,91,0.65)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Direct Ticket link
        </a>
      </div>
    </div>
  );
}
