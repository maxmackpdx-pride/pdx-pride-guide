import type { ReactNode } from "react";

type BoardHeroProps = {
  /** Usually a mono strapline. A detail page can pass a breadcrumb node instead. */
  kicker: ReactNode;
  title: ReactNode;
  lede: string;
  actions?: ReactNode;
  /** lime | cyan | magenta | purple | orange | green */
  accent?: "lime" | "cyan" | "magenta" | "purple" | "orange" | "green";
  className?: string;
};

type RainbowHeroWordProps = {
  children: string;
  className?: string;
};

/** The canonical animated outline used for emphasized first-panel hero words. */
export function RainbowHeroWord({
  children,
  className = "",
}: RainbowHeroWordProps) {
  return (
    <span
      className={`board-hero__title-accent ${className}`.trim()}
      data-text={children}
    >
      {children}
    </span>
  );
}

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
