import type { ProfileTabId } from "./types";

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: "events", label: "Events" },
  { id: "media", label: "Media" },
  { id: "board", label: "Board" },
  { id: "about", label: "About" },
];

export default function ProfileTabs({
  active,
  onChange,
}: {
  active: ProfileTabId;
  onChange: (tab: ProfileTabId) => void;
}) {
  return (
    <nav className="profile-tabs" aria-label="Profile sections">
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          className={`profile-tabs__btn${active === t.id ? " is-active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
