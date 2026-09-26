/* Emergency bootstrap: load last known-good river-flight and rewrite imports to same-origin. */
const SOURCE = 'https://cdn.jsdelivr.net/gh/maxmackpdx-pride/pdx-pride-guide@4ceed8aa898a6b0e88f5bd4c0f0b078bad0c7c38/client/public/zaydar-map/river-flight.js';

function rewrite(code) {
  return code
    .replace(/from '\.\/hologram-materials\.js\?v=[^']+'/g, "from './hologram-materials.js?v=20260926-place-beam'")
    .replace(/from '\.\/waypoint-markers\.js\?v=[^']+'/g, "from './waypoint-markers.js?v=20260926-place-beam'")
    .replace(/from '\.\//g, "from '/zaydar-map/")
    .replace(/from '\.\.\/home-flight\//g, "from '/home-flight/")
    .replace(/from '\.\.\/outzide-map\//g, "from '/outzide-map/");
}

const boot = window.__zaydarStartup || { phase() {}, fatal() {} };
boot.phase('script');

(async () => {
  try {
    const res = await fetch(SOURCE, { cache: 'force-cache' });
    if (!res.ok) throw new Error('bootstrap fetch ' + res.status);
    const code = rewrite(await res.text());
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    await import(url);
  } catch (err) {
    console.error('river-flight bootstrap failed', err);
    boot.fatal(err && err.message ? err.message : 'river-flight bootstrap failed');
  }
})();
