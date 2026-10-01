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
    await page.addInitScript(() => {
      window.__shaderDraws = 0;
      for (const method of ['drawArrays', 'drawElements']) {
        const original = WebGL2RenderingContext.prototype[method];
        WebGL2RenderingContext.prototype[method] = function (...args) {
          if (this.canvas.classList.contains('rg-stream-background')) window.__shaderDraws++;
          return original.apply(this, args);
        };
      }
    });
    const url = path => new URL(path, process.env.DISCOVERY_TEST_URL).href;
    const draws = () => page.evaluate(() => window.__shaderDraws);
    const expectDrawing = async () => {
      const start = await draws();
      await page.waitForFunction(start => window.__shaderDraws > start, start, { timeout: 10000 });
    };
    const expectStopped = async () => {
      // A preference change may paint one still frame; wait for that to settle.
      let stable = false;
      for (let attempt = 0; attempt < 8; attempt++) {
        const start = await draws();
        await page.waitForTimeout(750);
        if (await draws() === start) { stable = true; break; }
      }
      assert.ok(stable, 'shader kept drawing while paused');
    };
    await page.goto(url('/boards'));
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
    await expectStopped();
    await page.setViewportSize({ width: 900, height: 650 });
    await expectDrawing();
    await page.locator('canvas.rg-stream-background').evaluate(canvas => canvas.style.transform = 'translateY(200vh)');
    await expectStopped();
    await page.locator('canvas.rg-stream-background').evaluate(canvas => canvas.style.transform = '');
    await expectDrawing();
    await page.goto(url('/'));
    await page.locator('.home-tonight__atmosphere canvas').waitFor({ state: 'attached' });
    await expectStopped();
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
