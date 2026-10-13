import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium } from 'playwright';

// Run against a local preview: DISCOVERY_TEST_URL=http://localhost:5051 node --test script/discovery-performance.test.mjs
// PLAYWRIGHT_CHROMIUM_EXECUTABLE optionally selects an already installed browser.
test('discovery effects pause, resume, and survive responsive changes', { skip: !process.env.DISCOVERY_TEST_URL }, async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 650 }, deviceScaleFactor: 0.5 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /Shader Error|VALIDATE_STATUS|Error creating WebGL/.test(message.text())) errors.push(message.text());
    });
    const url = path => new URL(path, process.env.DISCOVERY_TEST_URL).href;
    const plane = () => page.locator('.rg-stream-background--mobile-fallback').first();
    const expectDrawing = async () => {
      await plane().waitFor({state:'attached'});
      await page.waitForFunction(() => [...document.querySelectorAll('.rg-stream-background--mobile-fallback')].some(element => element.getAnimations().some(animation => animation.playState === 'running')));
    };
    const expectStopped = async () => {
      await page.waitForFunction(() => [...document.querySelectorAll('.rg-stream-background--mobile-fallback')].every(element => element.getAnimations().every(animation => animation.playState !== 'running')));
    };
    await page.goto(url('/directory'));
    const surfaces = await page.evaluate(() => { const root=getComputedStyle(document.documentElement); return {app:getComputedStyle(document.querySelector('.app-shell')).backgroundColor, ink:root.getPropertyValue('--ink-900').trim(), cardBase:root.getPropertyValue('--z-black').trim()}; });
    assert.equal(surfaces.app,'rgb(0, 0, 0)');
    assert.equal(surfaces.ink,'#050506');
    assert.equal(surfaces.cardBase,'#050506');
    await expectDrawing();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectStopped();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expectDrawing();
    await page.evaluate(() => document.documentElement.dataset.calm = 'true');
    await expectStopped();
    await page.evaluate(() => delete document.documentElement.dataset.calm);
    await expectDrawing();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expectStopped();
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expectDrawing();
    await page.setViewportSize({ width: 390, height: 844 });
    await expectDrawing();
    await page.setViewportSize({ width: 900, height: 650 });
    await expectDrawing();
    await plane().evaluate(canvas => canvas.style.top = '200vh');
    await expectStopped();
    await plane().evaluate(canvas => canvas.style.top = '');
    await expectDrawing();
    await page.goto(url('/needz'));
    await expectDrawing();
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
