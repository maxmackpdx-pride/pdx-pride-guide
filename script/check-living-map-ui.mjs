// Local rendered geometry + interaction regression check. Does not modify app data.
// Start npm run dev on port 8080, then: node script/check-living-map-ui.mjs
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = process.env.MAP_CHECK_URL || "http://localhost:8080";
const out = ".local/map-ui-check";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
const box = async locator => { const b = await locator.boundingBox(); assert.ok(b, "Element must have visible bounds"); return b; };
const settle = page => page.waitForTimeout(600);

try {
  for (const [name, width, height] of [["desktop",1440,1000],["laptop",1280,720],["tablet",820,900],["phone",390,844],["small-phone",375,667],["landscape",667,375]]) {
    const mobile = width < 768;
    const context = await browser.newContext({viewport: {width,height}, hasTouch: mobile, isMobile: mobile, geolocation: {latitude:45.523,longitude:-122.676}, permissions:["geolocation"]});
    const page = await context.newPage();
    await page.goto(`${base}/map`, {waitUntil:"networkidle"});
    const region = page.locator(".living-map-page");
    await region.waitFor();
    const bounds = await box(region);
    const key = page.getByRole("button", {name:"Key",exact:true});
    const locate = page.getByRole("button", {name:"Locate me",exact:true});
    const post = page.getByRole("button", {name:"Post to the map",exact:true});
    for (const control of [key, locate, post, page.getByRole("button",{name:"Zoom in",exact:true}), page.getByRole("button",{name:"Zoom out",exact:true})]) {
      const b = await box(control);
      assert.ok(b.width >= 44 && b.height >= 44, `${name}: 44px target`);
      assert.ok(b.x >= 0 && b.y >= bounds.y && b.x+b.width <= width+1 && b.y+b.height <= bounds.y+bounds.height+1, `${name}: control in map`);
    }
    assert.equal(await region.evaluate(e=>e.scrollWidth>e.clientWidth), false, `${name}: no map horizontal overflow`);
    const tools = await box(page.locator(".living-map-tools"));
    const drawer = await box(page.locator(".living-map-drawer"));
    assert.equal(overlap(tools,drawer),false,`${name}: controls clear drawer`);
    const attribution = await box(page.locator(".leaflet-control-attribution"));
    assert.equal(overlap(attribution,drawer),false,`${name}: attribution clear drawer`);
    if (!mobile) assert.equal(overlap(tools,await box(page.locator(".living-map-screen-rail"))),false,`${name}: controls clear screen rail`);
    await page.screenshot({path:`${out}/${name}-closed.png`});

    await key.click();
    const panel = page.locator("#living-map-key-panel");
    const panelBox = await box(panel);
    assert.ok(panelBox.y >= bounds.y && panelBox.x >= 0 && panelBox.x+panelBox.width <= width+1,`${name}: Key stays on screen`);
    await panel.evaluate(e=>e.scrollTop=e.scrollHeight);
    assert.ok(await panel.evaluate(e=>e.scrollHeight-e.scrollTop <= e.clientHeight+1),`${name}: Key scrolls to end`);
    await page.keyboard.press("Escape");
    assert.equal(await key.evaluate(e=>e===document.activeElement),true,`${name}: Key restores focus`);
    await post.click(); await settle(page);
    assert.equal(await page.locator("#living-map-create-menu a").count(),7);
    await page.keyboard.press("Escape");
    assert.equal(await post.evaluate(e=>e===document.activeElement),true,`${name}: Post restores focus`);
    await locate.click(); await page.waitForFunction(()=>!document.querySelector('[aria-label="Locate me"]')?.disabled);

    if (mobile) {
      const filters = page.getByRole("button",{name:"Open map filters",exact:true});
      await filters.click(); await settle(page);
      const filterPanel = page.locator("#living-map-filter-panel");
      const fb = await box(filterPanel);
      assert.ok(fb.y >= bounds.y && fb.x >= 0 && fb.x+fb.width <= width+1,`${name}: filters stay on screen`);
      await page.getByRole("button",{name:"Custom date range",exact:true}).click();
      await page.getByLabel("From",{exact:true}).fill("2026-09-08");
      await page.getByLabel("To",{exact:true}).fill("2026-09-12");
      assert.equal(await filterPanel.evaluate(e=>e.scrollWidth>e.clientWidth),false,`${name}: date fields do not widen filter panel`);
      await page.waitForFunction(()=>location.search.includes("when=custom") && location.search.includes("to=2026-09-12"));
      await page.getByRole("button",{name:"Reset filters",exact:true}).click();
      await page.waitForFunction(()=>!location.search.includes("when="));
      await page.screenshot({path:`${out}/${name}-filters.png`});
      await page.keyboard.press("Escape");
      assert.equal(await filters.evaluate(e=>e===document.activeElement),true,`${name}: filters restore focus`);
      const handle = page.getByRole("button",{name:"Open map drawer",exact:true});
      await handle.click(); await settle(page);
      const open = await box(page.locator(".living-map-drawer"));
      const dock = await page.locator(".site-hub-mobile-bar").boundingBox();
      const dockTop = dock?.height ? dock.y : height;
      assert.ok(Math.abs(open.y+open.height-dockTop)<2,`${name}: drawer ends at dock or viewport edge when nav is hidden`);
      assert.equal(overlap(open,attribution),false,`${name}: attribution clear expanded drawer`);
      const feed = page.locator(".living-map-drawer-scroll");
      await feed.evaluate(e=>e.scrollTop=e.scrollHeight);
      assert.ok(await feed.evaluate(e=>e.scrollHeight-e.scrollTop <= e.clientHeight+1),`${name}: full drawer feed reachable`);
      await page.screenshot({path:`${out}/${name}-expanded.png`});
      await page.getByRole("button",{name:"Close map drawer",exact:true}).click(); await settle(page);
      const closed = await box(page.locator(".living-map-handle"));
      assert.ok(Math.abs(closed.y+closed.height-dockTop)<2,`${name}: grip rests on dock`);
      assert.equal(await page.getByRole("button",{name:"Open map filters",exact:true}).count(),1);
    }
    console.log(`PASS ${name} ${width}×${height}`);
    await context.close();
  }
  const touchPage = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  await touchPage.goto(`${base}/map`,{waitUntil:"networkidle"});
  const cdp = await touchPage.context().newCDPSession(touchPage);
  const swipe = async (x,y,end) => {
    await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
    for(let i=1;i<=18;i++) {
      await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y+(end-y)*i/18}]});
      await touchPage.waitForTimeout(15);
    }
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await settle(touchPage);
  };
  const grip = touchPage.locator(".living-map-handle");
  let h = await box(grip);
  await swipe(h.x+h.width/2,h.y+25,h.y-300);
  assert.equal(await grip.getAttribute("aria-expanded"),"true","Swipe up opens fully");
  h = await box(grip);
  await swipe(h.x+h.width/2,h.y+25,h.y+375);
  assert.equal(await grip.getAttribute("aria-expanded"),"false","Swipe down stays closed");
  await grip.tap(); await settle(touchPage);
  assert.equal(await grip.getAttribute("aria-expanded"),"true","Tap after drag is not swallowed");
  const place = touchPage.locator(".living-map-card.place").first();
  const card = await box(place);
  await swipe(card.x+60,card.y+90,card.y-100);
  const feed = touchPage.locator(".living-map-drawer-scroll");
  assert.ok(await feed.evaluate(e=>e.scrollTop>20),"Thumb swipe on a card scrolls feed");
  assert.ok(!touchPage.url().includes("place="),"Scroll does not open card");
  await feed.evaluate(e=>e.scrollTop=0);
  await place.tap();
  await touchPage.waitForFunction(()=>location.search.includes("place="));
  console.log("PASS touch: open, close, tap after drag, card scroll versus tap");
  await touchPage.close();
} finally { await browser.close(); }
