import ActionRow, { type ActionRowBadge } from "./ActionRow";
import "./PromoterIntake.css";

export type PromoterIntakeActionKey = "submit" | "claim" | "suggest" | "apply";

export type PromoterIntakeAction = {
  key: PromoterIntakeActionKey;
  title: string;
  forWho: string;
  outcome: string;
  accent: string;
  badge: ActionRowBadge;
};

export type PromoterIntakeProps = {
  /** Verified promoter / admin - shows neutral verified banner */
  isVerified: boolean;
  /** Path rows (Submit / Claim / Spotted [+ Apply]). Order preserved. */
  actions: PromoterIntakeAction[];
  onSelect: (key: PromoterIntakeActionKey) => void;
  className?: string;
  /** Section heading visibility (default true for Card System parity) */
  showSectionHead?: boolean;
};

const VERIFIED_COPY =
  "You are verified. Everything you submit or claim goes live the moment you hit send. No review queue.";

/**
 * Promoter intake surface (deep-glass).
 * SoT: docs/handoffs/deep-glass-2026-07-16 §2.10 · 11-promoter-intake.png
 *
 * - Verified banner: neutral glass card, lime label + dot, no green fill/glow
 * - Action rows: glass-card per accent (Submit=lime, Claim=cyan, Spotted=magenta)
 *   with project-row edge (sheen + refract seam), number, outlined/solid status badge
 */
export default function PromoterIntake({
  isVerified,
  actions,
  onSelect,
  className = "",
  showSectionHead = true,
}: PromoterIntakeProps) {
  return (
    <section
      className={`pi-intake ${className}`.trim()}
      aria-label="Promoter intake"
      data-testid="promoter-intake"
    >
      {showSectionHead && (
        <header className="pi-intake__head">
          <div className="pi-intake__kicker">
            <span className="pi-intake__kicker-dot" aria-hidden="true" />
            <span className="pi-intake__kicker-label">
              Promoter
              <br />
              Intake
            </span>
          </div>
          <div className="pi-intake__meta" aria-hidden="true">
            // Submit · Claim · Spotted
          </div>
        </header>
      )}

      {isVerified && (
        <div
          className="pi-verified"
          data-testid="promoter-verified-banner"
        >
          <div className="pi-verified__inner">
            <span className="pi-verified__dot" aria-hidden="true" />
            <div>
              <div className="pi-verified__title">Verified promoter</div>
              <p className="pi-verified__body">{VERIFIED_COPY}</p>
            </div>
          </div>
        </div>
      )}

      <div className="pi-paths">
        <div className="pi-paths__kicker">Pick one</div>
        <h2 className="pi-paths__title">What are you here to do?</h2>
        <div className="pi-paths__list" role="list">
          {actions.map((action, i) => (
            <ActionRow
              key={action.key}
              number={String(i + 1).padStart(2, "0")}
              title={action.title}
              forWho={action.forWho}
              outcome={action.outcome}
              accent={action.accent}
              badge={action.badge}
              onClick={() => onSelect(action.key)}
              testId={`promoter-action-${action.key}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
