/* Sidebar + page builder for the design system reference. */
(() => {
const NS = window.DS_NS, BANDS = window.DS_BANDS;
const nav = document.getElementById("nav"), host = document.getElementById("sections");
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const itemSlug = it => {
  if (!it.f) return slug(it.t);
  const m = it.f.match(/([^/]+)\.html(#(.+))?$/);
  return slug(m ? (m[3] ? m[1] + "-" + m[3] : m[1]) : it.f);
};
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let gi = 0;
for (const b of BANDS) {
  if (b.band) {
    nav.insertAdjacentHTML("beforeend", '<div class="band" data-band="' + slug(b.band) + '" style="--bc:var(' + b.c + ')"><span>' + b.band + '</span><i></i></div>');
    const bh = document.createElement("div");
    bh.className = "bandhead"; bh.dataset.band = slug(b.band);
    bh.style.setProperty("--bc", "var(" + b.c + ")");
    bh.innerHTML = '<h2>' + b.band + '</h2><span class="d">' + b.d + '</span>';
    host.appendChild(bh);
  }
  for (const g of b.groups) {
    const gn = String(gi++).padStart(2, "0"), gid = slug(g.n);
    nav.insertAdjacentHTML("beforeend", '<div class="grp" data-grp="' + gid + '"><b>' + gn + '</b>' + g.n + '</div>');
    const sec = document.createElement("section");
    sec.className = "grp"; sec.id = gid;
    if (b.c) sec.style.setProperty("--bc", "var(" + b.c + ")");
    sec.dataset.band = b.band ? slug(b.band) : "";
    sec.innerHTML = '<div class="grp-head"><span class="n">' + gn + '</span><h3>' + g.n + '</h3><span class="d">' + g.d + '</span></div>';
    let ii = 0;
    for (const it of g.items) {
      ii++;
      const aid = gid + "/" + itemSlug(it), st = it.st || "shipped";
      const tag = st === "queued" ? '<span class="tag q">queued</span>' : st === "draft" ? '<span class="tag d">draft</span>' : '<span class="tag sec-count"></span>';
      nav.insertAdjacentHTML("beforeend",
        '<a class="item" data-grp="' + gid + '" data-for="' + aid + '" href="#' + aid + '"><span class="n">' + gn + "." + ii + '</span><span>' + it.nav + '</span>' + tag + '</a>' +
        (it.f && !it.scroll ? '<div class="subs" data-for="' + aid + '"></div>' : ''));
      const art = document.createElement("article");
      art.id = aid;
      art.dataset.screenLabel = gn + "." + ii;
      const copy = it.c ? ("const { " + it.c.map(c => c.split("/")[1]).join(", ") + " } = window." + NS + ";") : (it.f || "");
      const acts = ['<button class="btn js-copy" data-copy="' + copy.replace(/"/g, "&quot;") + '">' + (it.c ? "Copy import" : "Copy path") + '</button>'];
      if (it.jsx) acts.push('<button class="btn js-copy" data-copy="' + it.jsx.replace(/"/g, "&quot;") + '">Copy JSX</button>');
      if (it.c) acts.push('<button class="btn js-props" data-c="' + it.c.join(",") + '">Props</button>');
      if (it.rules) acts.push('<button class="btn js-rules" data-src="' + it.rules + '">Copy the rules block</button>');
      const body = it.f
        ? '<div class="frame" data-w="' + it.w + '" data-h="' + it.h + '"' + (it.scroll ? ' data-scroll="1"' : '') + '><div class="scaler"><iframe loading="lazy" src="' + encodeURI(it.f) + '" width="' + it.w + '" height="' + it.h + '" scrolling="' + (it.scroll ? "auto" : "no") + '"></iframe></div></div>'
        : '<div class="nopreview">Preview queued. Props below are live from the source .d.ts.</div>';
      art.innerHTML = '<div class="cap"><h4>' + it.t + '</h4><span class="chip ' + st + '">' + st + '</span>' +
        (it.f ? '<span class="path">' + it.f + '</span>' : '') +
        '<span class="acts">' + acts.join("") + '</span>' +
        '<span class="sub">' + it.s + '</span></div>' + body +
        (it.jsx ? '<pre class="snippet">' + esc(it.jsx) + '</pre>' : '') +
        (it.c ? '<div class="props hidden"></div>' : '');
      sec.appendChild(art);
    }
    host.appendChild(sec);
  }
}

/* Stats read from the manifest, never hand-typed. */
fetch("_ds_manifest.json").then(r => r.json()).then(m => {
  const comps = (m.components || []).filter(c => /^[A-Z][a-z]/.test(c.name));
  document.getElementById("st-comps").textContent = comps.length;
  if (Array.isArray(m.tokens)) document.getElementById("st-tokens").textContent = m.tokens.length;
}).catch(() => {});
/* Spectrum stops: counted off --grad-rainbow itself. The tape wraps, so the
   repeated first colour at 100% is not a stop. */
(() => {
  const el = document.getElementById("st-stops");
  const g = getComputedStyle(document.documentElement).getPropertyValue("--grad-rainbow");
  const hexes = (g.match(/#[0-9a-f]{3,8}/gi) || []).map(s => s.toLowerCase());
  if (el && hexes.length) el.textContent = new Set(hexes).size;
})();

/* Copy to clipboard. */
addEventListener("click", e => {
  const b = e.target.closest(".js-copy"); if (!b) return;
  navigator.clipboard.writeText(b.dataset.copy).then(() => {
    const t = b.textContent; b.textContent = "Copied"; b.classList.add("done");
    setTimeout(() => { b.textContent = t; b.classList.remove("done"); }, 1200);
  }).catch(() => {});
});

/* The paste-into-Claude rules block, fetched from the handoff package. */
addEventListener("click", async e => {
  const b = e.target.closest(".js-rules"); if (!b) return;
  const label = b.textContent;
  b.textContent = "Reading…";
  try {
    const txt = await (await fetch(b.dataset.src)).text();
    await navigator.clipboard.writeText(txt);
    b.textContent = "Copied " + Math.round(txt.length / 1000) + "k"; b.classList.add("done");
  } catch (err) { b.textContent = "Unavailable"; }
  setTimeout(() => { b.textContent = label; b.classList.remove("done"); }, 1600);
});

/* Props tables, parsed live from the .d.ts. */
const dts = {};
function parseDts(src, name) {
  const i = src.indexOf("interface " + name + "Props");
  if (i < 0) return null;
  const start = src.indexOf("{", i); if (start < 0) return null;
  let depth = 0, j = start;
  for (; j < src.length; j++) { const ch = src[j]; if (ch === "{") depth++; else if (ch === "}") { depth--; if (!depth) break; } }
  const rows = []; let doc = "";
  for (const raw of src.slice(start + 1, j).split("\n")) {
    const line = raw.trim(); if (!line) continue;
    if (line.startsWith("/**") || line.startsWith("*") || line.startsWith("*/")) {
      if (line.startsWith("/**")) doc = "";
      doc += " " + line.replace(/^\/\*\*|^\*\/|^\*/, "").replace(/\*\/$/, "").trim();
      continue;
    }
    const m = line.match(/^(\w+)(\?)?\s*:\s*(.+?);?$/);
    if (m) { rows.push({ k: m[1], req: !m[2], t: m[3].replace(/;$/, ""), d: doc.trim() }); doc = ""; }
    else doc = "";
  }
  return rows;
}
addEventListener("click", async e => {
  const b = e.target.closest(".js-props"); if (!b) return;
  const panel = b.closest("article").querySelector(".props");
  if (!panel.classList.contains("hidden")) { panel.classList.add("hidden"); b.classList.remove("done"); return; }
  panel.classList.remove("hidden"); b.classList.add("done");
  if (panel.dataset.loaded) return;
  panel.dataset.loaded = "1";
  panel.innerHTML = '<div class="empty">Reading source…</div>';
  let out = "";
  for (const path of b.dataset.c.split(",")) {
    const name = path.split("/")[1];
    if (!dts[path]) { try { dts[path] = await (await fetch("components/" + path + ".d.ts")).text(); } catch (err) { dts[path] = ""; } }
    const rows = dts[path] ? parseDts(dts[path], name) : null;
    out += '<h5>' + name + '</h5>';
    if (!rows || !rows.length) { out += '<div class="empty">components/' + path + '.d.ts unreadable from here.</div>'; continue; }
    out += '<table>' + rows.map(r => '<tr><td class="k">' + r.k + (r.req ? '<span class="req">*</span>' : '') + '</td><td class="t">' + esc(r.t) + '</td><td class="d">' + esc(r.d) + '</td></tr>').join("") + '</table>';
  }
  panel.innerHTML = out;
});

/* Calm mode, propagated into every frame. */
let calm = false;
const calmBtn = document.getElementById("calm");
const applyCalm = doc => { try { doc.documentElement.setAttribute("data-calm", calm ? "true" : "false"); } catch (e) {} };
calmBtn.addEventListener("click", () => {
  calm = !calm; calmBtn.classList.toggle("on", calm);
  applyCalm(document);
  document.querySelectorAll(".frame iframe").forEach(fr => { try { if (fr.contentDocument) applyCalm(fr.contentDocument); } catch (e) {} });
});

/* Scaling: scoped to the frame that changed, rAF-debounced. */
function measure(f) {
  if (f.dataset.scroll) return +f.dataset.h;
  const fr = f.querySelector("iframe"); let h = +f.dataset.h;
  try {
    const d = fr.contentDocument;
    if (d && d.body) {
      const real = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
      if (real > 40) { h = real; fr.height = real; f.dataset.h = real; }
    }
  } catch (e) {}
  return h;
}
function scaleOf(f) { return Math.min(1, (f.clientWidth || f.parentElement.clientWidth) / +f.dataset.w); }
function fitOne(f) {
  const s = scaleOf(f);
  f.querySelector(".scaler").style.transform = "scale(" + s + ")";
  f.style.height = Math.round(measure(f) * s) + "px";
}
const pending = new Set(); let raf = 0;
function schedule(f) {
  pending.add(f);
  if (raf) return;
  raf = requestAnimationFrame(() => { raf = 0; const list = [...pending]; pending.clear(); list.forEach(fitOne); });
}
const fitAll = () => document.querySelectorAll(".frame").forEach(schedule);
addEventListener("resize", fitAll);
/* Mobile browser chrome show/hide and orientation */
if (window.visualViewport) {
  visualViewport.addEventListener("resize", fitAll);
}
addEventListener("orientationchange", () => setTimeout(fitAll, 120));

/* Section drill-in: the headings inside each panel become sidebar children. */
const HEAD = "h1,h2,h3,.lbl,.cap,.sec-title";
function indexSections(fr) {
  const art = fr.closest("article"), rail = nav.querySelector('.subs[data-for="' + CSS.escape(art.id) + '"]');
  const countEl = nav.querySelector('a.item[data-for="' + CSS.escape(art.id) + '"] .sec-count');
  let d; try { d = fr.contentDocument; } catch (e) { return; }
  if (!d) return;
  const seen = new Set(), heads = [];
  d.querySelectorAll(HEAD).forEach(el => {
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ");
    if (!txt || txt.length > 60 || seen.has(txt)) return;
    seen.add(txt); heads.push({ el, txt });
  });
  if (countEl && heads.length > 2) countEl.textContent = heads.length + " §";
  if (!rail || heads.length < 2) return;
  if (rail._heads && rail._heads.length === heads.length) { rail._heads = heads; rail._art = art; return; }
  rail.innerHTML = heads.map((h, i) =>
    '<a href="#' + art.id + '" data-i="' + i + '"' + (i > 2 ? ' class="extra"' : '') + '><span class="n">·' + String(i + 1).padStart(2, "0") + '</span><span>' + esc(h.txt) + '</span></a>').join("") +
    (heads.length > 3 ? '<button class="more">+ ' + (heads.length - 3) + ' more</button>' : "");
  rail._heads = heads;
  rail._art = art;
}
nav.addEventListener("click", e => {
  const more = e.target.closest(".more");
  if (more) {
    const rail = more.closest(".subs"); rail.classList.toggle("open");
    more.textContent = rail.classList.contains("open") ? "− collapse" : "+ " + (rail._heads.length - 3) + " more";
    return;
  }
  const sub = e.target.closest(".subs a");
  if (!sub) return;
  e.preventDefault();
  const rail = sub.closest(".subs"), h = rail._heads[+sub.dataset.i], art = rail._art;
  const frame = art.querySelector(".frame");
  const inner = h.el.getBoundingClientRect().top - h.el.ownerDocument.documentElement.getBoundingClientRect().top;
  const target = scrollY + frame.getBoundingClientRect().top + inner * scaleOf(frame) - 24;
  window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
});

function onFrameLoad(fr) {
  const f = fr.closest(".frame");
  schedule(f);
  let d = null;
  try { d = fr.contentDocument; } catch (e) { return; }
  if (!d) return;
  if (calm) applyCalm(d);
  if (f.dataset.scroll) return;
  if (!f.dataset.observed && window.ResizeObserver) {
    f.dataset.observed = "1";
    try { new ResizeObserver(() => schedule(f)).observe(d.documentElement); } catch (e) {}
  }
  try { indexSections(fr); } catch (e) { console.error("indexSections failed", f.parentElement && f.parentElement.id, e); }
}
/* Frames are lazy, `load` also fires for the about:blank placeholder, and some
   panels render their own body after load (readme.html builds itself from
   readme.md). So a frame is re-indexed on every tick until its heading count
   holds steady across three passes. indexSections is idempotent. */
function hasContent(fr) {
  try {
    const d = fr.contentDocument;
    return !!(d && d.readyState === "complete" && d.body && d.body.childElementCount > 0);
  } catch (e) { return false; }
}
function headCount(fr) {
  try { return fr.contentDocument.querySelectorAll(HEAD).length; } catch (e) { return -1; }
}
const state = new WeakMap();
function tryIndex(fr) {
  const st = state.get(fr) || { n: -1, stable: 0 };
  if (st.stable >= 3) return true;
  if (!hasContent(fr)) { state.set(fr, st); return false; }
  const n = headCount(fr);
  st.stable = n === st.n ? st.stable + 1 : 0;
  st.n = n;
  state.set(fr, st);
  onFrameLoad(fr);
  return st.stable >= 3;
}
function nudgeLoad(fr) {
  if (fr.dataset.nudged) return;
  fr.dataset.nudged = "1";
  fr.loading = "eager";
  if (!hasContent(fr)) fr.src = fr.getAttribute("src");
}
document.querySelectorAll(".frame iframe").forEach(fr => {
  fr.addEventListener("load", () => { schedule(fr.closest(".frame")); tryIndex(fr); });
});
/* IntersectionObserver is unreliable inside some preview hosts, so proximity is
   measured directly: every tick, any frame within a screen and a half of the
   viewport is forced to load, and any loaded frame is re-indexed. */
function pass() {
  let left = 0;
  document.querySelectorAll(".frame").forEach(f => {
    const fr = f.querySelector("iframe");
    if (!fr) return;
    const st = state.get(fr);
    if (st && st.stable >= 3) return;
    left++;
    const r = f.getBoundingClientRect();
    if (r.bottom > -1200 && r.top < innerHeight + 1200) nudgeLoad(fr);
    tryIndex(fr);
  });
  return left;
}
const ticker = setInterval(() => { if (!pass()) clearInterval(ticker); }, 500);
addEventListener("scroll", pass, { passive: true });
pass();
fitAll();

/* Search across items, their sections, groups and bands. */
const q = document.getElementById("q");
q.addEventListener("input", () => {
  const v = q.value.trim().toLowerCase();
  const liveBands = new Set();
  document.querySelectorAll("section.grp").forEach(sec => {
    let any = false;
    sec.querySelectorAll("article").forEach(a => {
      const hit = !v || a.textContent.toLowerCase().includes(v) || a.id.includes(v);
      a.classList.toggle("hidden", !hit); if (hit) any = true;
    });
    sec.classList.toggle("hidden", !any);
    nav.querySelectorAll('.grp[data-grp="' + CSS.escape(sec.id) + '"]').forEach(n => n.classList.toggle("hidden", !any));
    if (any && sec.dataset.band) liveBands.add(sec.dataset.band);
  });
  document.querySelectorAll(".band,.bandhead").forEach(el => {
    if (!el.dataset.band) return;
    el.classList.toggle("hidden", !!v && !liveBands.has(el.dataset.band));
  });
  nav.querySelectorAll("a.item").forEach(l => {
    const art = document.getElementById(l.dataset.for);
    const off = !!art && art.classList.contains("hidden");
    l.classList.toggle("hidden", off);
    const rail = nav.querySelector('.subs[data-for="' + CSS.escape(l.dataset.for) + '"]');
    if (rail) rail.classList.toggle("hidden", off);
  });
});

/* Active item tracking, on scroll rather than IntersectionObserver. */
const links = [...nav.querySelectorAll("a.item")];
let track = 0;
function markActive() {
  track = 0;
  const arts = [...document.querySelectorAll("article")].filter(a => !a.classList.contains("hidden"));
  let cur = arts[0];
  for (const a of arts) { if (a.getBoundingClientRect().top <= innerHeight * 0.28) cur = a; else break; }
  const id = cur && cur.id;
  links.forEach(l => l.classList.toggle("on", l.dataset.for === id));
}
addEventListener("scroll", () => { if (!track) track = requestAnimationFrame(markActive); }, { passive: true });
markActive();
})();
