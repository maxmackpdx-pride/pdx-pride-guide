import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {boardBrowseHref} from './boardBrowseHref';
import {PRIMARY_NAV} from './siteNav';
import type {BoardCategory} from './allBoards';

test('Our BoardZ is the single canonical entrance for all five category/post deep links',()=>{
 const nav=PRIMARY_NAV.find(item=>item.type==='link'&&item.label==='Our BoardZ');
 assert.equal(nav?.type==='link'&&nav.href,'/boardz');
 for(const category of ['housing','gigz','giftz','sellz','mizzed'] as BoardCategory[]){
  const url=new URL(boardBrowseHref(category,'post=7&saved=1'), 'https://www.zaylist.com');
  assert.equal(url.pathname,'/boardz');assert.equal(url.searchParams.get('board'),category);assert.equal(url.searchParams.get('post'),`${category}:7`);assert.equal(url.searchParams.get('saved'),'1');
 }
});
test('old category tools and intents remain compatible after the page rename',()=>{
 const url=new URL(boardBrowseHref('housing','view=tools&type=FORMING&post=31'), 'https://www.zaylist.com');
 assert.equal(url.searchParams.get('mine'),'1');assert.equal(url.searchParams.get('intent'),'forming');assert.equal(url.searchParams.get('post'),'housing:31');
});
test('all old board entrances retain query and fragment; hidden drawer art loads on demand',()=>{
 const server=readFileSync('server/index.ts','utf8');
 for(const alias of ['/boards','/all-boards','/our-boardz'])assert.ok(server.includes(`"${alias}": "/boardz"`));
 const app=readFileSync('client/src/App.tsx','utf8');assert.match(app,/<Route path="\/boardz" component=\{Boards\}/);assert.match(app,/\/boardz\$\{window.location.search\}\$\{window.location.hash\}/);
 const drawer=readFileSync('client/src/components/MapzLayerSheet.tsx','utf8');assert.match(drawer,/src=\{LAYER_LOGOS\[layer.id\]\} alt="" loading="lazy" decoding="async"/);
 const art=readFileSync('client/public/brand/family/our-boardz.svg','utf8');assert.match(art,/<title id="title">Our BoardZ<\/title>/);assert.doesNotMatch(art,/<image/);
});
