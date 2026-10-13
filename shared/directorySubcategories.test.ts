import test from 'node:test';
import assert from 'node:assert/strict';
import { DIRECTORY_SUBCATEGORY_DATA } from './directorySubcategoryData';
import { directorySubcategories, directorySubcategoryOptions, directoryCardCategoryLabel, SUBCATEGORY_LABELS } from './directorySubcategories';

test('all checked tags have labels and source evidence', () => {
  for (const record of DIRECTORY_SUBCATEGORY_DATA) {
    assert.ok(record.evidence);
    if (record.subcategories.length) assert.ok(record.sourceUrls.length || (record.name === 'Fantasy Land' && /owner|storefront/i.test(record.evidence)), record.name);
    for (const id of record.subcategories) assert.ok(SUBCATEGORY_LABELS[id], `${record.name}: ${id}`);
  }
});
test('subcategory options change with the selected parent, and count providers once', () => {
  const rows = [{ name: 'Unlock Collective', type: 'service' }, { name: 'Greenhouse Hair Collective', type: 'service' }, { name: 'Pizza Thief', type: 'restaurant' }];
  assert.deepEqual(directorySubcategoryOptions(rows, ['ALL']), []);
  const service = directorySubcategoryOptions(rows, ['service']);
  assert.ok(service.some(tag => tag.id === 'hair' && tag.count === 1));
  assert.ok(service.some(tag => tag.id === 'graphic-design' && tag.count === 1));
  assert.ok(service.some(tag => tag.id === 'web-development' && tag.count === 1));
  assert.ok(!service.some(tag => tag.id === 'pizza'));
  assert.deepEqual(directorySubcategoryOptions(rows, ['restaurant']), [{ id: 'pizza', label: 'Pizza', count: 1 }]);
});
test('aliases resolve, stale offerings stay excluded, and unverified listings remain unspecified', () => {
  assert.equal(directorySubcategories({ name: 'Love Salon', type: 'service' })[0].id, 'hair');
  assert.ok(!directorySubcategories({ name: 'Spring Tides Massage', type: 'service' }).some(tag => ['beauty', 'esthetics'].includes(tag.id)));
  assert.deepEqual(directorySubcategories({ name: 'The Secret Warehouse', type: 'venue' }), []);
  assert.deepEqual(directorySubcategories({ name: 'Unknown Hair Studio', type: 'service' }), []);
  assert.equal(directoryCardCategoryLabel({ name: 'Greenhouse Hair Collective', type: 'service' }), 'Hair');
  assert.equal(directoryCardCategoryLabel({ name: 'Pizza Thief', type: 'restaurant' }), 'Restaurants');
});
