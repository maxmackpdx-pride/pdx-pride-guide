import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { after, before, describe, test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { fanSlots, isPosterActivation } from "./flyerBoardBehavior";

const source = readFileSync(new URL("./FlyerBoard.tsx", import.meta.url), "utf8");

test("poster keyboard activation ignores nested share/save controls", () => {
  for (const key of ["Enter", " "]) {
    assert.equal(isPosterActivation(key, true), true);
    assert.equal(isPosterActivation(key, false), false);
  }
  assert.equal(isPosterActivation("Escape", true), false);
  assert.match(source, /isPosterActivation\(ev.key, ev.target === ev.currentTarget\)/);
});

test("every nonempty fan has the selected post at front, including 1–4 posts", () => {
  assert.deepEqual(fanSlots(0, 0), []);
  for (let count = 1; count <= 8; count++) {
    for (let selected = 0; selected < count; selected++) {
      const slots = fanSlots(count, selected);
      assert.equal(slots.length, Math.min(count, 5));
      assert.equal(new Set(slots.map(s => s.index)).size, slots.length);
      assert.equal(slots.find(s => s.offset === 0)?.index, selected);
      assert.ok(slots.every(s => s.index >= 0 && s.index < count));
    }
  }
});

test("event-attached connections never spill; venue-hinted ones pool by venue", async () => {
  const { connectionsForListing } = await import("./flyerBoardBehavior");
  const a = { id: 1, eventId: 10, venueHint: "Same venue" };
  const b = { id: 2, eventId: 11, venueHint: "Same venue" };
  const loose = { id: 3, eventId: null, venueHint: "Same venue" };
  // an event with its own connections gets exactly those — nothing spills in
  assert.deepEqual(connectionsForListing([a, b, a, loose], 10, "Same venue"), [a]);
  assert.deepEqual(connectionsForListing([a, b, loose], 11, "Same venue"), [b]);
  // an event with none of its own falls back to the venue pool
  assert.deepEqual(connectionsForListing([a, b, loose], 12, "Same venue"), [loose]);
  assert.deepEqual(connectionsForListing([a, b, loose], 12, "Elsewhere"), []);
});

describe("approved FlyerBoard interactions", {timeout:90_000}, () => {
  let server: ViteDevServer;
  let browser: Browser;
  let cacheDir: string;
  const today = Date.UTC(2026,10,18,20);
  const day = 86_400_000;
  const event = (id:number, start:number) => ({
    id,title:`Poster ${String(id).padStart(2,"0")}`,venueName:"Fixture Hall",dateStart:new Date(start).toISOString(),
    dateEnd:new Date(start+3_600_000).toISOString(),dayOfWeek:"WED",admission:"UNKNOWN",ageRequirement:"UNVERIFIED",
    description:"Fixture event",isPublic:true,isPrivate:false,eventTypes:"[]",posterImageUrl:"/poster-test.png",status:"LIVE",
  });
  const future = Array.from({length:64}, (_,i) => event(i+1,today+day*9+i*60_000));
  const past = event(100,today-day);
  let refreshSequence:number;

  before(async () => {
    cacheDir=await mkdtemp(join(tmpdir(),"zaylist-flyer-"));
    server=await createServer({cacheDir,logLevel:"error",server:{host:"127.0.0.1",port:0,hmr:false,watch:null}});
    await server.listen();
    browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
  });
  after(async () => {
    await browser?.close();
    await server?.close();
    if(cacheDir)await rm(cacheDir,{recursive:true,force:true});
  });

  async function boardPage(path:string) {
    const page=await browser.newPage({baseURL:server.resolvedUrls!.local[0],viewport:{width:1000,height:850},reducedMotion:"reduce"});
    page.setDefaultTimeout(10000);
    await page.route("**/*",route=>new URL(route.request().url()).origin===new URL(server.resolvedUrls!.local[0]).origin?route.continue():route.abort());
    await page.clock.setFixedTime(new Date(today));
    refreshSequence=0;
    // A local portrait fixture exercises the same <img> and torn-paper layers as a real flyer.
    await page.route("**/poster-test.png",route=>route.fulfill({contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="red"/></svg>'}));
    await page.route("**/api/**", route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==="/api/events"){
        refreshSequence++;
        return route.fulfill({json:[...future,past].map(row=>({...row,description:`Refreshed ${refreshSequence}`}))});
      }
      if(path==="/api/auth/session")return route.fulfill({contentType:"application/json",body:"null"});
      if(path==="/api/missed-connections")return route.fulfill({json:[
        {id:1,eventId:past.id,title:"Old post",body:"An earlier concert message",status:"ACTIVE",createdAt:new Date(today-day).toISOString(),closesAt:new Date(today-1).toISOString()},
        {id:2,eventId:past.id,title:"Second post",body:"Another concert message",status:"ACTIVE",createdAt:new Date(today-day).toISOString()},
      ]});
      if(path==="/api/ads/serve")return route.fulfill({json:{ads:[]}});
      if(path==="/api/card-notifications")return route.fulfill({json:{placez:[],scenez:[],outzide:[]}});
      return route.fulfill({json:[]});
    });
    await page.goto(path,{waitUntil:"domcontentloaded"});
    await page.locator(".fbx").first().waitFor().catch(async error=>{
      throw new Error(`${error} · ${(await page.locator("body").innerText()).slice(-2500)}`);
    });
    const closeFilters = page.getByRole("button", { name: "Close filters", exact: true });
    if (await closeFilters.isVisible()) {
      await closeFilters.click();
      await closeFilters.waitFor({ state: "hidden" });
    }
    return page;
  }
  const posterIds = (page:Page) => page.locator(".lboard .poster[data-event-id]").evaluateAll(nodes=>nodes.map(node=>Number((node as HTMLElement).dataset.eventId)));

  test("full board spans multiple fixed-size posters and opens Share from the expanded card",async t=>{
    const page=await boardPage("/events");t.after(()=>page.close());
    const poster=page.locator(".lboard .poster.torn").first();
    const art=poster.locator(".pc img");
    await poster.scrollIntoViewIfNeeded();
    await art.waitFor();
    await art.evaluate(img=>(img as HTMLImageElement).decode());
    const board = await page.locator(".fbx .lboard").first().boundingBox();
    const front = await poster.boundingBox();
    assert.ok(board && front && board.width > front.width * 2 && board.height >= front.height);
    assert.equal(await poster.locator(".trim").isVisible(),true);
    const artReceivesHits=await art.evaluate(img=>{
      const box=img.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
      return hit?.closest(".poster") === img.closest(".poster") && !hit?.closest(".trim");
    });
    assert.equal(artReceivesHits,true);
    assert.equal(await poster.getByRole("button", { name: /^Share / }).count(), 0);
    await poster.getByRole("button", { name: /interest/i }).click({trial:true});
    await poster.click();
    const expanded = page.getByTestId("event-modal");
    await expanded.getByRole("button", { name: /^Share / }).click();
    await page.getByRole("dialog", { name: "Share this event" }).waitFor();
  });

  test("a feed refresh preserves loaded rows and the caller’s descending title order",async t=>{
    const page=await boardPage("/events?sort=title_za");t.after(()=>page.close());
    await page.locator(".lboard .poster[data-event-id]").first().waitFor();
    const before=await posterIds(page);
    await page.getByRole("button",{name:/LOAD MORE/}).click();
    const expanded=await posterIds(page);
    assert.ok(expanded.length>before.length);
    assert.deepEqual(expanded,Array.from({length:expanded.length},(_,i)=>64-i));
    // Refresh the mounted board through its actual feed query, without remounting it.
    const initialRequests=refreshSequence;
    await page.evaluate(async()=>{
      const path="/src/lib/queryClient.ts";
      const {queryClient}=await import(path);
      await queryClient.invalidateQueries({queryKey:["/api/events","public-browse"],exact:true});
    });
    assert.equal(refreshSequence,initialRequests+1);
    assert.deepEqual(await posterIds(page),expanded);
  });

  test("fan traps focus, restores the opener on Escape and keeps expired post text readable",async t=>{
    const page=await boardPage("/events?past=1&window=ALL");t.after(()=>page.close());
    const opener=page.getByRole("button",{name:"Fan out mizzed connections for Poster 100"});
    await opener.focus();await page.keyboard.press("Enter");
    const fan=page.getByRole("dialog",{name:"Mizzed connections for Fixture Hall"});
    await fan.getByText("An earlier concert message",{exact:true}).waitFor();
    const close=fan.getByRole("button",{name:"Close mizzed connections"});
    await close.focus();await page.keyboard.press("Tab");
    assert.equal(await fan.evaluate(node=>node.contains(document.activeElement)),true);
    assert.equal(await close.evaluate(node=>node===document.activeElement),false);
    await page.keyboard.press("Shift+Tab");
    assert.equal(await close.evaluate(node=>node===document.activeElement),true);
    await page.keyboard.press("ArrowRight");
    await fan.getByText("Another concert message",{exact:true}).waitFor();
    assert.equal(await fan.locator(".fancard[inert]").filter({hasText:"An earlier concert message"}).count(),1);
    await page.keyboard.press("ArrowLeft");
    assert.equal(await fan.getByText("An earlier concert message",{exact:true}).isVisible(),true);
    await page.keyboard.press("Escape");await fan.waitFor({state:"hidden"});
    assert.equal(await opener.evaluate(node=>node===document.activeElement),true);
  });
});
