import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {getOutzSharePlace,renderOutzShareCard} from './outzShareCards';
import {outzShareId,outzSharePath} from '../shared/outzShare';

test('share URLs preserve destination identity and reject malformed routes',()=>{
 for(const id of ['usfs-5117010324','rooster-rock','sauvie-island'])assert.equal(outzShareId(outzSharePath(id)),id);
 for(const url of ['/outzide','/outzide/rooster-rock','/outzide/share/%ZZ','/outzide/share/a/b'])assert.equal(outzShareId(url),null);
 assert.equal(getOutzSharePlace('../../etc/passwd'),null);
});
test('known destinations render distinct 1200×630 PNGs; unknown IDs do not render',async()=>{
 const first=await renderOutzShareCard('usfs-5117010324');
 const second=await renderOutzShareCard('rooster-rock');
 assert.ok(first&&second);assert.notDeepEqual(first,second);
 const meta=await sharp(first).metadata();assert.equal(meta.width,1200);assert.equal(meta.height,630);assert.equal(meta.format,'png');
 assert.equal(await renderOutzShareCard('missing'),null);
 assert.equal(await renderOutzShareCard('usfs-5117010324'),first);
});
