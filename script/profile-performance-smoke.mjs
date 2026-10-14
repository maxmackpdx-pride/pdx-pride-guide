import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

// Software browser smoke evidence, not physical iOS or battery certification.
// Run against the completed production preview, never the dev server.
const base = process.env.PROFILE_TEST_URL;
const username = process.env.PROFILE_TEST_USERNAME || 'tucker_pdmax';
test('profile renders identity and keeps arrangement and unopened overlays deferred', { skip: !base }, async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    const scripts = [];
    const errors = [];
    page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    const profile = new URL(`/u/${encodeURIComponent(username)}`, base).href;
    async function identity(label) {
      const started = performance.now();
      await page.goto(profile, {waitUntil: 'domcontentloaded'});
      await page.locator('.pp-hero__name').waitFor({state:'visible'});
      const elapsed = performance.now() - started;
      assert.ok((await page.locator('.pp-hero__name').innerText()).trim());
      const geometry = await page.evaluate(() => ({
        width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        titleFont: getComputedStyle(document.querySelector('.pp-hero__name')).fontFamily,
        staticGrid: !!document.querySelector('.pp-widget-static'),
      }));
      assert.equal(geometry.overflow, false, `${label} has horizontal overflow`);
      assert.match(geometry.titleFont, /Barlow Condensed/);
      return {label, identityMs: Math.round(elapsed), ...geometry};
    }
    const cold = await identity('cold software390');
    const initialScripts = [...scripts];
    console.log(JSON.stringify({environment:"local production preview; desktop software Chromium",cold,initialScripts}));
    for (const name of ['draggable-widget-grid', 'EventModal-', 'PlaceModal-', 'Top8Editor-', 'MessageModal-']) {
      assert.ok(!initialScripts.some(url => url.includes(name)), `${name} loaded before its tools were opened`);
    }
    await page.goto(new URL('/about',base).href,{waitUntil:'domcontentloaded'});
    const returning = await identity('return software390');
    await page.setViewportSize({width:320,height:740});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'320px profile overflows');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({environment:'local production preview; desktop software Chromium; no phone certification',cold,returning,initialScripts,notes:'FlyerStash may legitimately load if within500px of viewport; no timing pass threshold asserted.'}));
  } finally { await browser.close(); }
});
