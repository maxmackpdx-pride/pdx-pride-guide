import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import { publishedGlass, measureGlass, glassFlags } from "./card-glass-gate.mjs";
import { auditInterestApi } from "./card-api-gate.mjs";
import { eventAge, eventPrice } from "../client/src/lib/eventFacts.ts";

const [gate, ...args] = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(`npm run cards:gate:${gate} -- [--url http://127.0.0.1:PORT/events/ID/SLUG]
start  --ask "owner's exact words" prints the ordered start statement.
api    Checks interest and drawer ownership, then operates the Info and People consumers in an isolated browser.
glass  Repeat --url for more routes. Repeat --open for an ordered sequence of named buttons. An optional --selector and --accent select one actual paint layer.
copy   --transcript FILE saves the text. --review FILE verifies a JSON record with sha256, reviewer, kind (human or editorial), coldRead, voice and verdict. Use "pass" only after reading the captured words.
Set CARD_GATE_CHROME=bundled to use Playwright Chromium in place of system Chrome.`);
  process.exit(0);
}
const { values } = parseArgs({ args, options: {
  ask: { type: "string" }, url: { type: "string", multiple: true },
  open: { type: "string", multiple: true }, selector: { type: "string" }, accent: { type: "string" },
  review: { type: "string" }, transcript: { type: "string" },
} });
const urls = values.url ?? [(process.env.CARD_GATE_ORIGIN ?? "http://127.0.0.1:5000") + "/events/2022/yes-coach-3-year-anniversary"];

function start() {
  const ask = values.ask ?? "Every ask in the ledger, in order.";
  const filters = [
    `Owner’s ask, exactly as stated: ${ask}`,
    "Carry the standing rulings forward. Use the landed glass, guide tokens, locked edges, set card sizes and sliders.",
    "Check behavior and layout on zaylist.com. Read the playground for design and the guide for tokens.",
    "Write for a reader who may invest. Keep pitches and the five investor points in Business and Growth.",
    "Use Z-Black, Barlow Condensed, Barlow, JetBrains Mono and the canonical spectrum. Use the founder’s voice. Keep em dashes out of paragraphs.",
    "Operate the controls at 402 × 874. Capture before and after.",
    "Report the state earned: demo, built, deployed or live-verified.",
  ];
  console.log("Start gate · state these seven filters before designing");
  filters.forEach((item, index) => console.log(`${index + 1}. ${item}`));
}

async function newPhone(browser, url) {
  const target = new URL(url);
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(target.hostname), "Use a loopback app URL for the local browser checks");
  const context = await browser.newContext({ viewport: { width: 402, height: 874 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  return page;
}

async function clickTab(card, tab) {
  const button = card.getByRole("navigation", { name: "Event pages" }).getByRole("button", { name: tab, exact: true });
  await button.click();
  const active = card.locator("section[aria-hidden=false]").and(card.getByRole("region", { name: tab, exact: true }));
  await active.waitFor();
  return active;
}

async function visitCard(page, url) {
  const detailRequest = page.waitForResponse(response => /\/api\/events\/\d+\/detail$/.test(new URL(response.url()).pathname));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const detail = await detailRequest;
  assert.equal(detail.status(), 200, "Event detail API");
  const card = page.locator(".evz-x");
  await card.waitFor();
  return { card, detail: await detail.json() };
}

async function checkApi(browser) {
  const findings = await auditInterestApi();
  assert.deepEqual(findings, [], "Shared interest API consumers and write ownership");
  const page = await newPhone(browser, urls[0]);
  // Change only the read response in this isolated browser. An API edit must
  // reach both the Info and People presentations through the existing endpoint.
  const name = "Card gate host";
  await page.route(/\/api\/events\/\d+\/detail(?:\?|$)/, async route => {
    const response = await route.fetch();
    if (!response.ok()) return route.fulfill({ response });
    const json = await response.json();
    json.hostGroup = { ...json.hostGroup, name, slug: "card-gate-group" };
    json.hosts = [{ userId: 91, username: "card-gate-profile", displayName: name, role: "PRIMARY" }];
    delete json.sourceLink;
    await route.fulfill({ response, json });
  });
  const { card } = await visitCard(page, urls[0]);
  const info = await clickTab(card, "Info");
  await info.getByRole("link", { name, exact: true }).waitFor();
  assert.equal(await info.getByRole("link", { name, exact: true }).getAttribute("href"), "/z/card-gate-group");
  assert.equal(await info.getByRole("link", { name: "Source link" }).count(), 0, "API-omitted source must be absent");
  const people = await clickTab(card, "People");
  const person = people.getByRole("link", { name: new RegExp(name) });
  await person.waitFor();
  assert.equal(await person.getAttribute("href"), "/u/card-gate-profile");
  await person.click();
  await page.waitForURL(url => url.pathname === "/u/card-gate-profile");
  console.log("API evidence: six interest presentations and five drawer consumers used the shared owners, no direct literal hearts writes outside that owner, and one changed detail response reached Info and People. The guest source action stayed absent. The host row opened its profile route.");
}

async function checkGlass(browser, standard) {
  let total = 0;
  const seen = new Set();
  const warnings = new Set();
  for (const url of urls) {
    const page = await newPhone(browser, url);
    try {
      if (/^\/events\/\d+/.test(new URL(url).pathname)) await visitCard(page, url);
      else await page.goto(url, { waitUntil: "domcontentloaded" });
      if (new URL(url).pathname === "/directory" && !values.open) {
        await page.getByRole("button", { name: /^Open .*filters, events, upcoming and saved$/i }).click();
        const sizes = page.getByRole("group", { name: "Card size" });
        await sizes.getByRole("button", { name: "Small cards" }).click();
        await sizes.getByRole("button", { name: "Wide cards" }).click();
      }
      for (const name of values.open || []) await page.getByRole("button", { name, exact: true }).click();
      const selector = values.selector || "[data-glass-piece]";
      const pieces = page.locator(selector).first();
      await pieces.waitFor({ state: "attached" });
      async function measure() {
        const rows = await page.evaluate(measureGlass, { selector, accent: values.accent || "--glass-piece-tone" });
        for (const row of rows) seen.add(row.piece);
        for (const flag of glassFlags(rows, standard)) warnings.add(flag);
        total += rows.length;
      }
      await measure();
      const card = page.locator(".evz-x");
      if (await card.count() && !values.open) {
        const actions = card.locator(".evz-actions button");
        for (const action of await actions.all()) {
          await action.click();
          const drawer = card.locator(".evz-action-drawer");
          await drawer.waitFor();
          await measure();
          await drawer.getByRole("button", { name: /^Close /i }).first().click();
        }
        for (const label of ["Feed", "Info", "Maps", "People", "More", "Nearby"]) {
          await clickTab(card, label);
          await measure();
        }
      }
    } catch (error) {
      warnings.add(`${new URL(url).pathname}: incomplete measurement (${error.message.split("\n")[0]})`);
    } finally { await page.context().close(); }
  }
  if (!total) warnings.add("No rendered glass pieces measured.");
  if (!values.selector) {
    const expected = ["deep", "overlay", "navbar", "dock", "button", "slider", "mapchrome", "scrim", "artwork"];
    const missing = expected.filter(piece => !seen.has(piece));
    if (missing.length) warnings.add(`Pieces outside this run’s measured coverage: ${missing.join(", ")}`);
  }
  console.log(`Glass advisory · ${standard.release}\n${standard.source}\n${total} paint samples; pieces: ${[...seen].join(", ")}`);
  for (const warning of warnings) console.warn(`FLAG ${warning}`);
  console.log(`${warnings.size} advisories. Owner-authorized work proceeds.`);
}

async function checkCopy(browser) {
  const page = await newPhone(browser, urls[0]);
  const { card, detail } = await visitCard(page, urls[0]);
  const event = detail.event;
  assert.ok(Number.isInteger(event.id) && event.title && event.venueName, "Machine-readable event ID, title and venue");
  assert.equal((await card.locator(".evz-x__title").textContent()).trim(), event.title);
  assert.ok((await card.locator(".evz-x__when").textContent()).includes(event.venueName));
  if (detail.venue?.id) {
    const venueLink = card.locator(".evz-x__when a");
    await venueLink.waitFor();
    assert.ok((await venueLink.getAttribute("href")).split("/").includes(String(detail.venue.id)), "Venue link preserves API identity");
  }
  const chips = await card.locator(".evz-x__chip").allTextContents();
  const expectedChips = [event.isClaimed || event.claimedBy ? "Claimed" : "Unclaimed"];
  if (event.admission && event.admission !== "UNKNOWN") expectedChips.push(eventPrice(event.admission));
  if (eventAge(event.ageRequirement) !== "Not stated") expectedChips.push(eventAge(event.ageRequirement));
  if (event.isSexPositive) expectedChips.push("Sex-positive");
  assert.deepEqual(chips, expectedChips, "Rendered chips must preserve the API's facts and unknowns");
  const sections = new Map();
  const paragraphFlags = new Set();
  for (const label of ["Info", "Maps", "People", "More", "Nearby", "Feed"]) {
    const pane = await clickTab(card, label);
    const rendered = await pane.innerText();
    sections.set(label, rendered);
    const paragraphs = rendered.split(/\n+/);
    for (const text of paragraphs) {
      // Exact source descriptions are data supplied by organizers.
      if (/\w.*—.*\w/u.test(text) && text !== event.description) paragraphFlags.add(text.trim());
    }
  }
  const actions = card.locator(".evz-actions button");
  for (const action of await actions.all()) {
    await action.click();
    const drawer = card.locator(".evz-action-drawer");
    await drawer.waitFor();
    sections.set("Action · " + await drawer.getAttribute("aria-label"), await drawer.innerText());
    await drawer.getByRole("button", { name: /^Close /i }).first().click();
  }
  sections.set("Header", await card.locator("header").first().innerText());
  sections.set("Footer", await card.locator("footer").first().innerText());
  const transcript = [...sections].map(([section, text]) => `[${section}]\n${text.trim()}`).join("\n\n");
  // A ticking number is data. Preserve its units and every authored word when
  // fingerprinting copy, so the same cold read remains valid at the next tick.
  const reviewText = transcript.replace(/(STARTS IN\n)((?:\d+[DHM] ?)+)(?=\n)/g,
    (_, label, clock) => label + clock.replace(/\d+/g, "#"));
  const digest = createHash("sha256").update(reviewText).digest("hex");
  if (values.transcript) await writeFile(values.transcript, transcript + "\n");
  console.log(`Copy · ${event.title}\nAPI title, venue, claim status, admission and age facts matched.\nCopy fingerprint SHA-256 ${digest}`);
  for (const text of paragraphFlags) console.warn(`COPY FLAG ${text}`);
  if (values.review) {
    const review = JSON.parse(await readFile(values.review, "utf8"));
    assert.equal(review.sha256, digest, "Copy changed since the supplied human read");
    assert.ok(review.reviewer?.trim() && review.coldRead?.trim() && review.voice?.trim(), "Name the reader and record their cold-read and voice findings");
    assert.equal(review.verdict, "pass", "Reviewer's verdict");
    assert.ok(review.kind === "human" || review.kind === "editorial", "Identify the review as human or editorial");
    if (review.kind === "editorial") {
      console.warn("EDITORIAL READ RECORDED · A human reader has not signed this fingerprint.");
      process.exitCode = 2;
    }
    console.log(`Read by ${review.reviewer}\nCold read: ${review.coldRead}\nFounder’s voice: ${review.voice}`);
  } else {
    console.warn("REVIEW OPEN · Read the transcript cold. Compare the wording with Tucker’s voice. Supply --review with the reader, actual findings and the matching fingerprint. Use --transcript to save what was displayed.");
    process.exitCode = 2;
  }
  if (paragraphFlags.size) process.exitCode = 1;
}

async function main() {
  if (gate === "start") return start();
  assert.ok(["api", "glass", "copy"].includes(gate), "Choose start, api, glass or copy.");
  const standard = gate === "glass" ? await publishedGlass() : null;
  const browser = await chromium.launch(process.env.CARD_GATE_CHROME === "bundled" ? {} : { channel: "chrome" });
  try {
    if (gate === "api") await checkApi(browser);
    if (gate === "glass") await checkGlass(browser, standard);
    if (gate === "copy") await checkCopy(browser);
  } finally { await browser.close(); }
}
main().catch(error => {
  console.error(`${gate === "glass" ? "GLASS ADVISORY · comparison unavailable" : "GATE INCOMPLETE"} · ${error.message}`);
  if (gate !== "glass") process.exitCode = 1;
});
