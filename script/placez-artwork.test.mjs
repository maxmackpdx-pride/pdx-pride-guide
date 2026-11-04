import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const components = path => read(`client/src/components/${path}`);

test('Places discovery cards leave artwork clear without changing their actions', () => {
 const card=components('discovery/PlaceDiscoveryCard.tsx');
 assert.match(card, /<ResourceCardMotif name=\{place.name\} category=\{`place-\$\{place.type\}`\}/);
 assert.doesNotMatch(card, /<ResourceCardMotif\s+glass/);
 assert.match(card, /businessId=\{place.id\}/);
 assert.match(card, /View details/);
});

test('Placez wrapper retains its control scope and accent but mounts no film or grain', () => {
 const overlays=components('xerox/Overlays.jsx');
 const placez=overlays.slice(overlays.indexOf('export function PlacezXerox'));
 assert.match(placez, /className="xr-pz"/);
 assert.match(placez, /style=\{accent\?/);
 assert.doesNotMatch(placez, /Grain|createPortal|useSlot|useRef/);
 assert.doesNotMatch(components('xerox/Overlays.d.ts').split('PlacezXerox')[1], /slot\?/);
 assert.doesNotMatch(components('home/TodayLocationCard.tsx'), /<PlacezXerox\s+slot=/);
});

test('Places no longer paints the torn-card scan across the face', () => {
 const css=components('xerox/xerox.css');
 assert.doesNotMatch(css, /\.xr-pz\s+\.pdxPlace__body::after\s*\{/);
 assert.match(css, /\.xr-pz \.pdxPlace__actions/);
 assert.match(css, /\.xr-oz \.xr-grain\{opacity:\.3\}/);
});

test('Outzide keeps its photo splits, grain and blend-aware overlay', () => {
 const outz=components('xerox/Overlays.jsx').split('export function OutzXerox')[1].split('export function PlacezXerox')[0];
 assert.match(outz, /xr-copy-r/); assert.match(outz, /xr-copy-c/);
 assert.match(outz, /!blend&&<XeroxOverlay/); assert.match(outz, /<Grain\/>/);
});

test('authored hero and companion stay separate, decorative depth planes', () => {
 const motif=components('resources/ResourceCardMotif.tsx');
 assert.match(motif, /data-motif-depth="support"/);
 assert.match(motif, /data-motif-depth="front"/);
 assert.match(motif, /LibraryMotifImage asset=\{companion\}/);
 assert.match(motif, /LibraryMotifImage asset=\{hero\}/);
 assert.match(motif, /aria-hidden="true" focusable="false"/);
 assert.match(motif, /<NetworkBackdrop/);
});

test('only Places support moves opposite the front, before accessibility overrides', () => {
 const css=components('CardMotifMotion.css');
 const support='[data-card-motif]:where([data-motif^="place-"]) [data-motif-depth="support"]';
 assert.ok(css.includes(support));
 assert.match(css.slice(css.indexOf(support)).split('}')[0], /\* -\.35\).*\* -\.3\)/);
 assert.match(css, /\* \.65\).*\* \.65\)/);
 assert.ok(css.indexOf(support)<css.indexOf('@media(prefers-reduced-motion:reduce)'));
 assert.match(css, /html.calm-mode,:root\[data-calm="true"\]/);
 assert.match(css, /animation:none !important; translate:none !important/);
});

test('Places overlay removal preserves the React 19 card integration', () => {
 const today=components('home/TodayLocationCard.tsx');
 assert.match(today, /<CardMorph name=\{cardMorphName/);
 assert.match(today, /<PausedCard open=\{open\}>/);
 assert.match(today, /openCardFromEvent\(event, \(\) => setOpen\(true\)\)/);
 assert.match(today, /open && <OpenCardMeta/);
 assert.match(today, /preloadCardImage\(businessLogo, "auto"\)/);
 assert.match(today, /<PlaceModal documentMeta=\{false\}/);
 assert.match(components('ds/PlaceCard.tsx'), /<CardMorph name=\{cardMorphName/);
 assert.match(components('cards/PlaceCard.tsx'), /<PausedCard open=\{open\}>/);
});
