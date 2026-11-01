import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('Placez Xerox artwork never reintroduces the removed radar', () => {
  const overlays = source('xerox/Overlays.jsx');
  assert.doesNotMatch(overlays, /PlacezRadar|xr-radar/);
  assert.match(overlays, /export function OutzXerox/);
  assert.match(overlays, /export function PlacezXerox/);
});
test('small card controls share a single centered glyph without changing category transports', () => {
  assert.match(source('CardHeartButton.tsx'), /import \{ Heart \} from 'lucide-react'/);
  assert.match(source('CardHeartButton.css'), /gap:0!important/);
  for (const path of ['HeartButton.tsx','VenueFollowButton.tsx','events/EventRailCard.tsx','board/punk/PunkBoardCard.jsx','board/punk/ZineCard.jsx']) {
    assert.match(source(path), /CardHeartButton/, path);
  }
  assert.match(source('VenueFollowButton.tsx'), /api\/directory\/\$\{businessId\}\/follow/);
  assert.match(source('HeartButton.tsx'), /useHeart\(kind/);
  assert.match(source('events/EventRailCard.tsx'), /onToggleSave\(listing.id\)/);
});
test('small Placez public API uses the actual Directory face, not Outzide data', () => {
  const adapter = readFileSync(new URL('./PlaceCard.tsx', import.meta.url), 'utf8');
  assert.match(adapter, /if\(size==='small'\).*PlaceDiscoveryCard/s);
  assert.doesNotMatch(adapter, /OutzCard|kind="outz"/);
});
