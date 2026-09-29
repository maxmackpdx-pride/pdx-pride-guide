import { useEffect, useRef, useState } from "react";

export type BoardMapPoint = { lat: number; lng: number };

/** An explicit per-post choice. Reading the device location never happens on mount. */
export default function BoardMapLocationSetting({ value, onChange }: {
  value: BoardMapPoint | null;
  onChange: (point: BoardMapPoint | null) => void;
}) {
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current += 1; }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choose = () => {
    if (!navigator.geolocation) { setError("Location is unavailable on this device."); return; }
    const id = ++requestId.current;
    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(position => {
      if (id !== requestId.current) return;
      const { latitude: lat, longitude: lng } = position.coords;
      setBusy(false);
      if (lat < 45.2 || lat > 45.85 || lng < -123.15 || lng > -122.15) {
        setError("Map points are currently available in the Portland metro area.");
        return;
      }
      onChange({ lat, lng });
    }, () => {
      if (id !== requestId.current) return;
      setBusy(false);
      setError("Location permission was denied or timed out.");
    }, { enableHighAccuracy: true, timeout: 12000 });
  };
  return <fieldset className="span" style={{ border: "1px solid rgba(255,255,255,.22)", borderRadius: 10, padding: 12 }}>
    <legend>Map location</legend>
    <label style={{ display: "block" }}><input type="radio" checked={!value && !busy} onChange={() => { requestId.current += 1; setBusy(false); setError(""); onChange(null); }} /> Approximate area (default)</label>
    <label style={{ display: "block" }}><input type="radio" checked={!!value || busy} onChange={choose} disabled={busy} /> Share my current map point</label>
    <p className="board-copy-sm">Your exact address is never requested. A shared map point is visible to everyone; choose an area if this is a private handoff or home.</p>
    {busy && <p role="status">Finding your location…</p>}
    {error && <p role="alert">{error}</p>}
  </fieldset>;
}
