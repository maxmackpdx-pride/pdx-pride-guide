import type { ProfileTabKey } from "./types";

const TAB_DEFS: { key: ProfileTabKey; label: string }[] = [
  { key: "events", label: "Events" },
  { key: "media", label: "Media" },
  { key: "board", label: "Board" },
  { key: "about", label: "About" },
];

export default function ProfileTabs({
  active,
  onChange,
}: {
  active: ProfileTabKey;
  onChange: (tab: ProfileTabKey) => void;
}) {
  return (
    <div className="mp-tabbar">
      <div className="mp-tabbar__inner">
        {TAB_DEFS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`mp-tabbtn${active === t.key ? " mp-tabbtn--active" : ""}`}
            onClick={() => onChange(t.key)}
            data-testid={`profile-tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
