/* ProfileScreen, the public member profile (/u/:username).
   Mirrors client/src/pages/MemberProfile.tsx + components/profile/* on master:
   hero → stat strip (Followers · Hosting · Attended · Going) →
   hosting panel (Up Next / Past Events) → split (Top 8 + The Big One | Going + Updates)
   → flyer stash → close seam. */
const { Avatar: PPAvatar, Button: PPBtn, Divider: PPDivider } = window.PDXPrideGuideDesignSystem_b20420;

const PP_MEMBER = {
  displayName: "Tucker Casey",
  username: "tucker_pdmax",
  accent: "#FF00CC",
  pronouns: "he/him",
  /* buildMetaLine(): location · affiliation · Since <memberYear> */
  metaLine: "Portland · Camp Bar PDX · Since 2024",
  isPromoter: true,
  bio: "Host, organizer, and the guy who built this thing. If it is loud, queer, and on a Saturday, I am probably there taking photos of it.",
  stats: { followers: 1240, hosting: 3, attended: 68, going: 5 },
};

const PP_TOP8 = [
  { kind: "user", name: "Marisol Vega", handle: "marisolvega" },
  { kind: "place", name: "Camp Bar PDX" },
  { kind: "user", name: "Dee Okonkwo", handle: "deelite" },
  { kind: "place", name: "Sanctuary Club" },
  { kind: "user", name: "Ash Lindqvist", handle: "ashpdx" },
  { kind: "place", name: "Alberta Rose Theatre" },
  { kind: "user", name: "Rae Solis", handle: "raesolis" },
  { kind: "place", name: "CC Slaughters" },
];

function dayColor(day) {
  return { THU: "var(--day-thu, #00FFFF)", FRI: "var(--day-fri, #FF00CC)", SAT: "var(--day-sat, #39FF14)", SUN: "var(--day-sun, #FF6600)" }[day] || "var(--neon-cyan)";
}

function HostCard({ e, past }) {
  const adm = (e.admission || "").replace(/_/g, " ");
  const status = past
    ? (e.going ? `ENDED · ${e.going} WENT` : "ENDED")
    : [e.going ? `${e.going} GOING` : null, adm].filter(Boolean).join(" · ");
  return (
    <article className="hp-card" style={{ "--hp-day": dayColor(e.day) }}>
      <div className="hp-card__banner">
        <span className="hp-card__day">{past ? "PAST" : e.day}</span>
      </div>
      <div className="hp-card__body">
        <h3 className="hp-card__title">{e.title}</h3>
        <div className="hp-card__when">{past ? "JUL 2025" : `${e.day} ${e.date.toUpperCase()} · ${e.hour}${e.ampm}`}</div>
        <div className="hp-card__venue">{e.venue}</div>
        {status ? <div className="hp-card__stat">{status}</div> : null}
      </div>
    </article>
  );
}

function ProfileScreen({ data }) {
  const m = PP_MEMBER;
  const hostingNext = data.EVENTS.filter((e) => e.featured).slice(0, 3);
  const hostingPast = data.EVENTS.slice(6, 9);
  const going = data.EVENTS.filter((e) => !e.featured).slice(0, 4);
  const bigOne = hostingNext[0];
  const stash = data.EVENTS.slice(3, 11);
  const posts = [...(data.COMMUNITY.gigs || []), ...(data.COMMUNITY.gifting || [])].slice(0, 3);
  const partyNames = data.EVENTS.slice(0, 10).map((e) => e.title);

  const stats = [
    { n: "1.2K", label: "Followers", color: "var(--text-hi)" },
    { n: String(m.stats.hosting), label: "Hosting", color: "var(--neon-magenta)" },
    { n: String(m.stats.attended), label: "Attended", color: "var(--text-hi)" },
    { n: String(m.stats.going), label: "Going", color: "var(--neon-yellow)" },
  ];

  return (
    <div className="pp-page" style={{ "--pp-accent": m.accent }}>
      <div className="pp-shell">
        <section className="pp-hero">
          <div className="pp-hero__banner" aria-hidden="true" />
          <div className="pp-hero__scrim" aria-hidden="true" />
          <div className="pp-hero__rainbow" aria-hidden="true" />
          <div className="pp-hero__content">
            <div className="pp-hero__identity">
              <div className="pp-hero__avatar"><PPAvatar name={m.displayName} ring="progress" size={88} /></div>
              <div className="pp-hero__meta">
                <div className="pp-hero__name-row">
                  <h1 className="pp-hero__name">{m.displayName}</h1>
                  {m.isPromoter ? <span className="pp-role-sticker">Promoter</span> : null}
                </div>
                <div className="pp-hero__subrow">
                  <span className="pp-hero__handle">@{m.username}</span>
                  <span className="pp-hero__chip">{m.pronouns}</span>
                  <span className="pp-hero__meta-line">{m.metaLine}</span>
                </div>
              </div>
              <div className="pp-hero__actions">
                <button type="button" className="pp-btn pp-btn--follow">Follow</button>
                <button type="button" className="pp-btn pp-btn--message">Message</button>
                <button type="button" className="pp-btn pp-btn--outline">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M16 6l-4-4-4 4" /><path d="M12 2v13" /></svg>
                  Share
                </button>
              </div>
            </div>
            <p className="pp-hero__bio">{m.bio}</p>
          </div>
        </section>

        <div className="pp-stats" role="group" aria-label="Profile stats">
          {stats.map((s, i) => (
            <div className="pp-stats__cell" key={s.label}>
              {i > 0 ? <span className="pp-stats__divider" aria-hidden="true" /> : null}
              <div className="pp-stats__item">
                <span className="pp-stats__num" style={{ color: s.color }}>{s.n}</span>
                <span className="pp-stats__label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        <section className="hp-panel" aria-label="Hosting">
          <div className="hp-panel__head">
            <span className="hp-panel__kicker"><span className="hp-panel__dot" aria-hidden="true" />HOSTING</span>
            <span className="hp-panel__badge">PROMOTER</span>
          </div>
          <div className="hp-section">
            <div className="hp-section__label">UP NEXT</div>
            <div className="hp-rail">{hostingNext.map((e) => <HostCard key={e.id} e={e} />)}</div>
          </div>
          <div className="hp-section">
            <div className="hp-section__label">PAST EVENTS</div>
            <div className="hp-rail">{hostingPast.map((e) => <HostCard key={e.id} e={e} past />)}</div>
          </div>
        </section>

        <div className="pp-split">
          <div className="pp-split__left">
            <section className="pp-top8" aria-label="Top 8">
              <div className="pp-top8__head">
                <span className="pp-top8__kick"><span className="pp-top8__dot" aria-hidden="true" />Top 8</span>
              </div>
              <div className="pp-top8__grid">
                {PP_TOP8.map((t, i) => (
                  <div className="pp-top8__tile" key={t.name}>
                    <span className="pp-top8__rank">{i + 1}</span>
                    {t.kind === "user"
                      ? <span className="pp-top8__avatar"><PPAvatar name={t.name} ring="progress" size={58} /></span>
                      : <span className="pp-top8__logo">{t.name.slice(0, 1)}</span>}
                    <span className="pp-top8__name">{t.name}</span>
                    <span className="pp-top8__meta">{t.kind === "user" ? "@" + t.handle : "Venue"}</span>
                  </div>
                ))}
              </div>
            </section>

            {bigOne ? (
              <section className="pp-big" style={{ "--c": dayColor(bigOne.day) }} aria-label="The big one">
                <div className="pp-big__kicker">The big one</div>
                <h3 className="pp-big__title">{bigOne.title}</h3>
                <div className="pp-big__when">{bigOne.day} {bigOne.date} · {bigOne.hour} {bigOne.ampm} · {bigOne.venue}</div>
                <div className="pp-big__foot">
                  <span className="pp-big__count">{bigOne.going} going</span>
                  <PPBtn accent="lime" size="sm">RSVP</PPBtn>
                </div>
              </section>
            ) : null}
          </div>

          <div className="pp-split__right">
            <section className="pp-rail" aria-label="Going">
              <div className="pp-rail__head">
                <span className="pp-rail__label">GOING</span>
                <span className="pp-rail__count">{going.length} UPCOMING</span>
              </div>
              <div className="pp-rail__list">
                {going.map((e) => (
                  <div className="pp-rail__row" key={e.id} style={{ "--c": dayColor(e.day) }}>
                    <span className="pp-rail__day">{e.day}</span>
                    <span className="pp-rail__title">{e.title}</span>
                    <span className="pp-rail__meta">{e.hour}{e.ampm} · {e.venue}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="pp-updates" aria-label="Updates">
              <div className="pp-updates__head">
                <span className="pp-updates__kicker"><span className="pp-updates__dot" aria-hidden="true" />UPDATES</span>
                <span className="pp-updates__meta">POSTS BY TUCKER CASEY</span>
              </div>
              <div className="pp-updates__rail">
                {posts.map((p) => (
                  <article className="pp-updates__card" key={p.id}>
                    <div className="pp-updates__card-top">
                      <PPAvatar name={m.displayName} ring="progress" size={40} />
                      <div className="pp-updates__card-main">
                        <div className="pp-updates__card-row">
                          <div>
                            <div className="pp-updates__name">{m.displayName}</div>
                            <div className="pp-updates__kick">{p.role ? "Gigs" : "Gifting"} · 2 DAYS AGO</div>
                          </div>
                          <span className="pp-updates__badge" style={{ color: p.role ? "#b06bff" : "#c8fa3c", borderColor: p.role ? "#b06bff" : "#c8fa3c" }}>{p.role ? "GIG" : "GIFT"}</span>
                        </div>
                        <h4 className="pp-updates__subject">{p.role || p.item}</h4>
                        <p className="pp-updates__text">{p.text}</p>
                        {p.where ? <div className="pp-updates__kick">{p.where}</div> : null}
                      </div>
                    </div>
                    <div className="pp-updates__footer">
                      <span className="pp-updates__engage">♥ <b>12</b> LIKE</span>
                      <span className="pp-updates__engage">💬 <b>3</b> REPLY</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="pp-stash" aria-label="Flyer stash">
          <div className="pp-stash__head">
            <span className="pp-rail__label">FLYER STASH</span>
            <span className="pp-rail__count">{stash.length} NIGHTS</span>
          </div>
          <div className="pp-stash__grid">
            {stash.map((e, i) => (
              <div className="pp-stash__tile" key={e.id} style={{ "--c": dayColor(e.day) }}>
                <span className="pp-stash__role">{i % 3 === 0 ? "MC" : "WENT"}</span>
                <span className="pp-stash__title">{e.title}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="pp-close">
          <PPDivider seam />
          <div className="pp-close__row"><a className="pp-close__url" href="#" onClick={(e) => e.preventDefault()}>zaylist.com/u/{m.username}</a></div>
        </footer>
      </div>
    </div>
  );
}

Object.assign(window, { PGProfileScreen: ProfileScreen });
