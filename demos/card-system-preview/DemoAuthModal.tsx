import { useEffect, useId, useRef } from "react";
import { DEMO_PERSONAS, type DemoPersona } from "./demo-api";

export const DEMO_IDENTITY_EVENT = "zaylist:preview-persona";

export default function DemoAuthModal({ onClose }: {
  onClose: (reason?: "success") => void;
  defaultTab?: "login" | "register";
  portalTargetSelector?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => { node?.close(); };
  }, []);

  function enter(persona: DemoPersona) {
    window.dispatchEvent(new CustomEvent(DEMO_IDENTITY_EVENT, { detail: persona }));
    onClose("success");
  }
  return <dialog className="preview-dialog" ref={dialog} aria-labelledby={titleId} onCancel={() => onClose()}>
    <h2 id={titleId}>Choose a demo profile</h2>
    <p>Try the invitation or the ride with a fictional account. Your choices stay in this browser.</p>
    <div className="preview-dialog__actions">
      {DEMO_PERSONAS.filter(person => person.id !== "guest").map(person =>
        <button key={person.id} type="button" onClick={() => enter(person.id)}>{person.label}</button>)}
      <button type="button" onClick={() => onClose()}>Stay signed out</button>
    </div>
  </dialog>;
}
