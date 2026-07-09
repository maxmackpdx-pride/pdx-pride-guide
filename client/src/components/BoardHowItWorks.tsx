import type { ReactNode } from "react";

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
  return (
    <section
      id={id}
      className={`board-how board-how--inline board-how--makeover diag ${className}`.trim()}
    >
      <div>
        <div className={`board-section-kicker board-section-kicker--${kickerTone}`}>{kicker}</div>
        <h2 className="display section-heading board-how__title">{title}</h2>
        <p className="board-copy">{lede}</p>
      </div>
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
    </section>
  );
}
