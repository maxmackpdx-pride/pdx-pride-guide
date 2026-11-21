import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import NightOptions, { defaultOptions, type Options } from "@/components/afterz/NightOptions";
import { hostAfterz } from "@/lib/afterzDrawerApi";
import "./AfterzDrawer.css";

/** Host an Afterz in advance. Posts to the existing gatherings endpoint. */
export default function AfterzHostForm({
  inAdvance = false,
  onCreated,
  onRequireAuth,
  signedIn,
}: {
  inAdvance?: boolean;
  onCreated?: (id: string) => void;
  onRequireAuth?: () => void;
  signedIn: boolean;
}) {
  "use memo";
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [options, setOptions] = useState<Options>(defaultOptions);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  return (
    <form
      className="afterz-host-form"
      data-testid="afterz-host-form"
      onSubmit={async event => {
        event.preventDefault();
        if (!signedIn) {
          onRequireAuth?.();
          return;
        }
        if (busy || uploading) return;
        setBusy(true);
        setError("");
        setNotice("");
        try {
          const { id } = await hostAfterz({
            ...options,
            title: title.trim(),
            confirmed18: confirmed,
            requestId: key,
          });
          void client.invalidateQueries({ queryKey: ["/api/afterz/gatherings"] });
          void client.invalidateQueries({ queryKey: ["/api/afterz/nights"] });
          setNotice(inAdvance
            ? "Your Afterz is saved. Friends can be invited now. It will show on the map once the window opens."
            : "Your Afterz is live. Share the invite with friends.");
          onCreated?.(id);
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "Could not create the Afterz.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Afterz title
        <input
          type="text"
          value={title}
          maxLength={80}
          required
          onChange={event => {
            setTitle(event.target.value);
            setKey(crypto.randomUUID());
          }}
        />
      </label>
      <NightOptions options={options} onChange={setOptions} onUploading={setUploading} />
      <p>
        {inAdvance
          ? "Host an Afterz in advance. Invite friends anytime. People in the area can request to join only once the window opens at 9 PM Pacific. It will not show on the map before then. Guest requests and chat close at 6 AM Pacific."
          : "Invite friends anytime. People in the area can request to join while Afterz is open, from 9 PM to 6 AM Pacific. Guest requests and chat close at 6 AM Pacific."}
      </p>
      <label className="afterz-host-form__check">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={event => setConfirmed(event.target.checked)}
          required
        />
        I am 18 or older.
      </label>
      <button type="submit" disabled={busy || uploading || !confirmed || !title.trim()}>
        {busy ? "Creating…" : inAdvance ? "Host an Afterz in advance" : "Host an Afterz"}
      </button>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
