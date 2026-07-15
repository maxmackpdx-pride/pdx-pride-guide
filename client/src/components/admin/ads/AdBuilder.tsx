import { useMemo, useState } from "react";
import FeedAdCard from "@/components/ads/FeedAdCard";
import PosterAdCard from "@/components/ads/PosterAdCard";
import {
  emptyAdDraft,
  templateDraft,
  type AdDraft,
  type AdFormat,
} from "@/lib/adTypes";
import { PRIDE_WEEK_DAYS } from "@shared/prideWeek";

const SWATCHES = ["#c8fa3c", "#19e3ff", "#ff1fa0", "#ff1f1f", "#ff8c00", "#b06bff"];

const DAY_COLORS: Record<string, string> = {
  MON: "#8800FF",
  TUE: "#0044FF",
  WED: "#FFEE00",
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#39FF14",
  SUN: "#FF6600",
};

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

  const pickTemplate = (format: AdFormat, template: "cockblock" | "new") => {
    if (format === "feed") {
      setDraft(template === "cockblock" ? templateDraft("cockblock-feed") : emptyAdDraft("feed"));
      if (template === "new") {
        setDraft((d) => ({
          ...d,
          business: "New business",
          title: "Your headline",
          body: "Short body copy for the feed card.",
          ctaTitle: "Shop now",
          ctaCopy: "your-site.com",
          primaryColor: "#ff1f1f",
        }));
      }
      return;
    }
    if (template === "cockblock") {
      setDraft(templateDraft("cockblock-poster"));
    } else {
      setDraft({
        ...templateDraft("mrs-poster"),
        business: "New business",
        title: "New business",
        body: "Poster-style grid ad that looks like an event card.",
        tag1: "Partner",
        tag2: "Local",
        destUrl: "https://example.com",
        primaryColor: "#39ff14",
        mediaMode: "single",
        singleSrc: null,
        slides: [],
        templateKey: null,
        source: "custom",
        contact: "",
        billing: "",
      });
    }
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
        ? "Live preview · events-grid slot"
        : "Live preview · in-feed slot",
    [draft.format],
  );

  return (
    <div className="ad-mgr__builder">
      <div className="ad-mgr__form">
        <section className="ad-mgr__card">
          <h3 className="ad-mgr__kicker">01 · Start from the template</h3>
          <p className="ad-mgr__help">
            Two ad formats. <strong className="cb">CockBlock</strong> is the news-feed slideshow
            card. <strong className="nb">New business</strong> is the events-grid poster ad that
            looks like an event card. Copy, colors, media and rules all stay editable.
          </p>
          <div className="ad-mgr__template-row">
            <button
              type="button"
              className={`ad-mgr__template-btn${draft.format === "feed" ? " is-selected" : ""}`}
              style={{ ["--tmpl-accent" as string]: "#ff1f1f" }}
              onClick={() => pickTemplate("feed", "cockblock")}
            >
              <span className="ad-mgr__template-bar" />
              <span>
                <div className="ad-mgr__template-name">News Feed Ad</div>
                <div className="ad-mgr__template-sub">CockBlock template · slideshow</div>
              </span>
            </button>
            <button
              type="button"
              className={`ad-mgr__template-btn${draft.format === "poster" ? " is-selected" : ""}`}
              style={{ ["--tmpl-accent" as string]: "#39ff14" }}
              onClick={() => pickTemplate("poster", "new")}
            >
              <span className="ad-mgr__template-bar" />
              <span>
                <div className="ad-mgr__template-name">Event Grid Ad</div>
                <div className="ad-mgr__template-sub">New business · poster card</div>
              </span>
            </button>
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
              <label>Badge label</label>
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
              <label>CTA title</label>
              <input type="text" value={draft.ctaTitle} onChange={(e) => set("ctaTitle", e.target.value)} />
            </div>
            <div className="ad-mgr__field">
              <label>CTA sub-line</label>
              <input type="text" value={draft.ctaCopy} onChange={(e) => set("ctaCopy", e.target.value)} />
            </div>
            <div className="ad-mgr__field">
              <label>Logo / wordmark text</label>
              <input type="text" value={draft.logoText} onChange={(e) => set("logoText", e.target.value)} />
            </div>
            <div className="ad-mgr__field">
              <label>Logo PNG upload</label>
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
            {draft.format === "poster" && (
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
              <label style={{ display: "block", margin: "10px 0 8px", color: "#8a8a96", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}>
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

          <label style={{ display: "block", margin: "14px 0 8px", color: "#8a8a96", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "ui-monospace, monospace" }}>
            Target Pride days (none = all week)
          </label>
          <div className="ad-mgr__days">
            {PRIDE_WEEK_DAYS.map((day) => {
              const on = draft.days.includes(day);
              const color = DAY_COLORS[day] || "#19e3ff";
              return (
                <button
                  key={day}
                  type="button"
                  className={`ad-mgr__day${on ? " is-on" : ""}`}
                  style={on ? { background: color, color: day === "WED" || day === "THU" ? "#06060a" : "#06060a" } : { color }}
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
        <div className="ad-mgr__preview-panel">
          {draft.format === "poster" ? (
            <PosterAdCard ad={draft} preview />
          ) : (
            <FeedAdCard ad={draft} preview />
          )}
        </div>
      </aside>
    </div>
  );
}
