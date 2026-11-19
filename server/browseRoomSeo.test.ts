import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import express from "express";

test("direct SceneZ and OutZide browse requests return room-specific document and social titles", async t => {
  process.env.DATABASE_PATH = ":memory:";
  const { storage, sqlite } = await import("./storage");
  t.after(() => sqlite.close());
  t.mock.method(storage,"getEvents",()=>[]);
  const { serveStatic } = await import("./static");
  const root = await mkdtemp(join(tmpdir(),"zaylist-browse-seo-"));
  t.after(() => rm(root,{recursive:true,force:true}));
  await writeFile(join(root,"index.html"),await readFile(new URL("../client/index.html",import.meta.url)));
  const app=express();
  serveStatic(app,root);
  const server=app.listen(0,"127.0.0.1");
  t.after(() => new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())));
  await once(server,"listening");
  const address=server.address();
  assert.ok(address && typeof address === "object");
  for (const [path,title,description] of [
    ["/scenez","SceneZ | Zaylist","Find Portland communities, explore memberships, and follow their updates."],
    ["/outzide/places/?q=camp","OutZide destinations | Zaylist","Explore outdoor destinations, conditions, and community trip boards."],
    ["/outzide/rooster-rock","OUTZIDE | Zaylist","Explore trails, campgrounds, hot springs, beaches and community stays across Oregon and Washington."],
  ]) {
    const response=await fetch(`http://127.0.0.1:${address.port}${path}`);
    assert.equal(response.status,200,path);
    const html=await response.text();
    assert.ok(html.includes(`<title>${title}</title>`),path);
    for (const [attr,key,value] of [
      ["property","og:title",title],["name","twitter:title",title],
      ["name","description",description],["property","og:description",description],
    ]) assert.ok(html.includes(`<meta ${attr}="${key}" content="${value}"`),`${path} ${key}`);
  }
});
