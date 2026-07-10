import type { ProfileTabId } from "./types";

const TABS: Array<{ id: ProfileTabId; label: string }> = [
  { id: "events", label: "Events" },
  { id: "media", label: "Media" },
  { id: "board", label: "Board" },
  { id: "about", label: "About" },
];

type Props = {
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
};

export default function ProfileTabs({ active, onChange }: Props) {
  return (
    <nav className="pp-tabs" aria-label="Profile sections">
      <div className="pp-tabs__inner">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`pp-tab display${active === t.id ? " is-active" : ""}`}
            onClick={() => onChange(t.id)}
            data-testid={`profile-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}