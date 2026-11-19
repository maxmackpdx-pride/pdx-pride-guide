import test from 'node:test';
import assert from 'node:assert/strict';

// React 19 writes recognized custom-element properties after registration.
// This contract does not need a graphics context or a mounted DOM tree.
class UnmountedElement {
  attributes = new Map();
  attachShadow() { return { innerHTML: '', querySelector: () => ({}) }; }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
}
const registry = new Map();
globalThis.HTMLElement = UnmountedElement;
globalThis.matchMedia = () => ({});
globalThis.customElements = {
  get: name => registry.get(name),
  define: (name, constructor) => registry.set(name, constructor),
};
await import('../client/public/room-shaders/room-background.js');

test('already registered room elements accept React property assignment on navigation', () => {
  const Background = registry.get('zay-room-background');
  for (const room of ['placez', 'scenez', 'outzide', 'eventz']) {
    const element = new Background();
    element.room = room;
    assert.equal(element.getAttribute('room'), room);
    assert.equal(element.room, room);
  }
});
