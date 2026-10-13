import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { serviceWaypointLogo, serviceIdentity } from '../shared/serviceIdentity';
import { resolveDirectoryLogo } from '../shared/directoryLogos';
import { authoredLogoMode, logoCoverage, logoTone } from '../client/public/mapz-map/logo-mask.js';

const host = readFileSync('client/src/pages/MapzMapDemo.tsx', 'utf8');
const renderer = readFileSync('client/public/mapz-map/river-flight.js', 'utf8');

test('company and resource waypoint sources are exact existing reviewed artwork', () => {
  for (const source of [
    { name: 'Reconstructed Wellness', type: 'healthcare' },
    { name: 'Bywater Health', type: 'healthcare' },
    { name: 'Eagle Portland', type: 'bar' },
    { name: 'Oregon State Leather Contest', type: 'group' },
  ]) {
    const artwork = serviceWaypointLogo(source, resolveDirectoryLogo(source.name));
    assert.ok(artwork, source.name);
    assert.ok(existsSync(`client/public${artwork.split(/[?#]/)[0]}`), artwork);
    assert.doesNotMatch(artwork, /-white-white\./);
  }
  assert.doesNotMatch(host, /\.replace\(\/\\\.png\(\?=\\\?\|\$\)\//);
});

test('unbranded services share their specific icon across map and drawer', () => {
  const source = { name: 'Example hair studio', type: 'service' };
  assert.equal(serviceWaypointLogo(source), '/mapz-map/icons/services/hair.svg');
  assert.equal(serviceWaypointLogo(source), serviceIdentity(source)?.icon);
  assert.match(host, /const fallback = isPlace \? serviceIdentity\(row as Place\)\?\.icon/);
  const resourceDrawer = readFileSync('client/src/components/ResourceMapPanel.tsx', 'utf8');
  assert.match(resourceDrawer, /serviceWaypointLogo\(entry\.org, entry\.org\.logo\)/);
});

test('resources reach the same loaded artwork channel as place waypoints', () => {
  assert.match(host, /waypointLogo:serviceWaypointLogo\(entry\.org, entry\.org\.logo\)/);
  assert.match(renderer, /const logo=feature\.properties\.waypointLogo\?venueLogos\.get/);
  assert.match(renderer, /else if\(f\.properties\.waypointLogo\)await loadVenueLogo/);
});

test('reviewed artwork retains solid white, black cutlines and subtle gray, including transparent edges', () => {
  for (const url of ['/directory-logos/oregonleathercontest-white.svg?v=detail', '/resources-logos/reconstructedwellness-white.svg']) {
    const mode = authoredLogoMode(url, 'alpha');
    assert.equal(mode, 'grayscale');
    for (const tone of [0, 42, 225, 255]) {
      assert.equal(logoTone(tone, tone, tone, mode), tone);
      assert.equal(logoCoverage(tone, tone, tone, 255, mode), 1);
      assert.equal(logoCoverage(tone, tone, tone, 128, mode), 128/255);
    }
    assert.equal(logoCoverage(255,255,255,0,mode),0);
  }
  assert.equal(authoredLogoMode('./venue-logos/legacy.png', 'alpha'), 'alpha');
  assert.equal(logoTone(0,0,0,'alpha'),255);
  assert.equal(logoCoverage(0,0,0,255,'light'),0);
  assert.equal(logoCoverage(255,255,255,255,'light'),1);
});

test('grid-only and mobile providers with no supplied coordinates do not acquire map pins', () => {
  const start = host.indexOf('function placeMarks(');
  const end = host.indexOf('\nfunction rowMarks(', start);
  const context = vm.createContext({
    resolveBusinessLocations: () => [],
    mapCoordinates: (lat: unknown,lng: unknown) => typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) ? {lat,lng} : null,
  });
  // Run the actual host selection logic after stripping its three TypeScript annotations.
  const fn = host.slice(start,end).replace('places: Place[]', 'places').replace(': Mark[]', '').replaceAll('"place" as const', '"place"').replaceAll('loc.lat!', 'loc.lat').replaceAll('loc.lng!', 'loc.lng');
  vm.runInContext(fn,context);
  for (const name of ['Cockeye Kink', 'trans bodycare', 'Smonday Studios', 'Max Burns']) {
    assert.equal(vm.runInContext(`placeMarks([{id:1,name:${JSON.stringify(name)},locations:[],lat:null,lng:null}]).length`, context), 0);
  }
  assert.equal(vm.runInContext('placeMarks([{id:2,name:"Verified studio",locations:[{lat:45.52,lng:-122.68}]}]).length',context),1);
});

test('actual canvas decoder preserves authored detail before small/large glyph scaling', async () => {
  const pixels = new Uint8ClampedArray([255,255,255,255, 0,0,0,255, 225,225,225,128]);
  const stored = new Map();
  let decoded: Uint8ClampedArray | undefined;
  const context2d = {
    drawImage() {}, getImageData: () => ({data:pixels}),
    putImageData: (artwork: {data:Uint8ClampedArray}) => { decoded = artwork.data.slice(); },
    fillRect() {},
  };
  const context = vm.createContext({
    Image: class {width=256;height=1;src='';async decode() {}},
    document: {createElement: () => ({width:0,height:0,getContext: () => context2d})},
    disposed:false, logoCoverage,logoTone,authoredLogoMode, venueLogos:stored,
    DAYS:{thu:'#0ff',fri:'#f0f'}, console,
  });
  const start = renderer.indexOf('async function decodeVenueLogo(');
  const end = renderer.indexOf('\nconst mapHover=',start+1);
  vm.runInContext(renderer.slice(start,end),context);
  await vm.runInContext('decodeVenueLogo("/directory-logos/fixture-white.svg", "alpha")',context);
  assert.deepEqual(Array.from(decoded || []), [255,255,255,255, 0,0,0,255, 225,225,225,128]);
  assert.ok(stored.has('/directory-logos/fixture-white.svg'));
});

test('small and selected waypoint glyphs keep company tones while tinting service icons white', () => {
  const source = readFileSync('client/public/mapz-map/waypoint-markers.js','utf8');
  let recolors = 0;
  const drawn: unknown[][] = [];
  const drawing = {drawImage: (...args: unknown[]) => drawn.push(args),fillRect: () => recolors++};
  const context = vm.createContext({
    ink:new WeakMap(),document:{createElement:()=>({width:0,height:0,getContext:()=>drawing})},
    drawing,image:{width:120,height:80},
  });
  vm.runInContext(source.slice(source.indexOf('function tintedIcon('),source.indexOf('function ringAlpha(')),context);
  vm.runInContext(source.slice(source.indexOf('function drawGlyph('),source.indexOf('function drawScoop(')),context);
  for (const size of [31*.58,57*.58]) for (const glitch of [0,.8]) {
    vm.runInContext(`drawGlyph(drawing,image,100,200,${size},${glitch},true)`,context);
  }
  assert.equal(recolors,0,'company pixels must never be replaced by a white silhouette');
  vm.runInContext('drawGlyph(drawing,image,100,200,18,0)',context);
  assert.equal(recolors,1,'type icons retain their existing white treatment');
  assert.ok(drawn.length>=7);
  assert.match(source,/if\(logo\)drawGlyph\(ctx,logo,x,y,glyph,extra\.glitch\|\|0,true\)/);
});
