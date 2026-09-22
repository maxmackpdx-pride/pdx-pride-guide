import test from 'node:test';
import assert from 'node:assert/strict';
import {installBasemapStatus} from '../client/public/outzide-map/assets/basemap-status.js';

function setup() {
  const handlers = new Map();
  const banner = {hidden: true};
  installBasemapStatus({on: (type, handler) => handlers.set(type, handler)}, banner);
  return {banner, emit: (type, event = {}) => handlers.get(type)?.(event)};
}

test('optional source failures never claim the basemap failed', () => {
  const {banner, emit} = setup();
  for (const sourceId of ['elevation', 'relief', 'contours', 'cascadia-outline', undefined]) {
    emit('error', {sourceId, error: new Error('Request failed')});
    assert.equal(banner.hidden, true);
  }
});

test('basemap failure stays visible until a basemap tile recovers, without waiting for idle', () => {
  const {banner, emit} = setup();
  emit('error', {sourceId: 'terrain', error: new Error('Offline')});
  assert.equal(banner.hidden, false);
  emit('idle');
  emit('sourcedata', {sourceId: 'terrain', sourceDataType: 'metadata'});
  emit('sourcedata', {sourceId: 'elevation', tile: {state: 'loaded'}});
  emit('sourcedata', {sourceId: 'terrain', tile: {state: 'errored'}});
  assert.equal(banner.hidden, false);
  emit('sourcedata', {sourceId: 'terrain', tile: {state: 'loaded'}});
  assert.equal(banner.hidden, true);
  emit('error', {sourceId: 'relief'});
  assert.equal(banner.hidden, true);
  emit('error', {sourceId: 'terrain'});
  assert.equal(banner.hidden, false);
});
