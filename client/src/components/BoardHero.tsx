import type { ReactNode } from "react";

type BoardHeroProps = {
  kicker: string;
  title: ReactNode;
  lede: string;
  actions?: ReactNode;
  /** lime | cyan | magenta | purple */
  accent?: "lime" | "cyan" | "magenta" | "purple";
  className?: string;
};

export default function BoardHero({
  kicker,
  title,
  lede,
  actions,
  accent = "lime",
  className = "",
}: BoardHeroProps) {
  return (
    <header className={`board-hero board-hero--${accent} ${className}`.trim()}>
      <div className="board-hero__inner">
        <p className="board-hero__kicker">{kicker}</p>
        <h1 className="board-hero__title">{title}</h1>
        <p className="board-hero__lede">{lede}</p>
        {actions && <div className="board-hero__actions">{actions}</div>}
      </div>
    </header>
  );
}
