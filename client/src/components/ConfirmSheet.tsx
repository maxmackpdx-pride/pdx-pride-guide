import { useState } from "react";
import { createRoot } from "react-dom/client";
import * as Dialog from "@radix-ui/react-dialog";
import "./ConfirmSheet.css";

export type ConfirmSheetOptions = {
  /** Mono kicker, room then action: "INBOX · BLOCK". */
  kicker?: string;
  title: string;
  /** Says what happens, in words. */
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Destructive steps wear neon red on rim and ink. Never a solid. */
  destructive?: boolean;
};

function Sheet({ options, onDone }: { options: ConfirmSheetOptions; onDone: (ok: boolean) => void }) {
  const [open, setOpen] = useState(true);
  const finish = (ok: boolean) => { setOpen(false); onDone(ok); };
  return (
    <Dialog.Root open={open} onOpenChange={value => { if (!value) finish(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-sheet__scrim" />
        <Dialog.Content className="confirm-sheet pdx-liquid-overlay" onOpenAutoFocus={event => {
          // The safe choice takes focus first.
          event.preventDefault();
          (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>(".confirm-sheet__cancel")?.focus();
        }}>
          {options.kicker && <div className="confirm-sheet__kicker">{options.kicker}</div>}
          <Dialog.Title className="confirm-sheet__title">{options.title}</Dialog.Title>
          {options.body ? <Dialog.Description className="confirm-sheet__body">{options.body}</Dialog.Description> : <Dialog.Description className="sr-only">{options.title}</Dialog.Description>}
          <div className="confirm-sheet__actions">
            <button type="button" className="confirm-sheet__btn confirm-sheet__cancel" onClick={() => finish(false)}>{options.cancelLabel ?? "Keep it"}</button>
            <button type="button" className={`confirm-sheet__btn${options.destructive ? " confirm-sheet__btn--danger" : ""}`} onClick={() => finish(true)}>{options.confirmLabel}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Zaylist's confirmation sheet, in place of the browser's confirm(). Resolves true when confirmed. */
export function confirmSheet(options: ConfirmSheetOptions): Promise<boolean> {
  return new Promise(resolve => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
      // Let the close animation and focus return finish before unmounting.
      window.setTimeout(() => { root.unmount(); host.remove(); }, 220);
    };
    root.render(<Sheet options={options} onDone={done} />);
  });
}
