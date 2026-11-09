/** Capture React Profiler measurements from real production ZaylistCard components.
 * This is an isolated Vite + Chromium fixture, not a production runtime change.
 * Reports evidence, not a claimed optimization or an arbitrary pass threshold.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const fixture = 'script/fixtures/card-api-browser.tsx';

test('profile existing event and board cards under a parent update', { timeout: 200000 }, async t => {
  const cacheDir = await mkdtemp(path.join(tmpdir(), 'zaylist-react-profile-'));
  t.after(() => rm(cacheDir, { recursive: true, force: true }));
  const server = await createServer({
    configFile: false,
    root,
    cacheDir,
    publicDir: path.join(root, 'client/public'),
    optimizeDeps: { entries: [fixture], include: ['react/jsx-runtime', 'react/jsx-dev-runtime'] },
    plugins: [
      react(),
      { name: 'profile-card-fixture', configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/__profile-qa')) return next();
          const html = await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/script/fixtures/card-api-browser.tsx"></script></body></html>');
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        });
      } },
    ],
    resolve: { alias: {
      '@': path.join(root, 'client/src'),
      '@shared': path.join(root, 'shared'),
      '@assets': path.join(root, 'attached_assets'),
    } },
    server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
    define: {
      __OUTZIDE_ASSETS__: JSON.stringify({ script: '/outzide-map/app.js', maplibre: '/home-flight/vendor/maplibre-gl-5.6.2.js', maplibreCss: '/home-flight/vendor/maplibre-gl-5.6.2.css' }),
      __MAPZ_ASSETS__: '{}',
      __HOME_FLIGHT_BASE__: JSON.stringify('/home-flight'),
    },
  });
  let browser;
  try {
    await server.listen();
    await server.warmupRequest('/' + fixture);
    const base = server.resolvedUrls.local[0];
    browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const measurements = [];
    for (const family of ['event', 'board']) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      await context.route('**/api/**', route => {
        const pathname = new URL(route.request().url()).pathname;
        if (route.request().method() !== 'GET') return route.fulfill({ status: 403, json: { error: 'Browser profiler never writes' } });
        if (pathname === '/api/auth/me') return route.fulfill({ json: { id: 123, username: 'profiling', email: 'profile@example.invalid' } });
        if (pathname === '/api/hearts') return route.fulfill({ json: [] });
        return route.fulfill({ json: [] });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(base + '__profile-qa?family=' + family + '&size=small');
      await page.locator('#qa-grid [data-card-size]').first().waitFor({ state: 'visible', timeout: 30000 });
      await page.waitForFunction(() => Array.isArray(window.__zayCardRenderProfile) && window.__zayCardRenderProfile.length > 0, { timeout: 20000 });
      await page.evaluate(() => {
        window.__zayCardRenderProfile = [];
        window.dispatchEvent(new Event('zaylist-card-profile-tick'));
      });
      await page.waitForFunction(() => window.__zayCardRenderProfile?.some(x => x.phase === 'update'), { timeout: 15000 });
      const data = await page.evaluate(() => ({
        cards: document.querySelectorAll('#qa-grid [data-card-size]').length,
        commits: window.__zayCardRenderProfile,
      }));
      assert.equal(errors.length, 0, 'Uncaught browser errors: ' + errors.join('; '));
      assert.ok(data.cards >= 6, family + ' did not render the expected real cards');
      assert.ok(data.commits.length > 0, family + ' did not produce profiler measurements');
      for (const entry of data.commits) {
        assert.ok(Number.isFinite(entry.actualDurationMs) && entry.actualDurationMs >= 0, 'Invalid actualDuration');
        assert.ok(Number.isFinite(entry.baseDurationMs) && entry.baseDurationMs >= 0, 'Invalid baseDuration');
      }
      measurements.push({
        family, cards: data.cards, commits: data.commits.length,
        totalActualDurationMs: Number(data.commits.reduce((n, x) => n + x.actualDurationMs, 0).toFixed(3)),
        totalBaseDurationMs: Number(data.commits.reduce((n, x) => n + x.baseDurationMs, 0).toFixed(3)),
        browser: browser.version(),
        mode: 'uncompiled-existing-production-cards',
      });
      await context.close();
    }
    console.log('REACT_CARD_PROFILE ' + JSON.stringify(measurements));
  } finally {
    await browser?.close();
    await server.close();
  }
});
