/** Demo locations are fictional samples anchored at the event venue. A preview
 * never reads a visitor’s location or starts a device location subscription. */
let nextWatch = 0;
const pending = new Map<number, ReturnType<typeof setTimeout>>();
function sample(): GeolocationPosition {
  const position = {
    latitude: 45.5232, longitude: -122.6802, accuracy: 25,
    altitude: null, altitudeAccuracy: null, heading: null, speed: null,
  };
  const coords = { ...position, toJSON: () => position };
  const timestamp = Date.now();
  return { coords, timestamp, toJSON: () => ({ coords: position, timestamp }) };
}
export const demoGeolocation: Geolocation = {
  getCurrentPosition(success) { queueMicrotask(() => success(sample())); },
  watchPosition(success) {
    const key = ++nextWatch;
    pending.set(key, setTimeout(() => { pending.delete(key); success(sample()); }, 0));
    return key;
  },
  clearWatch(key) { clearTimeout(pending.get(key)); pending.delete(key); },
};
