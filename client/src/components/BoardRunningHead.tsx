import { Link } from "wouter";

export type BoardKey = "spotted" | "gifting" | "gigs";

const LINKS: Array<{ key: BoardKey; href: string; label: string }> = [
  { key: "spotted", href: "/spotted", label: "Spotted" },
  { key: "gifting", href: "/gifting", label: "Gifting" },
  { key: "gigs", href: "/pride-work", label: "Gigs" },
];

const ACCENT: Record<BoardKey, string> = {
  spotted: "magenta",
  gifting: "lime",
  gigs: "purple",
};

export default function BoardRunningHead({ active }: { active: BoardKey }) {
  return (
    <div className={`board-running board-running--${ACCENT[active]}`}>
      <div className="board-running__inner">
        <div className="board-running__live">
          <span className="board-running__dot" aria-hidden="true" />
          The Community Boards
        </div>
        <nav className="board-running__nav" aria-label="Community boards">
          {LINKS.map(link =>
            link.key === active ? (
              <span key={link.key} className="board-running__link is-active" aria-current="page">
                {link.label}
              </span>
            ) : (
              <Link key={link.key} href={link.href} className="board-running__link">
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
