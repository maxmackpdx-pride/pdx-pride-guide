import type { PublicProfileData } from "./types";

type Props = { data: PublicProfileData };

export default function ProfileStatStrip({ data }: Props) {
  const stats = data.stats || {};
  const isPromoter = !!data.isPromoter;
  const followers = stats.followers ?? 0;

  const roleStats = isPromoter
    ? [
        { num: String(stats.hosting ?? 0), label: "Hosting" },
        { num: String(stats.shows ?? 0), label: "Shows" },
        { num: stats.estYear ? String(stats.estYear) : "—", label: "Est." },
      ]
    : [
        { num: String(stats.going ?? 0), label: "Going" },
        { num: String(stats.checkIns ?? 0), label: "Check-ins" },
        { num: String(stats.saved ?? 0), label: "Saved" },
      ];

  return (
    <div className="pp-stats">
      <div className="pp-stats__item">
        <span className="display pp-stats__num pp-stats__num--accent">{followers.toLocaleString("en-US")}</span>
        <span className="display pp-stats__label">Followers</span>
      </div>
      {roleStats.map(s => (
        <div key={s.label} className="pp-stats__group">
          <span className="pp-stats__divider" aria-hidden="true" />
          <div className="pp-stats__item">
            <span className="display pp-stats__num">{s.num}</span>
            <span className="display pp-stats__label">{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}