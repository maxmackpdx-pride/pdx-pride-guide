/* NudeBeachesScreen. Recreated from master, not reinvented:
   pages/NudeBeaches.tsx (page order), components/NudeBeachesHero.tsx (BoardHero kicker/title/lede
   + BoardStatsBar three stats), components/NudeBeachesHubPanel.tsx (weather + river level /
   water quality + parking sections), shared/nudeBeaches.ts (all constants and copy).
   The snapshot values below stand in for GET /api/nude-beaches. */
const { Button: NBBtn, MapPanel: NBMap, Divider: NBDivider } = window.PDXPrideGuideDesignSystem_b20420;

const NB_TABS = [
  { key: "rooster-rock", label: "Rooster Rock" },
  { key: "sauvie-island", label: "Sauvie Island" },
];

/* Sample snapshot. Numbers follow the real derivations in shared/nudeBeaches.ts:
   crossingBandLabel(12.4) → "Wade or walk", crossingVerdictFromLevel(12.4) → the advice line. */
const SNAP = {
  fetchedAt: "Sat, Jul 25, 3:40 PM",
  roosterRock: {
    airTempF: 84, waterTempF: 71, waterTempSite: "Warrendale", wind: "NW 8 to 12 mph",
    windStat: { value: "NW 8 to 12", label: "Wind · mph" },
    riverLevelFt: 12.4, crossingBand: "Wade or walk",
    crossingAdvice: "The water's low, you can likely wade, or even walk, to Sand Island.",
    todayLowFt: 11.82, todayLowAt: "5:40 AM", todayHighFt: 13.1, todayHighAt: "4:15 PM",
    levelTrend: "Falling", crossingWindowNote: "Best crossing window is late morning.",
    weatherSummary: "Sunny and warm through the afternoon.",
    waterClarity: "Likely clear", airQuality: "Good · AQI 38",
  },
  sauvieIsland: {
    swimStatusLabel: "PASSED", swimColor: "#39FF14", lastSampleAt: "Jul 24",
    swimSummary: "Collins Beach is sampled bi-weekly through the Swim Guide. Verify the current sample before you get in.",
    parkingStatusLabel: "DAY PASS",
    parkingNote: "Mandatory on summer weekends through Labor Day. Buy a daily day pass online, seasonal sold-out is not the same as day passes gone.",
    airTempF: 82, wind: "N 6 to 10 mph", windStat: { value: "N 6 to 10", label: "Wind · mph" },
    dayHigh: 86, dayName: "Saturday",
    weatherSummary: "Partly sunny, light wind off the channel.",
  },
};

const HERO = {
  "rooster-rock": {
    accent: "#FF6600",
    kicker: "Columbia River · Corbett",
    title: ["Rooster", "Rock"],
    lede: "River level, air and water temps, forecast, directions, and day-use parking pass info, plus a GPS group chat that unlocks once you're actually on the beach.",
  },
  "sauvie-island": {
    accent: "#39FF14",
    kicker: "Sauvie Island · Collins Beach",
    title: ["Sauvie", "Island"],
    lede: "Swim Guide water quality, Sauvie Island Parking permits, island weather, and the links Collins Beach travelers use.",
  },
};

const ROOSTER_FEES = [
  { label: "Oregon residents", value: "$10 / vehicle / day" },
  { label: "Out of state", value: "$12 / vehicle / day" },
  { label: "Annual pass · OR", value: "$60 / year" },
  { label: "Annual pass · out of state", value: "$75 / year" },
];

const ROOSTER_ACTIONS = [
  { label: "Buy day-use permit", href: "https://stateparks.oregon.gov/index.cfm?do=visit.day-use", primary: true },
  { label: "Where to buy passes", href: "https://stateparks.oregon.gov/index.cfm?do=v.page&id=30" },
  { label: "Official park page", href: "https://stateparks.oregon.gov/index.cfm?do=park.profile&parkId=126" },
];

const ROOSTER_MAPS = [
  { label: "Google Maps directions", href: "https://www.google.com/maps/dir/?api=1&destination=Rooster+Rock+State+Park%2C+Corbett%2C+OR" },
  { label: "Apple Maps directions", href: "https://maps.apple.com/?daddr=Rooster+Rock+State+Park,+Corbett,+OR&dirflg=d" },
  { label: "Crossing map", href: "https://roosterrockcrossing.com/#map" },
  { label: "OpenStreetMap", href: "https://www.openstreetmap.org/?mlat=45.5446&mlon=-122.2342#map=15/45.5446/-122.2342" },
];

const SAUVIE_MAPS = [
  { label: "Google Maps directions", href: "https://www.google.com/maps/dir/?api=1&destination=Collins+Beach,+Sauvie+Island,+OR" },
  { label: "Apple Maps directions", href: "https://maps.apple.com/?daddr=Collins+Beach,+Sauvie+Island,+OR&dirflg=d" },
  { label: "OpenStreetMap", href: "https://www.openstreetmap.org/?mlat=45.793&mlon=-122.789#map=14/45.793/-122.789" },
];

const SAUVIE_CHECKLIST = [
  { step: "Check permit status", detail: "Weekends and holidays through Labor Day need a beaches permit. Seasonal passes may be sold out, buy a daily $10 day pass online for your date (not the same as season sold-out).", link: { label: "Sauvie Island Parking", href: "https://sauvieislandparking.com/" } },
  { step: "Check water safety", detail: "If you plan to swim, verify the latest Collins Beach sample before you go.", link: { label: "Swim Guide", href: "https://www.theswimguide.org/beach/1792" } },
  { step: "Review wildlife-area rules", detail: "Alcohol is prohibited on all beaches. Day-use hours are 4 a.m. to 10 p.m. Check SICA for road or bridge alerts." },
];

const SAUVIE_RULES = [
  "Alcohol is strictly prohibited on all beaches in the Sauvie Island Wildlife Area.",
  "Day-use hours are 4 a.m. to 10 p.m. in the wildlife area.",
  "Collins Beach is partly clothing-optional, wild, sandy, and on the island's western shore.",
  "Parking permits are required on busy days through Labor Day, daily day passes are sold online, seasonal sold-out does not mean no parking.",
];

const SAUVIE_FARMS = [
  { title: "Sauvie Island Farms", desc: "Berries, flowers, and u-pick fields, one of the island's classic farm stops on the road to Collins.", href: "http://www.sauvieislandfarms.com/" },
  { title: "The Pumpkin Patch & Corn Maze", desc: "Farm market, animals, and seasonal produce, a Sauvie Island institution year-round.", href: "https://www.thepumpkinpatch.com/" },
  { title: "Topaz Farm", desc: "Organic farm stand with produce, flowers, and pasture-raised eggs, great mid-island detour.", href: "https://topazfarm.com/" },
  { title: "Columbia Farms U-Pick", desc: "Seasonal berries and produce on the north end, check what's picking before you swing by.", href: "https://www.columbiafarmsu-pick.com/" },
];

/* BoardStatsBar, variant="band", three stats, no LIVE dot. */
function StatsBar({ stats }) {
  return (
    <div className="nb-band">
      {stats.map((s) => (
        <div className="nb-band__cell" key={s.label}>
          <div className="nb-band__num" style={{ color: s.color }}>{s.num}</div>
          <div className="nb-band__label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function WeatherSection({ main, mainLabel, stats, summary, extra }) {
  return (
    <section className="nb-hub__section">
      <div className="nb-hub__weather-head">
        <div className="nb-hub__kicker">Weather</div>
        <span className="nb-hub__sun" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffc14a" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" /></svg>
        </span>
      </div>
      <div className="nb-hub__weather-grid">
        <div className="nb-hub__weather-main">
          <span className="nb-hub__weather-value">{main}</span>
          <span className="nb-hub__weather-label">{mainLabel}</span>
        </div>
        {stats.map((s) => (
          <div className="nb-hub__weather-stat" key={s.label}>
            <span className="nb-hub__weather-stat-value">{s.value}</span>
            <span className="nb-hub__weather-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
      <p className="nb-hub__summary">{summary}</p>
      {extra ? <p className="nb-hub__summary" style={{ marginTop: 8 }}>{extra}</p> : null}
    </section>
  );
}

function RoosterHub() {
  const live = SNAP.roosterRock;
  return (
    <div className="nb-hub">
      <WeatherSection
        main={`${live.airTempF}°F`} mainLabel="Air temp"
        stats={[
          { value: live.wind, label: "Wind" },
          { value: `${live.waterTempF}°F`, label: `Water · ${live.waterTempSite}` },
          { value: live.airQuality.split(" · ")[0], label: "Air quality" },
        ]}
        summary={live.weatherSummary} extra={live.waterClarity} />
      <section className="nb-hub__section nb-hub__level">
        <div className="nb-hub__level-head">
          <div className="nb-hub__kicker">River level</div>
          <span className="nb-hub__badge">{live.crossingBand}</span>
        </div>
        <div className="nb-hub__level-value">{live.riverLevelFt.toFixed(2)}<span className="nb-hub__level-unit">ft</span></div>
        <p className="nb-hub__level-detail">{live.crossingAdvice}</p>
        <div className="nb-hub__level-range">
          <div>
            <span className="nb-hub__range-label">Today's low</span>
            <span className="nb-hub__range-value">{live.todayLowFt.toFixed(2)} ft · {live.todayLowAt}</span>
          </div>
          <div>
            <span className="nb-hub__range-label">Today's high</span>
            <span className="nb-hub__range-value">{live.todayHighFt.toFixed(2)} ft · {live.todayHighAt}</span>
          </div>
        </div>
        <p className="nb-hub__advice">{live.levelTrend} over the last hour. {live.crossingWindowNote}</p>
        <a className="nb-hub__link" href="https://roosterrockcrossing.com" target="_blank" rel="noopener noreferrer">Charts &amp; history &rarr;</a>
      </section>
    </div>
  );
}

function SauvieHub() {
  const live = SNAP.sauvieIsland;
  return (
    <div className="nb-hub">
      <WeatherSection
        main={`${live.airTempF}°F`} mainLabel="Air temp"
        stats={[
          { value: live.wind, label: "Wind" },
          { value: `${live.dayHigh}°F`, label: `${live.dayName} high` },
          { value: live.parkingStatusLabel, label: "Parking" },
        ]}
        summary={live.weatherSummary} />
      <section className="nb-hub__section nb-hub__swim" style={{ "--nb-rim": live.swimColor }}>
        <div className="nb-hub__kicker">Water quality</div>
        <div className="nb-hub__swim-head">
          <span className="nb-hub__swim-value" style={{ color: live.swimColor, textShadow: `0 0 22px ${live.swimColor}59` }}>{live.swimStatusLabel}</span>
          <span className="nb-hub__swim-sampled">sampled {live.lastSampleAt}</span>
        </div>
        <p className="nb-hub__summary">{live.swimSummary}</p>
        <a className="nb-hub__link" href="https://www.theswimguide.org/beach/1792" target="_blank" rel="noopener noreferrer">Swim Guide &rarr;</a>
      </section>
      <section className="nb-hub__section">
        <div className="nb-hub__kicker">Parking permits</div>
        <p className="nb-hub__summary">{live.parkingNote}</p>
        <a className="nb-hub__link" href="https://sauvieislandparking.com/" target="_blank" rel="noopener noreferrer">Sauvie Island Parking &rarr;</a>
      </section>
    </div>
  );
}

function RoosterLogistics() {
  return (
    <div className="nb-log">
      <div className="nb-log__kicker" style={{ color: HERO["rooster-rock"].accent }}>Trip logistics · Rooster Rock</div>
      <h2 className="nb-log__title">Parking &amp; pass</h2>
      <p className="nb-log__lede">Rooster Rock State Park · I-84 Exit 25 · Corbett, OR. Day-use only, pay at the fee machine or the QR on site, or bring an Oregon State Parks pass.</p>
      <div className="nb-log__fees">
        {ROOSTER_FEES.map((f) => (
          <div className="nb-fee" key={f.label}>
            <div className="nb-fee__label">{f.label}</div>
            <div className="nb-fee__value">{f.value}</div>
          </div>
        ))}
      </div>
      <div className="nb-log__actions">
        {ROOSTER_ACTIONS.map((a) => (
          <a key={a.label} className={`nb-maplink ${a.primary ? "is-primary" : ""}`} href={a.href} target="_blank" rel="noopener noreferrer">{a.label}</a>
        ))}
      </div>
    </div>
  );
}

function SauvieLogistics() {
  const green = HERO["sauvie-island"].accent;
  return (
    <div className="nb-log">
      <div className="nb-log__kicker" style={{ color: green }}>Trip logistics · Collins Beach</div>
      <h2 className="nb-log__title">Before you go</h2>
      <p className="nb-log__lede">Three checks before you point the car at the bridge. Collins Beach is wild, sandy, and worth the small bit of prep.</p>
      <div className="nb-log__steps">
        {SAUVIE_CHECKLIST.map((s, i) => (
          <div className="nb-step" key={s.step}>
            <div className="nb-step__num" style={{ color: green, borderColor: green }}>{i + 1}</div>
            <div className="nb-step__title">{s.step}</div>
            <p className="nb-step__detail">{s.detail}</p>
            {s.link ? <a className="nb-step__link" href={s.link.href} target="_blank" rel="noopener noreferrer">{s.link.label} &rarr;</a> : null}
          </div>
        ))}
      </div>
      <div className="nb-log__kicker nb-log__kicker--section" style={{ color: green }}>Know the rules</div>
      <div className="nb-log__rules">
        {SAUVIE_RULES.map((r) => (
          <div className="nb-rule" key={r}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            <p className="nb-rule__text">{r}</p>
          </div>
        ))}
      </div>
      <div className="nb-log__kicker nb-log__kicker--section" style={{ color: "var(--neon-yellow)" }}>Farm stops on the drive</div>
      <p className="nb-log__lede"><strong>Cracker Barrel Grocery</strong> sits right after the bridge, your last easy stop for snacks, drinks, and supplies before the wildlife area. A few island classics on the drive out:</p>
      <div className="nb-log__farms">
        {SAUVIE_FARMS.map((f) => (
          <a className="nb-farm" key={f.href} href={f.href} target="_blank" rel="noopener noreferrer">
            <div className="nb-farm__row"><span className="nb-farm__title">{f.title}</span><span className="nb-farm__arrow">&rarr;</span></div>
            <p className="nb-farm__desc">{f.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function NudeBeachesScreen() {
  const [tab, setTab] = React.useState("rooster-rock");
  const isRooster = tab === "rooster-rock";
  const hero = HERO[tab];
  const r = SNAP.roosterRock, s = SNAP.sauvieIsland;

  const stats = isRooster
    ? [
        { num: `${r.airTempF}°`, label: "air temp", color: "#FF6600" },
        { num: `${r.waterTempF}°`, label: "water temp", color: "#19e3ff" },
        { num: r.windStat.value, label: r.windStat.label, color: "#FF6600" },
      ]
    : [
        { num: s.swimStatusLabel, label: "Collins swim", color: "#39FF14" },
        { num: `${s.airTempF}°`, label: "air temp", color: "#39FF14" },
        { num: s.windStat.value, label: s.windStat.label, color: "#19e3ff" },
      ];

  return (
    <div className="pg-nb" style={{ "--nb-accent": hero.accent }}>
      <header className="nb-head">
        <div className="pg-container">
          <div className="nb-herorow">
            <div className="nb-boardhero">
              <div className="nb-boardhero__kicker"><span className="nb-boardhero__dot" aria-hidden="true" />{hero.kicker}</div>
              <h1 className="nb-boardhero__title">{hero.title[0]} <span className="nb-boardhero__title-accent">{hero.title[1]}</span></h1>
              <p className="nb-boardhero__lede">{hero.lede}</p>
            </div>
            <nav className="nb-tabs" aria-label="Beach location">
              {NB_TABS.map((t) => (
                <button key={t.key} type="button" className={`nb-tab ${tab === t.key ? "is-active" : ""}`}
                  style={{ "--nb-tab": HERO[t.key].accent }} onClick={() => setTab(t.key)}>{t.label}</button>
              ))}
            </nav>
          </div>
          <StatsBar stats={stats} />
        </div>
      </header>

      <div className="pg-container">
        <div className="nb-refresh">
          <p className="nb-refresh__meta">
            {isRooster ? "Rooster Rock" : "Sauvie Island"} · updated <strong>{SNAP.fetchedAt}</strong>
          </p>
          <NBBtn accent={isRooster ? "orange" : "green"} variant="outline" size="sm">Refresh</NBBtn>
        </div>

        <div className="nb-maprow">
          {isRooster ? <RoosterHub /> : <SauvieHub />}
          <div className="nb-mapwrap">
            <NBMap height={isRooster ? 470 : 430} legend={false} showCityLabel={false}
              pins={isRooster
                ? [{ x: 30, y: 62, day: "SUN" }, { x: 46, y: 54, day: "SAT" }, { x: 58, y: 44, day: "FRI" }, { x: 72, y: 38, day: "FRI" }, { x: 86, y: 30, multi: true }]
                : [{ x: 34, y: 70, day: "SAT" }, { x: 48, y: 56, day: "SAT" }, { x: 60, y: 44, day: "THU" }, { x: 70, y: 32, multi: true }]} />
          </div>
        </div>

        <div className="nb-maplinks">
          {(isRooster ? ROOSTER_MAPS : SAUVIE_MAPS).map((m) => (
            <a key={m.href} className="nb-maplink" href={m.href} target="_blank" rel="noopener noreferrer">{m.label}</a>
          ))}
        </div>

        <section className="nb-brats">
          <div className="nb-brats__kicker">River Brats · GPS group chat</div>
          <p className="nb-brats__copy">The beach chat unlocks once your location puts you on the sand. Coordinates are checked on the server and immediately discarded.</p>
          <NBBtn variant="outline" size="sm" disabled>Locked until you are on the beach</NBBtn>
        </section>

        <NBDivider seam />

        <section className="pg-section">
          {isRooster ? <RoosterLogistics /> : <SauvieLogistics />}
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { PGNudeBeachesScreen: NudeBeachesScreen });
