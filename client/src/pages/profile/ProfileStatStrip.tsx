import type { MemberProfileData } from "./types";

export default function ProfileStatStrip({ data, accent }: { data: MemberProfileData; accent: string }) {
  const isPromoter = !!data.showPromoterVariant;
  const stats = data.stats ?? { events: 0, hosting: 0, going: 0, posts: 0, gigs: 0, gifting: 0, checkIns: 0, followers: 0 };
  const memberYear = data.memberSince && !Number.isNaN(new Date(data.memberSince).getTime())
    ? new Date(data.memberSince).getFullYear()
    : null;

  const roleStats = isPromoter
    ? [
        { num: String(stats.hosting), label: "Hosting" },
        { num: `${stats.events}+`, label: "Shows" },
        { num: memberYear ? String(memberYear) : "-", label: "Est." },
      ]
    : [
        { num: String(stats.going), label: "Going" },
        { num: String(stats.checkIns), label: "Check-ins" },
        { num: String(stats.posts), label: "Posts" },
      ];

  return (
    <div className="mp-stat-strip">
      <div className="mp-stat-strip__item">
        <span className="mp-stat-strip__num" style={{ color: accent }}>{stats.followers.toLocaleString()}</span>
        <span className="mp-stat-strip__label">Followers</span>
      </div>
      {roleStats.map(s => (
        <div key={s.label} className="mp-stat-strip__item">
          <span className="mp-stat-strip__divider" aria-hidden="true" />
          <span className="mp-stat-strip__num">{s.num}</span>
          <span className="mp-stat-strip__label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
