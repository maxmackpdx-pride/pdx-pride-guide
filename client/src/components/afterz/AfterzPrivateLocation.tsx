import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";

type Pin = { lat: number; lng: number };
type PrivateLocation = {
  address: string;
  lat: number | null;
  lng: number | null;
};
type Payload = { location: PrivateLocation | null; expiresAt: number };

export default function AfterzPrivateLocation({
  path,
  host,
  userId,
}: {
  path: string;
  host: boolean;
  userId: number;
}) {
  const endpoint = path + "/chat/location";
  const query = useQuery<Payload>({
    queryKey: [endpoint, userId],
    refetchInterval: 5000,
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      const response = await fetch(endpoint, {
        credentials: "include",
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Location unavailable");
      return response.json();
    },
  });
  const [address, setAddress] = useState(""),
    [pin, setPin] = useState<Pin | null>(null),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  const shared = query.data?.location;
  async function save(remove = false) {
    setBusy(true);
    setNote("");
    try {
      await apiRequest(
        remove ? "DELETE" : "PUT",
        endpoint,
        remove
          ? {}
          : {
              address,
              lat: pin?.lat ?? null,
              lng: pin?.lng ?? null,
              confirm: true,
            },
      );
      setAddress("");
      setPin(null);
      await query.refetch();
    } catch (error) {
      setNote(parseApiError(error, "Could not update the location."));
    } finally {
      setBusy(false);
    }
  }
  function capture() {
    if (!navigator.geolocation) {
      setNote("Enter the address to share it.");
      return;
    }
    setBusy(true);
    setNote("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPin({ lat: coords.latitude, lng: coords.longitude });
        setBusy(false);
      },
      () => {
        setNote("Could not locate you. Enter the address or try again.");
        setBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
    );
  }
  if (query.isError)
    return <p role="status">The private location is unavailable.</p>;
  if (!query.data || Date.now() >= query.data.expiresAt) return null;
  return (
    <section aria-label="Private gathering location">
      {shared && (
        <>
          <h5>Meet here</h5>
          <p>{shared.address || "Location pin shared by your host"}</p>
          <a
            href={endpoint + "/directions"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open directions in Maps
          </a>
        </>
      )}
      {host && (
        <details>
          <summary>
            {shared ? "Update private location" : "Share a private location"}
          </summary>
          <p>
            Only accepted guests can open directions here. Sharing ends when
            this gathering closes.
          </p>
          <label>
            Meetup address
            <input
              maxLength={240}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button type="button" disabled={busy} onClick={capture}>
            {pin ? "Replace my location pin" : "Use my current location"}
          </button>
          {pin && (
            <p>
              Pin ready to share.{" "}
              <button type="button" onClick={() => setPin(null)}>
                Clear pin
              </button>
            </p>
          )}
          <button
            type="button"
            disabled={busy || (!address.trim() && !pin)}
            onClick={() => void save()}
          >
            Share with accepted guests
          </button>
          {shared && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void save(true)}
            >
              Stop sharing location
            </button>
          )}
        </details>
      )}
      {note && <p role="status">{note}</p>}
    </section>
  );
}
