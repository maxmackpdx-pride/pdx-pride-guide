import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type Options = {
  eventId?: number;
  occurrence?: string;
  capacity: number;
  vibe: string;
  poster?: string;
  glow: boolean;
  sexPositive: boolean;
  nudityOk: boolean;
};
export const defaultOptions: Options = {
  capacity: 8,
  vibe: "social",
  glow: false,
  sexPositive: false,
  nudityOk: false,
};
export default function NightOptions({
  options,
  onChange,
  onUploading,
}: {
  options: Options;
  onChange: (o: Options) => void;
  onUploading: (v: boolean) => void;
}) {
  const events = useQuery<{ id: number; title: string; date: string }[]>({
    queryKey: ["/api/afterz/eligible-events"],
    queryFn: () =>
      apiRequest("GET", "/api/afterz/eligible-events").then((r) => r.json()),
    staleTime: 0,
  });
  const [error, setError] = useState("");
  return (
    <>
      <label>
        Main event
        <select
          value={
            options.eventId ? options.eventId + "|" + options.occurrence : ""
          }
          onChange={(e) => {
            const [id, date] = e.target.value.split("|");
            onChange({
              ...options,
              eventId: id ? Number(id) : undefined,
              occurrence: date,
            });
          }}
        >
          <option value="">Private invite link only</option>
          {events.data?.map((e) => (
            <option key={e.id + "|" + e.date} value={e.id + "|" + e.date}>
              {e.title} · {e.date}
            </option>
          ))}
        </select>
      </label>
      {events.isError && (
        <button type="button" onClick={() => void events.refetch()}>
          Retry upcoming events
        </button>
      )}
      {options.eventId && (
        <>
          <p>
            Listed in the event drawer through 30 minutes after the main event
            ends. Use the private chat for your address.
          </p>
          <label>
            Guest spots
            <input
              type="number"
              min={1}
              max={500}
              required
              value={options.capacity}
              onChange={(e) =>
                onChange({ ...options, capacity: e.target.valueAsNumber })
              }
            />
          </label>
          <label>
            Vibe
            <select
              value={options.vibe}
              onChange={(e) => onChange({ ...options, vibe: e.target.value })}
            >
              <option value="social">Hang out</option>
              <option value="chill">Chill / relax</option>
              <option value="party">The party continues</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.sexPositive}
              onChange={(e) =>
                onChange({ ...options, sexPositive: e.target.checked })
              }
            />{" "}
            Sex positive
          </label>
          <label>
            <input
              type="checkbox"
              checked={options.nudityOk}
              onChange={(e) =>
                onChange({ ...options, nudityOk: e.target.checked })
              }
            />{" "}
            Nudity OK
          </label>
          <label>
            <input
              type="checkbox"
              disabled={options.sexPositive}
              checked={options.sexPositive || options.glow}
              onChange={(e) => onChange({ ...options, glow: e.target.checked })}
            />{" "}
            Waypoint glow{" "}
            {options.sexPositive && "· required for sex-positive gatherings"}
          </label>
          <label>
            Invite card image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={async (e) => {
                const input = e.currentTarget,
                  file = input.files?.[0];
                if (!file) return;
                const data = new FormData();
                data.append("poster", file);
                onUploading(true);
                setError("");
                try {
                  const response = await fetch("/api/upload/poster", {
                    method: "POST",
                    credentials: "same-origin",
                    body: data,
                  });
                  if (!response.ok)
                    throw Error(
                      "Upload failed. Choose a JPG, PNG, GIF or WebP under 8 MB.",
                    );
                  const { url } = await response.json();
                  onChange({ ...options, poster: url });
                } catch (reason) {
                  setError((reason as Error).message);
                  input.value = "";
                } finally {
                  onUploading(false);
                }
              }}
            />
          </label>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </>
  );
}
