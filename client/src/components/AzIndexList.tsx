import { Link } from "wouter";
import "./AzIndexList.css";

/**
 * One long A–Z plain-text index: letter jump links up top, small print,
 * multiple columns, no cards. Shared by the master directory index
 * (/directory/a-z) and the OutZide locations index (/outzide/a-z).
 * An entry with no page yet carries href: null and renders as plain text —
 * never a dead link.
 */
export type AzEntry = {
  name: string;
  href: string | null;
  /** Small-print tags after the name, rendered in parentheses. */
  tags: string[];
};

export type AzGroup = { letter: string; entries: AzEntry[] };

/** Sort key: alphabetical, ignoring a leading "The ". */
function azSortKey(name: string): string {
  return name.replace(/^the\s+/i, "");
}

export function azLetter(name: string): string {
  const c = azSortKey(name).charAt(0).toUpperCase();
  return c >= "A" && c <= "Z" ? c : "#";
}

export function groupAzEntries(entries: AzEntry[]): AzGroup[] {
  const sorted = [...entries].sort((a, b) =>
    azSortKey(a.name).localeCompare(azSortKey(b.name), undefined, { sensitivity: "base" }),
  );
  const byLetter = new Map<string, AzEntry[]>();
  for (const entry of sorted) {
    const letter = azLetter(entry.name);
    const list = byLetter.get(letter) ?? [];
    list.push(entry);
    byLetter.set(letter, list);
  }
  const order = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  return order
    .filter((letter) => byLetter.has(letter))
    .map((letter) => ({ letter, entries: byLetter.get(letter)! }));
}

const JUMP_LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

function anchorId(letter: string): string {
  return letter === "#" ? "az-other" : `az-${letter.toLowerCase()}`;
}

export default function AzIndexList({ groups, label }: { groups: AzGroup[]; label: string }) {
  const present = new Set(groups.map((g) => g.letter));
  return (
    <div className="az-index">
      <nav className="az-jump" aria-label={`${label} by letter`}>
        {present.has("#") ? (
          <a href={`#${anchorId("#")}`}>#</a>
        ) : (
          <span className="az-jump-off">#</span>
        )}
        {JUMP_LETTERS.map((letter) =>
          present.has(letter) ? (
            <a key={letter} href={`#${anchorId(letter)}`}>
              {letter}
            </a>
          ) : (
            <span key={letter} className="az-jump-off">
              {letter}
            </span>
          ),
        )}
      </nav>
      {groups.map((group) => (
        <section key={group.letter} className="az-section" aria-label={`${label} — ${group.letter}`}>
          <h2 className="az-letter" id={anchorId(group.letter)}>
            {group.letter}
          </h2>
          <ul className="az-cols">
            {group.entries.map((entry, i) => (
              <li key={`${entry.name}-${i}`} className="az-entry">
                {entry.href ? <Link href={entry.href}>{entry.name}</Link> : <span>{entry.name}</span>}
                {entry.tags.map((tag) => (
                  <span key={tag} className="az-tag">
                    ({tag})
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
