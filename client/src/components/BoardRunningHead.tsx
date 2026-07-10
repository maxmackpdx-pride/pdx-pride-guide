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

export function BoardCommunityNav({ active }: { active: BoardKey }) {
  return (
    <nav
      className={`events-tab-bar community-board-tab-bar community-board-tab-bar--${ACCENT[active]}`}
      aria-label="Community boards"
    >
      {LINKS.map(link =>
        link.key === active ? (
          <span key={link.key} className="events-tab active" aria-current="page">
            {link.label}
          </span>
        ) : (
          <Link key={link.key} href={link.href} className="events-tab">
            {link.label}
          </Link>
        ),
      )}
    </nav>
  );
}