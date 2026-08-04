import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type BoardStep = {
  title: string;
  body: string;
  color: string;
};

type BoardHowItWorksProps = {
  kicker?: string;
  kickerTone?: "lime" | "cyan" | "magenta" | "purple";
  title: ReactNode;
  lede: string;
  steps: BoardStep[];
  footerLine?: string;
  beforeSteps?: ReactNode;
  id?: string;
  className?: string;
};

export default function BoardHowItWorks({
  kicker = "How it works",
  kickerTone = "cyan",
  title,
  lede,
  steps,
  footerLine,
  beforeSteps,
  id = "how-it-works",
  className = "",
}: BoardHowItWorksProps) {
  const routeKey = typeof window === "undefined" ? "board" : window.location.pathname;
  const storageKey = `zaylist:board-guide-seen:${routeKey}:${id}`;
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(storageKey) !== "1";
  });

  useEffect(() => {
    if (expanded) window.localStorage.setItem(storageKey, "1");
  }, [expanded, storageKey]);

  return (
    <section
      id={id}
      className={`board-how board-how--inline board-how--makeover diag board-how--disclosure${expanded ? " is-expanded" : " is-compact"} ${className}`.trim()}
    >
      <div className="board-how__intro">
        <div className={`board-section-kicker board-section-kicker--${kickerTone}`}>{kicker}</div>
        <h2 className="display section-heading board-how__title">{title}</h2>
        {expanded && <p className="board-copy">{lede}</p>}
        <button
          type="button"
          className="board-how__toggle pdx-glass-btn"
          aria-expanded={expanded}
          aria-controls={`${id}-details`}
          onClick={() => setExpanded(value => !value)}
        >
          {expanded ? "Hide guide" : "How this board works"}
          <ChevronDown size={17} aria-hidden="true" />
        </button>
      </div>
      {expanded && (
        <div id={`${id}-details`} className="board-how__details">
          {beforeSteps}
          <div className="board-steps board-steps--makeover">
            {steps.map((step, i) => (
              <article className="board-step board-step--makeover" key={step.title}>
                <span className="board-step__num" style={{ color: step.color }} aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="display panel-heading">{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          {footerLine && <div className="board-how__footer-line">{footerLine}</div>}
        </div>
      )}
    </section>
  );
}
