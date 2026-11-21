import { useState, type Dispatch, type SetStateAction } from "react";
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
async function uploadPoster(data: FormData): Promise<string> {
  const response = await fetch("/api/upload/poster", { method: "POST", credentials: "same-origin", body: data });
  if (!response.ok) throw Error("Upload failed. Choose a JPG, PNG, GIF or WebP under 8 MB.");
  return (await response.json()).url;
}
export type EligibleAfterzEvent = { id: number; title: string; date: string };
export function useEligibleAfterzEvents() {
  return useQuery<EligibleAfterzEvent[]>({
    queryKey: ["/api/afterz/eligible-events"],
    queryFn: () =>
      apiRequest("GET", "/api/afterz/eligible-events").then((r) => r.json()),
    staleTime: 0,
  });
}
export default function NightOptions({
  options,
  scopedTitle,
  onChange,
  onUploading,
}: {
  options: Options;
  scopedTitle?: string | null;
  onChange: Dispatch<SetStateAction<Options>>;
  onUploading: (v: boolean) => void;
}) {
  const events = useEligibleAfterzEvents();
  const [error, setError] = useState("");
  return (
    <>
      {scopedTitle !== undefined ? <p>{scopedTitle ? `After ${scopedTitle}` : "This event is unavailable for a linked invite. Your gathering uses a private invite link."}</p> : <label>
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
      </label>}
      {scopedTitle === undefined && events.isError && (
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
            Guest spots · {options.capacity}
            <input
              type="range"
              data-glass-piece="slider"
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
                  const poster = await uploadPoster(data);
                  onChange(current => ({ ...current, poster }));
                } catch (reason) {
                  setError((reason as Error).message);
                  input.value = "";
                }
                onUploading(false);
              }}
            />
          </label>
          {error && <p role="alert">{error}</p>}
        </>
      )}
    </>
  );
}
