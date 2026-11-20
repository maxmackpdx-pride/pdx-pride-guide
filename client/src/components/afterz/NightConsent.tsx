import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useModalA11y } from "@/hooks/useModalA11y";
import { apiRequest } from "@/lib/queryClient";

type Prompt = { eventId: number; source: "rsvp" | "checkin" };
export function askAfterzConsent(eventId: number, source: Prompt["source"]) {
  window.dispatchEvent(
    new CustomEvent("zaylist:afterz-consent", { detail: { eventId, source } }),
  );
}
export default function NightConsent() {
  const { user } = useAuth(),
    [prompt, setPrompt] = useState<Prompt | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const controls = useModalA11y({
    open: Boolean(prompt && user),
    onClose: () => setPrompt(null),
  });
  useEffect(() => setPrompt(null), [user?.id]);
  useEffect(() => {
    const receive = (e: Event) => {
      if (!user) return;
      setPrompt((e as CustomEvent<Prompt>).detail);
      setError("");
    };
    window.addEventListener("zaylist:afterz-consent", receive);
    return () => window.removeEventListener("zaylist:afterz-consent", receive);
  }, [user?.id]);
  useEffect(() => {
    if (prompt && user) dialog.current?.showModal();
  }, [prompt, user?.id]);
  if (!prompt || !user) return null;
  const choose = async (enabled: boolean) => {
    setBusy(true);
    setError("");
    try {
      await apiRequest("PUT", "/api/afterz/consent/" + prompt.eventId, {
        source: prompt.source,
        enabled,
      });
      setPrompt(null);
    } catch {
      setError("Could not save your choice. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return createPortal(
    <dialog
      className="night-consent"
      ref={dialog}
      aria-labelledby="afterz-consent-title"
      onCancel={() => setPrompt(null)}
    >
      <h2 id="afterz-consent-title">
        {prompt.source === "rsvp"
          ? "Remind you about Afterz?"
          : "Get Afterz notifications here?"}
      </h2>
      <p>Get a reminder if someone hosts Afterz for this event.</p>
      <div ref={controls}>
        <button disabled={busy} onClick={() => void choose(true)}>
          Yes, remind me
        </button>
        <button disabled={busy} onClick={() => void choose(false)}>
          No thanks
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </dialog>,
    document.body,
  );
}
