import type { ReactNode } from "react";

type BoardActiveSectionProps = {
  sticker: string;
  stickerTone?: "lime" | "cyan" | "magenta";
  title: string;
  filters?: ReactNode;
  filterRow2?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function BoardActiveSection({
  sticker,
  stickerTone = "lime",
  title,
  filters,
  filterRow2,
  children,
  className = "",
}: BoardActiveSectionProps) {
  return (
    <section className={`board-active-feed diag ${className}`.trim()}>
      <div className="board-active-feed__inner">
        <div className="board-active-feed__head">
          <span className={`board-sticker board-sticker--${stickerTone}`}>{sticker}</span>
          <h2 className="display section-heading board-active-feed__title">{title}</h2>
        </div>
        <div className="board-active-feed__controls">
          {filters && <div className="board-filter-row">{filters}</div>}
          {filterRow2 && <div className="board-filter-row board-filter-row--secondary">{filterRow2}</div>}
        </div>
        <div className="board-active-feed__body">{children}</div>
      </div>
    </section>
  );
}

export function BoardFilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`board-filter-chip${active ? " active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function BoardSelectField({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`board-select-wrap ${className}`.trim()}>
      <select className="board-select" value={value} onChange={e => onChange(e.target.value)}>
        {children}
      </select>
      <span className="board-select-caret" aria-hidden="true">▼</span>
    </div>
  );
}

export function BoardTextField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      className={`board-text-field ${className}`.trim()}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}