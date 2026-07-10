import type { PublicProfile } from "./types";

export default function ProfileStatStrip({ profile }: { profile: PublicProfile }) {
  const isPromoter = !!(profile.isPromoter || profile.verifiedHost);
  const s = profile.stats || {};

  const items = isPromoter
    ? [
        { num: s.followers ?? 0, label: "Followers" },
        { num: s.hosting ?? s.events ?? 0, label: "Hosting" },
        { num: s.shows ?? 0, label: "Shows" },
        { num: s.estYear ?? "—", label: "Est." },
      ]
    : [
        { num: s.followers ?? 0, label: "Followers" },
        { num: s.going ?? 0, label: "Going" },
        { num: s.checkIns ?? 0, label: "Check-ins" },
        { num: s.gifting ?? 0, label: "Gifting" },
      ];

  return (
    <div className="profile-stats" aria-label="Profile stats">
      {items.map(it => (
        <div key={it.label} className="profile-stats__item">
          <div className="profile-stats__num">{it.num}</div>
          <div className="profile-stats__label">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
