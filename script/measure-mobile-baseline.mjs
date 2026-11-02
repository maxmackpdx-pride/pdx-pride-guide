/** Read-only mobile load baseline. Run against an already-started local production build.
 * BASELINE_URL=http://127.0.0.1:5050 node script/measure-mobile-baseline.mjs
 * Optional: BASELINE_ROUTES=/,/events BASELINE_SAMPLES=3 BASELINE_OUTPUT=.local/performance
 * Chromium mobile emulation + software GPU is NOT physical iPhone/Safari validation.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const base = process.env.BASELINE_URL || 'http://127.0.0.1:5050';
const routes = (process.env.BASELINE_ROUTES || '/,/events,/directory,/outzide,/boardz').split(',').map(x => x.trim()).filter(Boolean);
const sampleCount = Number(process.env.BASELINE_SAMPLES || 3);
if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 20) throw Error('BASELINE_SAMPLES must be an integer from 1 to 20');
if (!routes.every(route => route.startsWith('/') && !route.startsWith('//'))) throw Error('Routes must be local paths');
const output = path.resolve(process.env.BASELINE_OUTPUT || '.local/performance');
await mkdir(output, { recursive: true });
let commit = process.env.BASELINE_COMMIT;
if (!commit) { try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { commit = 'unknown'; } }
const result = {
  measuredAt: new Date().toISOString(), base, commit,
  conditions: {
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
    network: process.env.BASELINE_NETWORK || 'unthrottled; executor network (loopback when local)',
    gpu: 'Chromium SwiftShader software renderer', auth: 'anonymous', sampleWindowMs: 5000,
    physicalDevice: false, sampleDeadlineMs: 45000,
    cache: 'Fresh browser context per cold sample; warm reload in same context; service workers blocked',
    limits: 'Top-frame Resource Timing excludes navigation and iframe resources and omits cross-origin byte detail without Timing-Allow-Origin; these byte totals are not total page transfer. Scroll frame timeout is recorded, not treated as smooth performance.'
  }, samples: []
};
const save = () => writeFile(path.join(output, 'mobile-load-baseline.json'), JSON.stringify(result, null, 2));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'], ...(process.env.BASELINE_PROXY ? { proxy: { server: process.env.BASELINE_PROXY } } : {}) });
result.browser = browser.version();
async function measure(page, route, sample, cache, errors, failed, httpErrors) {
  const started = Date.now();
  const response = cache === 'cold' ? await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 30000 }) : await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource'), images = resources.filter(x => x.initiatorType === 'img');
    const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);
    return {
      mapStartup: { events: window.__baselineMapReady || [], observedWithinWindow: !!window.__baselineMapReady?.length },
      navigation: navigation?.toJSON(), paint: performance.getEntriesByType('paint').map(x => x.toJSON()),
      resources: { count: resources.length, transferBytes: sum(resources, 'transferSize'), encodedBytes: sum(resources, 'encodedBodySize'), decodedBytes: sum(resources, 'decodedBodySize') },
      images: { count: images.length, transferBytes: sum(images, 'transferSize'), encodedBytes: sum(images, 'encodedBodySize'), largest: images.sort((a, b) => b.encodedBodySize - a.encodedBodySize).slice(0, 10).map(x => ({ url: x.name, encodedBytes: x.encodedBodySize, transferBytes: x.transferSize })) },
      brokenImages: [...document.images].filter(image => image.currentSrc && image.complete && image.naturalWidth === 0).map(image => ({ src: image.currentSrc, alt: image.alt })),
      document: { width: innerWidth, height: innerHeight, scrollHeight: document.documentElement.scrollHeight },
      iframes: [...document.querySelectorAll('iframe')].map(frame => ({ src: frame.src, sameOriginLoaded: (() => { try { return !!frame.contentWindow?.document?.body; } catch { return null; } })() }))
    };
  });
  const scroll = await page.evaluate(async () => {
    const initial = scrollY, frames = []; let previous = null, timedOut = false;
    for (let i = 0; i < 31; i++) {
      const gotFrame = await new Promise(resolve => {
        let raf;
        const timer = setTimeout(() => { cancelAnimationFrame(raf); resolve(false); }, 100);
        raf = requestAnimationFrame(now => {
          clearTimeout(timer);
          if (previous !== null) frames.push(now - previous);
          previous = now; scrollBy(0, 12); resolve(true);
        });
      });
      if (!gotFrame) { timedOut = true; break; }
    }
    return { initialY: initial, endY: scrollY, frameIntervalsMs: frames, timedOut, synthetic: true };
  });
  const row = { route, sample, cache, status: response.status(), elapsedMs: Date.now() - started, ...metrics, scroll, errors, failed, httpErrors };
  if (sample === 1 && cache === 'cold') {
    try { await page.screenshot({ path: path.join(output, `mobile-${route === '/' ? 'home' : route.slice(1).replace(/[^a-zA-Z0-9_-]/g, '_')}.png`), fullPage: false, timeout: 10000 }); }
    catch (error) { row.screenshotError = error.message; }
  }
  return row;
}
try {
  for (const route of routes) for (let sample = 1; sample <= sampleCount; sample++) {
    const context = await browser.newContext({ viewport: result.conditions.viewport, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
    await context.addInitScript(() => {
      performance.setResourceTimingBufferSize(10000);
      window.__baselineMapReady = [];
      window.addEventListener('zaylist:map-ready', event => window.__baselineMapReady.push({ atMs: performance.now(), detail: event.detail }));
    });
    const page = await context.newPage();
    for (const cache of ['cold', 'warm']) {
      const errors = [], failed = [], httpErrors = [];
      const onError = e => errors.push(e.message), onFailed = request => failed.push({ url: request.url(), error: request.failure()?.errorText });
      const onResponse = response => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status(), resourceType: response.request().resourceType(), expectedAnonymousAuth: response.status() === 401 && new URL(response.url()).origin === new URL(base).origin && new URL(response.url()).pathname === '/api/auth/me' }); };
      page.on('pageerror', onError); page.on('requestfailed', onFailed); page.on('response', onResponse);
      let timer, deadline = false;
      try {
        console.log('START', route, sample, cache);
        const row = await Promise.race([
          measure(page, route, sample, cache, errors, failed, httpErrors),
          new Promise((_, reject) => { timer = setTimeout(() => { deadline = true; reject(Error('45-second sample deadline exceeded')); }, 45000); })
        ]);
        result.samples.push(row);
      } catch (error) {
        result.samples.push({ route, sample, cache, error: error.message, errors, failed, httpErrors });
      } finally { clearTimeout(timer); page.off('pageerror', onError); page.off('requestfailed', onFailed); page.off('response', onResponse); await save(); }
      if (deadline) {
        if (cache === 'cold') result.samples.push({ route, sample, cache: 'warm', error: 'Not run: cold sample exceeded deadline; context closed' });
        break;
      }
    }
    await context.close(); await save();
  }
} finally { await browser.close(); await save(); }
console.log(JSON.stringify(result.samples.map(({ route, sample, cache, status, error, navigation, resources, images }) => ({ route, sample, cache, status, error, domContentLoadedMs: navigation?.domContentLoadedEventEnd, transferBytes: resources?.transferBytes, imageBytes: images?.encodedBytes })), null, 2));
