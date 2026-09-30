import "./DemoTag.css";

/**
 * Board 18: one demo tag for surfaces outside the cards (sheets, map rows, Hub feed).
 * Cards keep their own DEMO stickers. Whether something is a demo comes from the
 * record (isDemo, marked by the server), never from a username check.
 */
export function DemoTag({ className = "" }: { className?: string }) {
  return <span className={`kick demo-tag ${className}`.trim()} aria-label="Demo listing">DEMO</span>;
}
