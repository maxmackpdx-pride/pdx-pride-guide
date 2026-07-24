import { useMemo, useState } from "react";
import FeedAdCard from "@/components/ads/FeedAdCard";
import PosterAdCard from "@/components/ads/PosterAdCard";
import {
  AD_BRAND_PRIMARY,
  emptyAdDraft,
  templateDraft,
  type AdDraft,
  type AdFormat,
  type AdTemplateKey,
} from "@/lib/adTypes";
import { EVENT_WEEK_DAYS } from "@shared/eventWeek";

const SWATCHES = [
  AD_BRAND_PRIMARY.cockblock,
  AD_BRAND_PRIMARY.mrs,
  AD_BRAND_PRIMARY.custom,
  "#ff1fa0",
  "#ff8c00",
  "#b06bff",
  "#c8fa3c",
];

const DAY_COLORS: Record<string, string> = {
  MON: "#8800FF",
  TUE: "#0044FF",
  WED: "#FFEE00",
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#39FF14",
  SUN: "#FF6600",
};

type TemplatePick =
  | { kind: "template"; key: AdTemplateKey }
  | { kind: "custom"; format: AdFormat };

const TEMPLATE_BUTTONS: Array<{
  pick: TemplatePick;
  name: string;
  sub: string;
  accent: string;
}> = [
  {
    pick: { kind: "template", key: "cockblock-feed" },
    name: "Feed · CockBlock",
    sub: "Slideshow · red glass",
    accent: AD_BRAND_PRIMARY.cockblock,
  },
  {
    pick: { kind: "template", key: "mrs-feed" },
    name: "Feed · Mr. S",
    sub: "Logo well · cyan glass",
    accent: AD_BRAND_PRIMARY.mrs,
  },
  {
    pick: { kind: "template", key: "cockblock-poster" },
    name: "Grid · CockBlock",
    sub: "Poster card · red",
    accent: AD_BRAND_PRIMARY.cockblock,
  },
  {
    pick: { kind: "template", key: "mrs-poster" },
    name: "Grid · Mr. S",
    sub: "Poster card · cyan",
    accent: AD_BRAND_PRIMARY.mrs,
  },
  {
    pick: { kind: "custom", format: "feed" },
    name: "Feed · Custom",
    sub: "Your brand · feed slot",
    accent: AD_BRAND_PRIMARY.custom,
  },
  {
    pick: { kind: "custom", format: "poster" },
    name: "Grid · Custom",
    sub: "Your brand · poster card",
    accent: AD_BRAND_PRIMARY.custom,
  },
];

function isTemplateSelected(draft: AdDraft, pick: TemplatePick): boolean {
  if (pick.kind === "template") {
    return draft.templateKey === pick.key && draft.format === (pick.key.includes("poster") ? "poster" : "feed");
  }
  return (
    draft.source === "custom" &&
    draft.format === pick.format &&
    !draft.templateKey
  );
}

type Props = {
  onSaved: () => void;
};

export default function AdBuilder({ onSaved }: Props) {
  const [draft, setDraft] = useState<AdDraft>(() => templateDraft("cockblock-feed"));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err" | ""; msg: string }>({
    kind: "",
    msg: "",
  });

  const set = <K extends keyof AdDraft>(key: K, value: AdDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const pickTemplate = (pick: TemplatePick) => {
    if (pick.kind === "template") {
      setDraft(templateDraft(pick.key));
      return;
    }
    if (pick.format === "feed") {
      setDraft({
        ...emptyAdDraft("feed"),
        business: "New partner",
        title: "Your headline",
        body: "Short body copy for the feed card - keep it to one or two lines.",
        ctaTitle: "Shop now",
        ctaCopy: "your-site.com · ships nationwide",
        pillLabel: "Partner",
        primaryColor: AD_BRAND_PRIMARY.custom,
        logoText: "LOGO",
        destUrl: "https://example.com",
        source: "custom",
        templateKey: null,
      });
      return;
    }
    setDraft({
      ...emptyAdDraft("poster"),
      business: "New partner",
      title: "New partner",
      body: "One-line pitch that sits under the title on the poster card.",
      ctaTitle: "Support the guide",
      ctaCopy: "Shop Now →",
      tag1: "Partner",
      tag2: "Local",
      pillLabel: "Affiliate",
      destUrl: "https://example.com",
      primaryColor: AD_BRAND_PRIMARY.custom,
      mediaMode: "single",
      singleSrc: null,
      slides: [],
      templateKey: null,
      source: "custom",
      contact: "",
      billing: "",
    });
  };

  const toggleDay = (day: string) => {
    setDraft((d) => {
      const has = d.days.includes(day);
      return { ...d, days: has ? d.days.filter((x) => x !== day) : [...d.days, day] };
    });
  };

  const toggleDepth = (n: number) => {
    setDraft((d) => {
      const has = d.scrollDepths.includes(n);
      return {
        ...d,
        scrollDepths: has ? d.scrollDepths.filter((x) => x !== n) : [...d.scrollDepths, n].sort((a, b) => a - b),
      };
    });
  };

  const onLogoFile = async (file: File | null) => {
    if (!file) {
      set("logoImg", null);
      return;
    }
    const fd = new FormData();
    fd.append("asset", file);
    try {
      const r = await fetch("/api/admin/upload/ad-asset", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload failed");
      set("logoImg", data.url);
    } catch (e: any) {
      setStatus({ kind: "err", msg: e?.message || "Logo upload failed" });
    }
  };

  const onPosterImageFile = async (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("asset", file);
    try {
      const r = await fetch("/api/admin/upload/ad-asset", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload failed");
      if (draft.mediaMode === "slideshow") {
        set("slides", [...draft.slides, data.url]);
      } else {
        set("singleSrc", data.url);
      }
    } catch (e: any) {
      setStatus({ kind: "err", msg: e?.message || "Image upload failed" });
    }
  };

  const save = async () => {
    setSaving(true);
    setStatus({ kind: "", msg: "" });
    try {
      const payload = {
        ...draft,
        status: draft.status === "live" ? "live" : "scheduled",
        source: draft.source || "custom",
      };
      const r = await fetch("/api/admin/ads", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Save failed");
      setStatus({ kind: "ok", msg: `Saved “${data.business || data.title}” as ${data.status}.` });
      onSaved();
    } catch (e: any) {
      setStatus({ kind: "err", msg: e?.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const previewLabel = useMemo(
    () =>
      draft.format === "poster"
        ? "Live preview · events-grid poster (same component as the board)"
        : "Live preview · hub news feed (same component as the feed)",
    [draft.format],
  );

  const isPoster = draft.format === "poster";

  return (
    <div className="ad-mgr__builder">
      <div className="ad-mgr__form">
        <section className="ad-mgr__card">
          <h3 className="ad-mgr__kicker">01 · Start from a live template</h3>
          <p className="ad-mgr__help">
            Templates match the ads already on the <strong className="cb">events grid</strong> and{" "}
            <strong className="nb">news feed</strong> after the deep-glass refresh. Edit copy, color, and media -
            the preview uses the same components the site renders.
          </p>
          <div className="ad-mgr__template-row ad-mgr__template-row--3">
            {TEMPLATE_BUTTONS.map((btn) => {
              const selected = isTemplateSelected(draft, btn.pick);
              return (
                <button
                  key={btn.name}
                  type="button"
                  className={`ad-mgr__template-btn${selected ? " is-selected" : ""}`}
                  style={{ ["--tmpl-accent" as string]: btn.accent }}
                  onClick={() => pickTemplate(btn.pick)}
                >
                  <span className="ad-mgr__template-bar" />
                  <span>
                    <div className="ad-mgr__template-name">{btn.name}</div>
                    <div className="ad-mgr__template-sub">{btn.sub}</div>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ad-mgr__card">
          <h3 className="ad-mgr__kicker">02 · Business & copy</h3>
          <div className="ad-mgr__grid2">
            <div className="ad-mgr__field">
              <label>Business name</label>
              <input type="text" value={draft.business} onChange={(e) => set("business", e.target.value)} />
            </div>
            <div className="ad-mgr__field">
              <label>Badge / pill label</label>
              <input type="text" value={draft.pillLabel} onChange={(e) => set("pillLabel", e.target.value)} />
            </div>
            <div className="ad-mgr__field ad-mgr__field--full">
              <label>Headline</label>
              <input type="text" value={draft.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="ad-mgr__field ad-mgr__field--full">
              <label>Body copy</label>
              <textarea value={draft.body} onChange={(e) => set("body", e.target.value)} />
            </div>
            <div className="ad-mgr__field">
              <label>{isPoster ? "Meta line (under body)" : "CTA title (footer big line)"}</label>
              <input type="text" value={draft.ctaTitle} onChange={(e) => set("ctaTitle", e.target.value)} />
              <span className="ad-mgr__field-hint">
                {isPoster
                  ? "e.g. “Code TUCKERMAX for 10% off” or “Shop the link, support the guide”"
                  : "e.g. “10% Off · Code: TUCKERMAX”"}
              </span>
            </div>
            <div className="ad-mgr__field">
              <label>{isPoster ? "Shop button label" : "CTA sub-line"}</label>
              <input type="text" value={draft.ctaCopy} onChange={(e) => set("ctaCopy", e.target.value)} />
              <span className="ad-mgr__field-hint">
                {isPoster
                  ? "Solid brand button - usually “Shop Now →”"
                  : "e.g. “cockblocktoys.com · free US & CA shipping”"}
              </span>
            </div>
            <div className="ad-mgr__field">
              <label>Logo / wordmark text</label>
              <input type="text" value={draft.logoText} onChange={(e) => set("logoText", e.target.value)} />
            </div>
            <div className="ad-mgr__field">
              <label>Logo PNG upload (feed overlay)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => onLogoFile(e.target.files?.[0] || null)}
              />
              {draft.logoImg ? (
                <button type="button" className="ad-mgr__mini-btn" onClick={() => set("logoImg", null)}>
                  ✕ clear logo
                </button>
              ) : null}
            </div>
            <div className="ad-mgr__field ad-mgr__field--full">
              <label>Destination URL</label>
              <input type="url" value={draft.destUrl} onChange={(e) => set("destUrl", e.target.value)} />
            </div>
            {isPoster && (
              <>
                <div className="ad-mgr__field">
                  <label>Tag 1 (filled)</label>
                  <input type="text" value={draft.tag1} onChange={(e) => set("tag1", e.target.value)} />
                </div>
                <div className="ad-mgr__field">
                  <label>Tag 2 (outline)</label>
                  <input type="text" value={draft.tag2} onChange={(e) => set("tag2", e.target.value)} />
                </div>
              </>
            )}
          </div>
        </section>

        <section className="ad-mgr__card">
          <h3 className="ad-mgr__kicker">03 · Color & glow</h3>
          <p className="ad-mgr__help" style={{ marginTop: 0 }}>
            Primary drives the glass edge, chip, and Shop Now fill - same as live cards (CockBlock{" "}
            <span style={{ color: AD_BRAND_PRIMARY.cockblock }}>#ff1f1f</span>, Mr. S{" "}
            <span style={{ color: AD_BRAND_PRIMARY.mrs }}>#19e3ff</span>).
          </p>
          <div className="ad-mgr__grid2">
            <div className="ad-mgr__field">
              <label>Primary (glow)</label>
              <input
                type="color"
                value={draft.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
              />
            </div>
            <div className="ad-mgr__field">
              <label>Secondary (accent)</label>
              <input
                type="color"
                value={draft.secondaryColor}
                onChange={(e) => set("secondaryColor", e.target.value)}
              />
            </div>
          </div>
          <div className="ad-mgr__swatches">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className={`ad-mgr__swatch${draft.primaryColor.toLowerCase() === c ? " is-active" : ""}`}
                style={{ background: c }}
                aria-label={`Primary ${c}`}
                onClick={() => set("primaryColor", c)}
              />
            ))}
          </div>
        </section>

        <section className="ad-mgr__card">
          <h3 className="ad-mgr__kicker">04 · Media</h3>
          <div className="ad-mgr__toggle-row">
            <button
              type="button"
              className={`ad-mgr__chip${draft.mediaMode === "single" ? " is-on" : ""}`}
              onClick={() => set("mediaMode", "single")}
            >
              Single image
            </button>
            <button
              type="button"
              className={`ad-mgr__chip${draft.mediaMode === "slideshow" ? " is-on" : ""}`}
              onClick={() => set("mediaMode", "slideshow")}
            >
              Slideshow
            </button>
          </div>
          <div className="ad-mgr__field" style={{ marginTop: 10 }}>
            <label>Upload image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => onPosterImageFile(e.target.files?.[0] || null)}
            />
          </div>
          {draft.mediaMode === "single" ? (
            <div className="ad-mgr__field">
              <label>Image URL</label>
              <input
                type="text"
                value={draft.singleSrc || ""}
                onChange={(e) => set("singleSrc", e.target.value || null)}
                placeholder="/affiliate/… or https://…"
              />
            </div>
          ) : (
            <>
              <div className="ad-mgr__field">
                <label>Slide URLs (one per line)</label>
                <textarea
                  value={draft.slides.join("\n")}
                  onChange={(e) =>
                    set(
                      "slides",
                      e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </div>
              <div className="ad-mgr__grid2">
                <div className="ad-mgr__field">
                  <label>Interval (ms)</label>
                  <input
                    type="number"
                    min={800}
                    value={draft.slideMs}
                    onChange={(e) => set("slideMs", Number(e.target.value) || 2600)}
                  />
                </div>
                <div className="ad-mgr__field">
                  <label>Auto-advance</label>
                  <button
                    type="button"
                    className={`ad-mgr__chip${draft.slideAuto ? " is-on" : ""}`}
                    onClick={() => set("slideAuto", !draft.slideAuto)}
                  >
                    {draft.slideAuto ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="ad-mgr__card">
          <h3 className="ad-mgr__kicker">05 · Placement & rules</h3>
          {draft.format === "feed" ? (
            <>
              <div className="ad-mgr__toggle-row">
                {(
                  [
                    ["placeAll", "All feed"],
                    ["placeFollowing", "Following"],
                    ["placeEvents", "Events tab"],
                    ["placeSpotted", "Spotted"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`ad-mgr__chip${draft[key] ? " is-on" : ""}`}
                    onClick={() => set(key, !draft[key])}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="ad-mgr__grid2">
                <div className="ad-mgr__field">
                  <label>Inject after every N posts (0 = depth only)</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.cadence}
                    onChange={(e) => set("cadence", Number(e.target.value) || 0)}
                  />
                </div>
                <div className="ad-mgr__field">
                  <label>Pin to top</label>
                  <button
                    type="button"
                    className={`ad-mgr__chip${draft.pinTop ? " is-on" : ""}`}
                    onClick={() => set("pinTop", !draft.pinTop)}
                  >
                    {draft.pinTop ? "On" : "Off"}
                  </button>
                </div>
              </div>
              <label
                style={{
                  display: "block",
                  margin: "10px 0 8px",
                  color: "#8a8a96",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                Scroll depth %
              </label>
              <div className="ad-mgr__toggle-row">
                {[10, 40, 60, 90].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`ad-mgr__chip${draft.scrollDepths.includes(n) ? " is-on" : ""}`}
                    onClick={() => toggleDepth(n)}
                  >
                    {n}%
                  </button>
                ))}
              </div>
              <div className="ad-mgr__grid2" style={{ marginTop: 12 }}>
                <div className="ad-mgr__field">
                  <label>Audience</label>
                  <select
                    value={draft.audience}
                    onChange={(e) => set("audience", e.target.value as AdDraft["audience"])}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="members">Members</option>
                    <option value="guests">Guests</option>
                  </select>
                </div>
                <div className="ad-mgr__field">
                  <label>Dismissible</label>
                  <button
                    type="button"
                    className={`ad-mgr__chip${draft.dismissible ? " is-on" : ""}`}
                    onClick={() => set("dismissible", !draft.dismissible)}
                  >
                    {draft.dismissible ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="ad-mgr__grid2">
              {(
                [
                  ["onePerDay", "One card per Pride day"],
                  ["neverFirst", "Never first card"],
                  ["noAdjacent", "No two adjacent"],
                ] as const
              ).map(([key, label]) => (
                <div className="ad-mgr__field" key={key}>
                  <label>{label}</label>
                  <button
                    type="button"
                    className={`ad-mgr__chip${draft[key] ? " is-on" : ""}`}
                    onClick={() => set(key, !draft[key])}
                  >
                    {draft[key] ? "On" : "Off"}
                  </button>
                </div>
              ))}
              <div className="ad-mgr__field">
                <label>Max cards per day</label>
                <input
                  type="number"
                  min={1}
                  value={draft.maxPerDay}
                  onChange={(e) => set("maxPerDay", Number(e.target.value) || 5)}
                />
              </div>
              <div className="ad-mgr__field">
                <label>Min events in day</label>
                <input
                  type="number"
                  min={0}
                  value={draft.minEvents}
                  onChange={(e) => set("minEvents", Number(e.target.value) || 0)}
                />
              </div>
              <div className="ad-mgr__field">
                <label>Scatter position %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.scatterPct}
                  onChange={(e) => set("scatterPct", Number(e.target.value) || 45)}
                />
              </div>
            </div>
          )}

          <div className="ad-mgr__grid2" style={{ marginTop: 14 }}>
            <div className="ad-mgr__field">
              <label>Priority / weight</label>
              <input
                type="number"
                min={0}
                value={draft.weight}
                onChange={(e) => set("weight", Number(e.target.value) || 0)}
              />
            </div>
            <div className="ad-mgr__field">
              <label>Freq cap / session (0 = off)</label>
              <input
                type="number"
                min={0}
                value={draft.freqCap}
                onChange={(e) => set("freqCap", Number(e.target.value) || 0)}
              />
            </div>
            <div className="ad-mgr__field">
              <label>Flight start</label>
              <input
                type="date"
                value={draft.startDate?.slice(0, 10) || ""}
                onChange={(e) => set("startDate", e.target.value || null)}
              />
            </div>
            <div className="ad-mgr__field">
              <label>Flight end</label>
              <input
                type="date"
                value={draft.endDate?.slice(0, 10) || ""}
                onChange={(e) => set("endDate", e.target.value || null)}
              />
            </div>
            <div className="ad-mgr__field">
              <label>Lifetime impression cap (0 = unlimited)</label>
              <input
                type="number"
                min={0}
                value={draft.maxImpr}
                onChange={(e) => set("maxImpr", Number(e.target.value) || 0)}
              />
            </div>
            <div className="ad-mgr__field">
              <label>Contact</label>
              <input type="text" value={draft.contact || ""} onChange={(e) => set("contact", e.target.value)} />
            </div>
            <div className="ad-mgr__field ad-mgr__field--full">
              <label>Billing note</label>
              <input type="text" value={draft.billing || ""} onChange={(e) => set("billing", e.target.value)} />
            </div>
          </div>

          <label
            style={{
              display: "block",
              margin: "14px 0 8px",
              color: "#8a8a96",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily: "ui-monospace, monospace",
            }}
          >
            Target Pride days (none = all week)
          </label>
          <div className="ad-mgr__days">
            {EVENT_WEEK_DAYS.map((day) => {
              const on = draft.days.includes(day);
              const color = DAY_COLORS[day] || "#19e3ff";
              return (
                <button
                  key={day}
                  type="button"
                  className={`ad-mgr__day${on ? " is-on" : ""}`}
                  style={on ? { background: color, color: "#06060a" } : { color }}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>

        <div className="ad-mgr__actions">
          <button type="button" className="ad-mgr__save" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Save to live ads"}
          </button>
          {status.msg ? (
            <span className={`ad-mgr__status${status.kind === "ok" ? " is-ok" : status.kind === "err" ? " is-err" : ""}`}>
              {status.msg}
            </span>
          ) : (
            <span className="ad-mgr__status">Saves as scheduled (set live from the tracker).</span>
          )}
        </div>
      </div>

      <aside className="ad-mgr__preview">
        <div className="ad-mgr__preview-label">{previewLabel}</div>
        <div
          className={`ad-mgr__preview-panel${isPoster ? " ad-mgr__preview-panel--poster" : " ad-mgr__preview-panel--feed"}`}
        >
          {isPoster ? (
            <div className="ad-mgr__preview-poster-wrap">
              <PosterAdCard ad={draft} preview />
            </div>
          ) : (
            <div className="ad-mgr__preview-feed-wrap">
              <FeedAdCard ad={draft} preview />
            </div>
          )}
        </div>
        <p className="ad-mgr__preview-note">
          {isPoster
            ? "Poster uses the same PosterAdCard as /events - 2:3 media well, brand chip, solid Shop Now."
            : "Feed uses the same FeedAdCard as the hub - media, title, and footer CTA row."}
        </p>
      </aside>
    </div>
  );
}
