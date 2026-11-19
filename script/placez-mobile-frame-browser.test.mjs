/**
 * Actual-app PlaceZ phone regression. Start a seeded local app with
 * `PORT=42475 SESSION_SECRET=dev LOCAL_PREVIEW=1 npm run dev`, then run
 * `node --test script/placez-mobile-frame-browser.test.mjs`.
 */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {chromium} from 'playwright';

const base = 'http://127.0.0.1:42475';
const eaglePath = '/directory/5/eagle-portland';
const near = (actual, expected, name) =>
  assert.ok(Math.abs(actual - expected) <= 1, `${name}: ${actual} vs ${expected}`);

test('PlaceZ phone and artwork remain fixed while the actual Info tab scrolls', {timeout: 120000}, async () => {
  const browser = await chromium.launch({
    args: process.env.PLACEZ_CHROMIUM_SINGLE_PROCESS === '1'
      ? ['--no-zygote', '--single-process', '--disable-dev-shm-usage'] : [],
  });
  try {
    const page = await browser.newPage({
      viewport: {width: 390, height: 680}, hasTouch: true, isMobile: true,
      deviceScaleFactor: 1, serviceWorkers: 'block', reducedMotion: 'reduce',
    });
    // Keep the real Eagle record, artwork and routes. Force deterministic
    // overflow even if Eagle's public description is otherwise short.
    await page.route('**/api/directory/5', async route => {
      const response = await route.fetch();
      assert.ok(response.ok());
      const eagle = await response.json();
      eagle.description = 'Long venue description to exercise the Info scroll surface. '.repeat(20);
      await route.fulfill({response, json: eagle});
    });
    assert.equal((await page.goto(base + '/directory', {waitUntil: 'domcontentloaded'})).status(), 200);
    const opener = page.getByRole('button', {name: 'View details for Eagle Portland', exact: true}).first();
    const dialog = page.getByRole('dialog', {name: 'Eagle Portland', exact: true});
    await opener.click({timeout: 60000});
    const panel = dialog.getByRole('tabpanel', {name: 'Info', exact: true});
    const details = panel.locator('details').first();
    if (!(await details.evaluate(el => el.open))) await details.locator('summary').click();
    await page.waitForFunction(() => document.querySelector('.placez-mobile-dialog .pz-art__base')?.naturalWidth > 0);
    const state = () => panel.evaluate(el => {
      const box = node => node.getBoundingClientRect();
      const phone = el.querySelector('.place-modal-panel__contacts a[href^="tel:"]');
      const artwork = el.closest('article').querySelector('.pz-art__base');
      const tabs = el.closest('.pz-expanded-pager').querySelector('[role="tablist"]');
      const frame = box(el.closest('.placez-mobile-frame'));
      const nav = box(document.querySelector('.site-header'));
      const dock = box(document.querySelector('.z-mobile-dock'));
      const point = box(phone);
      const hit = document.elementFromPoint(point.left + point.width / 2, point.top + point.height / 2);
      return {
        phone: point.top, artwork: box(artwork).top, tabs: box(tabs).bottom,
        navMiddle: nav.top + nav.height / 2, dockMiddle: dock.top + dock.height / 2,
        top: frame.top, bottom: frame.bottom, left: frame.left, right: innerWidth - frame.right,
        doc: scrollY, details: box(el.querySelector('details')).top, hit: phone.contains(hit),
        height: el.clientHeight, total: el.scrollHeight, scroll: el.scrollTop,
      };
    });
    const before = await state();
    assert.equal(await dialog.getByRole('tab').count(), 5);
    assert.equal(await dialog.getByRole('tab', {name: 'Info', exact: true}).getAttribute('aria-selected'), 'true');
    near(before.top, before.navMiddle, 'top nav midpoint');
    near(before.bottom, before.dockMiddle, 'dock midpoint');
    near(before.left, 10, 'left gutter');
    near(before.right, 10, 'right gutter');
    assert.ok(before.phone >= before.tabs - 1, 'tabs are above phone');
    assert.ok(before.total > before.height + 50, 'real lower content overflows');

    const box = await panel.boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const x = Math.round(box.x + box.width * .5);
    const y = Math.round(box.y + box.height * .85);
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
    for (let step = 1; step <= 5; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove', touchPoints: [{x, y: y - step * Math.min(16, Math.floor(box.height / 9))}],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await page.waitForFunction(previous =>
      document.querySelector('.placez-mobile-dialog [role="tabpanel"][aria-hidden="false"]').scrollTop > previous + 20,
      before.scroll, {timeout: 5000});
    const after = await state();
    near(after.phone, before.phone, 'primary phone stayed pinned');
    near(after.artwork, before.artwork, 'artwork stayed pinned');
    near(after.doc, before.doc, 'document stayed put');
    assert.ok(after.details < before.details - 20, 'lower details moved');
    assert.ok(after.hit, 'pinned phone remains tappable');

    await dialog.getByRole('tab', {name: 'People'}).click();
    const people = dialog.getByRole('tabpanel', {name: 'People'});
    await people.waitFor();
    assert.equal(await people.locator('.place-modal-panel__contacts').count(), 0);
    await page.keyboard.press('Escape');
    await dialog.waitFor({state: 'detached'});
    assert.ok(await opener.evaluate(el => el === document.activeElement), 'Escape restores opener focus');

    assert.equal((await page.goto(base + eaglePath, {waitUntil: 'domcontentloaded'})).status(), 200);
    await dialog.getByRole('tabpanel', {name: 'Info', exact: true}).waitFor();
    await dialog.getByRole('button', {name: 'Close Eagle Portland'}).click();
    await page.waitForURL(url => url.pathname === '/directory');
    await dialog.waitFor({state: 'detached'});
  } finally {
    await browser.close();
  }
});
