/* AboutScreen, ported from Tucker's About overhaul (the live site's About page).
   Manifesto-led: hero, animated stat band, manifesto, made-by-Tucker, keep-alive,
   community infrastructure (board-accent cards), how-it-works, values, sponsors, FAQ. */
const {
  Button: AbBtn, SectionHeader: AbSection, StickerBadge: AbSticker,
} = window.PDXPrideGuideDesignSystem_b20420;

if (typeof document !== "undefined" && !document.getElementById("pg-about-css")) {
  const s = document.createElement("style");
  s.id = "pg-about-css";
  s.textContent = `
  .pg-about .aw-inner{ max-width:1180px; margin:0 auto; }
  .pg-about details > summary{ list-style:none; cursor:pointer; }
  .pg-about details > summary::-webkit-details-marker{ display:none; }
  .pg-about .faq-ico{ transition:transform .2s var(--ease-out); display:inline-block; }
  .pg-about details[open] > summary .faq-ico{ transform:rotate(45deg); color:var(--lime); }
  .pg-about a.proj:hover{ transform:translateY(-2px); background:var(--surface-card-hover); text-decoration:none; }
  `;
  document.head.appendChild(s);
}

const abBand = { fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".2em", textTransform: "uppercase" };
const abProse = { fontSize: 19, lineHeight: 1.6, color: "var(--text-mid)", margin: "0 0 18px" };
const abCheck = { color: "var(--lime)", fontWeight: 900, flex: "none" };
const abValRow = { display: "flex", gap: 12, alignItems: "flex-start" };
const abInfraCard = (accent) => ({ padding: "24px", background: "var(--ink-800)", border: "2px solid var(--ink-border)", borderRadius: 5, borderLeft: `3px solid ${accent}` });
const abSponsor = (accent) => ({ display: "flex", gap: 12, alignItems: "center", padding: "16px 18px", background: "var(--ink-800)", border: "2px solid var(--ink-border)", borderRadius: 5, borderLeft: `3px solid ${accent}` });

function StatCell({ v, label, color, glow, last }) {
  return (
    <div style={{ padding: "30px 40px", borderRight: last ? "none" : "2px solid var(--ink-border)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 52, lineHeight: ".82", color, textShadow: `0 0 22px ${glow}`, fontVariantNumeric: "tabular-nums" }}>{v}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--text-lo)", marginTop: 11 }}>{label}</div>
    </div>
  );
}

function Faq({ q, children }) {
  return (
    <details style={{ borderTop: "1px solid var(--ink-border)" }}>
      <summary style={{ padding: "20px 4px", fontFamily: "var(--font-display)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".02em", fontSize: 18, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        {q}<span className="faq-ico" style={{ color: "var(--cyan)", fontSize: 22 }}>+</span>
      </summary>
      <div style={{ padding: "0 4px 20px", fontSize: 15, lineHeight: 1.62, color: "var(--text-mid)", maxWidth: 760 }}>{children}</div>
    </details>
  );
}

function AboutScreen() {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    let raf; const start = performance.now(); const dur = 1100;
    const step = (now) => { const t = Math.min(1, (now - start) / dur); setP(1 - Math.pow(1 - t, 3)); if (t < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const ev = Math.round(p * 94), ed = Math.round(p * 7), ea = Math.round(p * 2);
  const link = (url) => () => window.open(url, "_blank", "noopener");

  return (
    <div className="pg-about">
      {/* HERO */}
      <div style={{ position: "relative", background: "#060609 url(../../assets/festival-posters-wall.jpg) center/cover no-repeat" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(6,6,10,.97) 0%, rgba(6,6,10,.88) 36%, rgba(6,6,10,.6) 70%, rgba(6,6,10,.4) 100%), linear-gradient(to top, rgba(6,6,10,.94) 0%, rgba(6,6,10,.2) 60%)" }} />
        <div className="aw-inner" style={{ position: "relative", padding: "88px 40px 76px" }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{ ...abBand, color: "var(--cyan)", marginBottom: 22 }}>About · Zaylist</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", margin: 0 }}>
              <span style={{ display: "block", fontSize: 104, lineHeight: ".82", color: "var(--lime)", textShadow: "0 0 34px rgba(204,255,0,.4), 0 3px 16px rgba(0,0,0,.7)" }}>94 events.</span>
              <span style={{ display: "block", fontSize: 30, lineHeight: 1.05, color: "#fff", marginTop: 16, textShadow: "0 2px 14px rgba(0,0,0,.75)" }}>And approximately zero interest in being a sanitized corporate Pride pamphlet.</span>
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 13, marginTop: 32 }}>
              <AbBtn accent="lime" size="lg" onClick={link("https://www.instagram.com/tucker_pdmax")}>Follow Tucker</AbBtn>
              <AbBtn accent="cyan" size="lg" onClick={link("https://www.zaylist.com/events")}>Browse the 94</AbBtn>
            </div>
          </div>
        </div>
      </div>

      {/* STAT BAND */}
      <div style={{ background: "var(--ink-1000)", borderTop: "2px solid var(--ink-border)", borderBottom: "2px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          <StatCell v={ev} label="Events, and counting" color="var(--lime)" glow="rgba(204,255,0,.35)" />
          <StatCell v={ed} label="Days, one guide" color="var(--cyan)" glow="rgba(0,255,255,.35)" />
          <StatCell v={ea} label={(ea === 1 ? "Admin" : "Admins") + " keeping it clean"} color="var(--pink)" glow="rgba(255,0,204,.35)" />
          <StatCell v="$0" label="To browse. Always." color="var(--orange)" glow="rgba(255,102,0,.35)" last />
        </div>
      </div>

      {/* MANIFESTO */}
      <div style={{ background: "#070708", borderBottom: "1px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ padding: "60px 40px" }}>
          <div style={{ ...abBand, color: "var(--pink)", marginBottom: 20 }}>What this actually is</div>
          <div style={{ maxWidth: 820 }}>
            <p style={abProse}>events has not even started yet, and this thing already has parties, community events, weird little gems, places to eat, places to shop, gigs, gifting, missed connections, and other necessary homosexual infrastructure.</p>
            <p style={{ ...abProse, margin: "0 0 32px" }}>The family friendly newspaper roundup is cute. The local moms' Pride list has its place. But this is for the people who want the whole city, not just the parts a corporation can clean up and sell back to us.</p>
          </div>
          <div style={{ borderLeft: "5px solid var(--pink)", padding: "8px 0 8px 26px", maxWidth: 900 }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", lineHeight: 1, color: "var(--paper, #fff)", fontSize: 44, margin: 0 }}>Fuck Meta.<br /><br />Fuck censoring our community.<br />Fuck pretending queer culture only counts once it has been scrubbed clean for public approval.</p>
          </div>
        </div>
      </div>

      {/* MADE BY TUCKER */}
      <div style={{ background: "#070708", borderTop: "1px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ padding: "60px 40px", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: ".82fr 1.18fr", gap: 44, alignItems: "start" }}>
            <div style={{ position: "relative" }}>
              <div style={{ border: "2px solid var(--ink-border)", borderRadius: 6, overflow: "hidden", background: "#050505" }}>
                <img src="../../assets/tucker-portrait.jpg" alt="Tucker" style={{ width: "100%", height: 440, objectFit: "cover", objectPosition: "center top", display: "block" }} />
              </div>
            </div>
            <div>
              <AbSection kicker="Who's behind it" title={<>Made by <span className="hl">Tucker Max</span></>} accent="lime" />
              <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "var(--text-mid)", margin: "14px 0 14px" }}>I host Yes Coach and STANK, I run LockerRoom at The Eagle, and I host the Digg'n For Bones podcast. I also built this entire site myself, with many different tools. No corporation, no algorithm, no whoever wrote the biggest check. Just me, and the people who show up.</p>
              <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "var(--text-mid)", margin: "0 0 14px" }}>This year got rough. A lot of you donated and checked in on me, and that is the only reason year three exists.</p>
              <p style={{ fontSize: 16.5, lineHeight: 1.65, color: "var(--text-mid)", margin: "0 0 18px", fontWeight: 700 }}>From the bottom of my heart thank you. You showed up for me and I hope this is a way I can show up for you.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <AbBtn accent="lime" onClick={link("https://www.instagram.com/tucker_pdmax")}>Follow @tucker_pdmax</AbBtn>
                <AbBtn accent="cyan" variant="ghost" onClick={link("https://www.zaylist.com/inbox")}>Message me</AbBtn>
              </div>
            </div>
          </div>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--text-faint)", margin: "36px 0 14px" }}>Tucker's projects</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <a className="proj" href="https://members.pdxsanctuary.com/events/93071" target="_blank" rel="noopener noreferrer" style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 18, alignItems: "center", padding: 16, background: "var(--surface-card)", border: "2px solid var(--border-default)", borderLeft: "5px solid var(--day-sat)", borderRadius: "var(--radius-md)", textDecoration: "none", color: "inherit", boxShadow: "0 0 22px -10px var(--day-sat)", transition: "transform .2s var(--ease-out), background .2s" }}>
              <img src="../../assets/tucker-yes-coach.jpg" alt="STANK x Yes Coach" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "var(--radius-sm)", display: "block" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".6rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--day-sat)", border: "1px solid var(--day-sat)", borderRadius: 2, padding: "2px 7px 1px", display: "inline-block" }}>Event · Sat</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: "1.35rem", lineHeight: 1.02, color: "var(--text-hi)", margin: "8px 0 3px" }}>STANK x Yes Coach</h3>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--meta)", color: "var(--text-lo)" }}>Sanctuary Club · This weekend</div>
              </div>
            </a>
            <a className="proj" href="https://open.spotify.com/show/0QjCR4IzhAbAssZE2uAdz3" target="_blank" rel="noopener noreferrer" style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 18, alignItems: "center", padding: 16, background: "var(--surface-card)", border: "2px solid var(--border-default)", borderLeft: "5px solid var(--purple)", borderRadius: "var(--radius-md)", textDecoration: "none", color: "inherit", boxShadow: "0 0 22px -10px var(--purple)", transition: "transform .2s var(--ease-out), background .2s" }}>
              <img src="../../assets/diggn-for-bones.jpg" alt="Digg'n For Bones podcast" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "var(--radius-sm)", display: "block" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".6rem", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--purple)", border: "1px solid var(--purple)", borderRadius: 2, padding: "2px 7px 1px", display: "inline-block" }}>Podcast · Season 3</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: "1.35rem", lineHeight: 1.02, color: "var(--text-hi)", margin: "8px 0 3px" }}>Digg'n For Bones</h3>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--meta)", color: "var(--text-lo)" }}>Hosted by Tucker · new episodes on Spotify</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* KEEP IT ALIVE */}
      <div style={{ background: "var(--ink-1000)", borderTop: "1px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ padding: "52px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", lineHeight: .96, color: "#fff", fontSize: 34, margin: "0 0 10px" }}>Keep this guide alive</h2>
            <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--text-lo)", margin: 0 }}>Servers and domains cost money. Time costs the most. If this pointed you toward one good night, chip in and it stays free for the next person.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            <AbBtn accent="lime" size="lg" onClick={link("https://venmo.com/tucker_pdmax")}>Buy me a coffee</AbBtn>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-faint)" }}>@tucker_pdmax on Venmo</span>
          </div>
        </div>
      </div>

      {/* INFRASTRUCTURE (board-accent cards; tweakable) */}
      <div style={{ background: "var(--ink-900)" }}>
        <div className="aw-inner" style={{ padding: "60px 40px" }}>
          <AbSection kicker="Necessary homosexual infrastructure" title={<>The whole city, <span className="hl">not the sanitized bits</span></>} accent="cyan" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 22 }}>
            <div style={abInfraCard("var(--board-gigs)")}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: 23, color: "var(--board-gigs)", marginBottom: 9 }}>Gigs</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--text-mid)", margin: 0 }}>Offer a trade, need work, or want to lend your talents? Check gigs.</p>
            </div>
            <div style={abInfraCard("var(--board-gifting)")}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: 23, color: "var(--board-gifting)", marginBottom: 9 }}>Gifting</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--text-mid)", margin: 0 }}>Need something for events, or have old festival stuff collecting dust? Check gifting.</p>
            </div>
            <div style={abInfraCard("var(--board-spotted)")}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: 23, color: "var(--board-spotted)", marginBottom: 9 }}>Missed connections</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--text-mid)", margin: 0 }}>Trying to find someone during events? Missed Connections exists for a reason.</p>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: "var(--ink-900)", borderTop: "1px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ padding: "60px 40px" }}>
          <AbSection kicker="How it works" title={<>Public by <span className="hl">default</span></>} subtitle="Most of the guide goes live the second you post it. Admins only step in for the stuff that actually needs a human." accent="cyan" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 22 }}>
            <div style={{ padding: 26, background: "var(--ink-800)", border: "2px solid var(--lime)", borderRadius: 6, boxShadow: "0 0 24px -14px var(--lime)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: 21, color: "var(--lime)", marginBottom: 16 }}>Goes live instantly</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {["RSVPs, once you are logged in", "Missed Connections, gigs, gifting, and talent tags", "New events and claims from approved promoters"].map((x, i) => (
                  <li key={i} style={abValRow}><span style={abCheck}>✓</span><span style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text-mid)" }}>{x}</span></li>
                ))}
              </ul>
            </div>
            <div style={{ padding: 26, background: "var(--ink-800)", border: "2px solid var(--ink-border)", borderRadius: 6 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", fontSize: 21, color: "var(--cyan)", marginBottom: 16 }}>Needs an admin</div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {["New events and suggestions from anyone not approved yet", "Promoter applications, moderation, and take-down requests", "Gifting reports and site feedback"].map((x, i) => (
                  <li key={i} style={abValRow}><span style={{ color: "var(--cyan)", fontWeight: 900, flex: "none" }}>→</span><span style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text-mid)" }}>{x}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* VALUES */}
      <div style={{ background: "#070708", borderTop: "1px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ padding: "60px 40px" }}>
          <AbSection kicker="Transparency" title={<>Values &amp; the <span className="hl">rules</span></>} accent="pink" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 40px", maxWidth: 960, marginTop: 22 }}>
            {[["Free to browse.", "No paywall, no popup begging for your email."],
              ["The top spot is not for sale.", "Sponsors welcome if they fit the values. That is the whole bar."],
              ["Post with a free account.", "That is how spam stays out and names stay on."],
              ["Your data is not for sale.", "Not now, not later, not for a nice offer."],
              ["We moderate the clearly over the line stuff.", "But our line sits way further back than the average straight person's."],
              ["One person builds this.", "Good people help. It is still not a committee."]].map((v, i) => (
              <div key={i} style={abValRow}><span style={abCheck}>✓</span><span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text-mid)" }}><strong style={{ color: "#fff" }}>{v[0]}</strong> {v[1]}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* SPONSORS */}
      <div style={{ background: "var(--ink-900)", borderTop: "1px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ padding: "60px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 40, alignItems: "center" }}>
            <div>
              <div style={{ ...abBand, color: "var(--lime)", marginBottom: 18 }}>Sponsors</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", lineHeight: .95, color: "#fff", fontSize: 40, margin: "0 0 16px" }}>Looking for sponsors who <span style={{ color: "var(--lime)" }}>fit the values</span></h2>
              <p style={{ fontSize: 16, lineHeight: 1.62, color: "var(--text-mid)", maxWidth: 520, margin: "0 0 22px" }}>I am looking for sponsors, not landlords. If your business actually belongs in this scene and shares what is on this page, you can help keep the whole thing free. You still cannot buy the top spot. Ever.</p>
              <AbBtn accent="lime" onClick={link("https://www.zaylist.com/inbox")}>Pitch a sponsorship</AbBtn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={abSponsor("var(--lime)")}><span style={{ color: "var(--lime)", fontWeight: 900, fontSize: 18 }}>✓</span><span style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text-mid)" }}>Queer owned or genuinely queer loving.</span></div>
              <div style={abSponsor("var(--cyan)")}><span style={{ color: "var(--cyan)", fontWeight: 900, fontSize: 18 }}>✓</span><span style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text-mid)" }}>Treats its people right. Pays them right.</span></div>
              <div style={abSponsor("var(--pink)")}><span style={{ color: "var(--pink)", fontWeight: 900, fontSize: 18 }}>✓</span><span style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text-mid)" }}>Does not need us to scrub anything clean first.</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: "#070708", borderTop: "1px solid var(--ink-border)" }}>
        <div className="aw-inner" style={{ padding: "60px 40px" }}>
          <AbSection kicker="FAQ" title="Good questions" accent="cyan" />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14, borderBottom: "1px solid var(--ink-border)" }}>
            <Faq q="What is Zaylist?">Everything queer in Portland: parties, shows, marches, and the quiet stuff too. Updated as the scene moves, all year.</Faq>
            <Faq q="Where do I find events?">The Events page. Every live listing on a map and a board. Filter by day, type, or neighborhood, then open anything for times, venue, and tickets.</Faq>
            <Faq q="How is this different from other festival apps?">It is free, it is run by a person, and it is built for this city. No corporate feed. No paying to rank. Promoters post, the community shows up.</Faq>
            <Faq q="Can my business sponsor?">If you belong in the scene, yes. Sponsorship helps keep it free. It does not buy you a higher spot. Ever. Pitch it and I will read it.</Faq>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PGAboutScreen: AboutScreen });
