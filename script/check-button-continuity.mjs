// Run against a local production preview; reads UI and never submits forms.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.BUTTON_TEST_URL || 'http://127.0.0.1:5053';
const browser = await chromium.launch({headless:true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {})});
const read = locator => locator.evaluate(el => {
  const s=getComputedStyle(el),r=el.getBoundingClientRect();
  return {color:s.color,bg:s.backgroundColor,image:s.backgroundImage,radius:s.borderRadius,shadow:s.boxShadow,font:s.fontFamily,case:s.textTransform,height:r.height,width:r.width,outline:s.outlineStyle};
});
try {
 for (const width of [1440,390]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.goto(base+'/pride-work',{waitUntil:'domcontentloaded'});
  // Board post actions are the quiet utility-layer button; the lime fill lives on the auth submit.
  const action=page.getByRole('button',{name:'Post a gig',exact:true});await action.waitFor();
  await page.waitForTimeout(200);
  const rest=await read(action);
  assert.ok(rest.height>=44,'post action hit target');assert.equal(rest.shadow,'none','post action has no bloom');
  await action.hover();await page.waitForTimeout(250);const hover=await read(action);
  assert.notEqual(hover.bg,rest.bg,'hover fills the post action');assert.equal(hover.radius,rest.radius,'hover keeps the shape');
  await page.mouse.move(1,1);await action.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
  assert.equal((await read(action)).outline,'solid','keyboard focus');
  await action.click();const dialog=page.getByRole('dialog');await dialog.waitFor();await page.waitForTimeout(600);
  for(const label of ['Close','Your account, step 1 of 2','Password, step 2 of 2']) {const c=dialog.getByRole('button',{name:label,exact:true}).first();const s=await read(c);assert.ok(s.width>=44&&s.height>=44,label+' hit target');}
  const submit=dialog.locator('button[type="submit"]').last();const submitStyle=await read(submit);
  assert.equal(submitStyle.bg,'rgb(204, 255, 0)','auth submit is the lime primary');assert.equal(submitStyle.radius,'22px');assert.ok(submitStyle.height>=44);
  await page.keyboard.press('Escape');
  const disabled=page.getByRole('button',{name:'Next gigs',exact:true});
  if(await disabled.isDisabled()){const ds=await disabled.evaluate(el=>getComputedStyle(el));assert.equal(ds.boxShadow,'none');assert.ok(Number(ds.opacity)<=.5,'disabled is visibly distinct');}
  await page.goto(base+'/contact',{waitUntil:'domcontentloaded'});const secondary=page.locator('.pdxBtn').first();await secondary.waitFor();const sec=await read(secondary);assert.equal(sec.bg,'rgb(0, 0, 0)');assert.equal(sec.color,'rgb(255, 0, 204)');assert.equal(sec.radius,'22px');
  await page.evaluate(()=>document.documentElement.classList.add('calm-mode'));await page.waitForTimeout(200);const calm=await read(secondary);assert.ok(!calm.shadow.includes('18px'),'Calm Mode removes outer bloom');
  await page.evaluate(() => {
    document.documentElement.classList.remove('calm-mode');
    const fixture=document.createElement('div'); fixture.id='button-contract-fixture';
    fixture.style.cssText='position:fixed;top:120px;left:20px;z-index:100001;display:flex;flex-wrap:wrap;max-width:calc(100vw - 40px);gap:16px;background:#050506;padding:12px';
    fixture.innerHTML='<button class="zay-action zay-action--solid pdx-glass-rebind">Context primary</button><button class="zay-action zay-action--destructive pdx-glass-rebind">Delete</button><div class="pdxBoard--affiliate-cb"><span class="pdxBoard__affShop pdx-glass-btn pdx-glass-btn--solid pdx-glass-rebind" style="--c:#ff1f1f">Shop now</span></div>';
    document.body.append(fixture);
  });
  const primary=page.locator('#button-contract-fixture .zay-action--solid');
  for(const [context,color] of [['hub','rgb(0, 255, 255)'],['admin','rgb(255, 0, 204)'],['rooster','rgb(255, 102, 0)'],['sauvie','rgb(57, 255, 20)']]) {
    await page.evaluate(c=>document.documentElement.dataset.actionContext=c,context);
    assert.equal((await read(primary)).bg,color,context+' contextual primary');
  }
  const destructive=page.locator('#button-contract-fixture .zay-action--destructive');
  assert.equal((await read(destructive)).color,'rgb(255, 36, 0)','destructive stays red');
  const ad=page.locator('#button-contract-fixture .pdxBoard__affShop');
  assert.equal((await read(ad)).bg,'rgb(255, 31, 31)','ad brand fill');
  await ad.hover();await page.waitForTimeout(200);
  assert.equal((await read(ad)).bg,'rgb(255, 31, 31)','ad brand survives hover');
  assert.equal((await read(ad)).color,'rgb(255, 255, 255)','ad readable ink');
  await page.close();console.log(`PASS: ${width}px post action, hover, focus, auth, disabled, secondary, calm, contexts, ad exception`);
 }
} finally { await browser.close(); }
