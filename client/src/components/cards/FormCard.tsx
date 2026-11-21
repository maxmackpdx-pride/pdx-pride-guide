import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { flipIn, flipOut, haptic, type OriginRect } from "./flipCard";
import { CardLogoMark, type CardLogo } from "./cardLogo";
import "./ActionSheetCard.css";
import "./FormCard.css";

/**
 * FormCard (Tucker, t311u): every flow that leads to a form (claim, post
 * Mizzed, post Gigz, message host, report a change) flips the current card
 * into a full-size extended card in the same accent: same glass, same .obtn
 * buttons. On submit it shows a thank-you face, then flips back to the card it
 * came from. It renders inside its host card (host must be position:relative)
 * and covers it exactly, so "same size" is structural, not measured.
 * Reduced motion / Calm Mode: fade.
 */
export type FormCardField = {
  name: string;
  label: string;
  kind?: "text" | "textarea" | "email" | "select" | "checkbox" | "date" | "time";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  minLength?: number;
  maxLength?: number;
  rows?: number;
  defaultValue?: string | boolean;
};

export type FormCardValues = Record<string, string | boolean>;

export type FormCardProps = {
  /** Accent of the card it flips from (event: poster-matched --a; tile: tile color). */
  accent: string;
  /** The action, e.g. "CLAIM THIS EVENT". Shown as the header word-mark when there is no logo. */
  kicker: string;
  /** The event (or item) name: small, under the logo, above the accent line. */
  title: string;
  intro?: ReactNode;
  /** Family logo at the top of the form (Afterz, Mizzed, Gigz, Ridez placeholder). */
  logo?: CardLogo | null;
  fields: FormCardField[];
  submitLabel: string;
  /** Throw an Error to show its message and stay on the form. */
  onSubmit: (values: FormCardValues) => Promise<void>;
  /** Thank-you face. `next` is the one relevant follow-up offered before the flip back. */
  success: { title: string; body?: ReactNode; next?: { label: string; onClick: () => void } };
  /** localStorage key: typed text survives an accidental dismiss; cleared on submit. */
  draftKey?: string;
  /** Rect of the card it flips from (defaults to its own rect: a flip in place). */
  origin?: OriginRect | null;
  /** Called after the flip back. */
  onClose: () => void;
  /** Flip back this long after the thank-you face shows. 0 = wait for DONE. */
  autoReturnMs?: number;
  /** Shown instead of the form, e.g. a sign-in prompt. */
  gate?: ReactNode;
};

/** Field defaults, then any saved draft of the same shape (t314u autosave). */
function readDraft(draftKey: string): FormCardValues | null {
  try { return JSON.parse(localStorage.getItem(`zaylist:draft:${draftKey}`) || "null") as FormCardValues | null; }
  catch { return null; }
}
function initialValues(fields: FormCardField[], draftKey?: string): FormCardValues {
  const base: FormCardValues = Object.fromEntries(fields.map(f => [f.name, f.defaultValue ?? (f.kind === "checkbox" ? false : "")]));
  const saved = draftKey && typeof localStorage !== "undefined" ? readDraft(draftKey) : null;
  if (saved) for (const f of fields) {
    const v = saved[f.name];
    if (!(f.name in saved) || typeof v !== typeof base[f.name] || v === "") continue;
    // A select only restores a value it still offers (e.g. a friend list that loaded after the draft was saved).
    if (f.kind === "select" && !f.options?.some(o => o.value === v)) continue;
    base[f.name] = v;
  }
  return base;
}

/** Submit outside the component: try/finally is not lowered by the React
 *  Compiler. Resolves to an error message, or null on success. */
async function runSubmit(onSubmit: (v: FormCardValues) => Promise<void>, values: FormCardValues, draftKey?: string): Promise<string | null> {
  try {
    await onSubmit(values);
  } catch (err) {
    return err instanceof Error ? err.message : "Something went wrong. Try again.";
  }
  if (draftKey) {
    try { localStorage.removeItem(`zaylist:draft:${draftKey}`); } catch { /* private mode */ }
  }
  return null;
}

export function FormCard({ accent, kicker, title, intro, logo = null, fields, submitLabel, onSubmit, success, origin = null, onClose, autoReturnMs, gate, draftKey }: FormCardProps) {
  const returnMs = autoReturnMs ?? (success.next ? 0 : 2200);
  const el = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const closing = useRef(false);
  const [values, setValues] = useState<FormCardValues>(() => initialValues(fields, draftKey));
  useEffect(() => {
    if (!draftKey || done) return;
    try { localStorage.setItem(`zaylist:draft:${draftKey}`, JSON.stringify(values)); } catch { /* private mode */ }
  }, [values]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    void flipOut(el.current, origin ?? (el.current ? el.current.getBoundingClientRect() : null)).then(onClose);
  };
  useLayoutEffect(() => { flipIn(el.current, origin ?? (el.current ? el.current.getBoundingClientRect() : null)); }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    window.addEventListener("keydown", k, true);
    return () => window.removeEventListener("keydown", k, true);
  }, []);
  useEffect(() => {
    if (!done) return;
    el.current?.querySelector<HTMLElement>(".zform-done .obtn")?.focus({ preventScroll: true });
    if (!returnMs) return;
    const t = window.setTimeout(close, returnMs);
    return () => window.clearTimeout(t);
  }, [done]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    const failure = await runSubmit(onSubmit, values, draftKey);
    setBusy(false);
    if (failure) { setError(failure); return; }
    haptic([10, 40, 14]);
    setDone(true);
  };
  const set = (n: string, v: string | boolean) => setValues(s => ({ ...s, [n]: v }));
  return (
    <div ref={el} className="zform" role="dialog" aria-modal="true" aria-label={`${kicker}: ${title}`} style={{ "--tile": accent } as CSSProperties}>
      <button type="button" className="zas-x" aria-label="Close" data-action="close" onClick={close}>✕</button>
      {done ? (
        <div className="zform-done" role="status">
          {logo ? <CardLogoMark logo={logo} /> : null}
          <span className="zform-check" aria-hidden="true">✓</span>
          <p className="zform-done-t">{success.title}</p>
          {success.body ? <div className="zform-done-s">{success.body}</div> : null}
          {success.next ? (
            <div className="zform-next">
              <button type="button" className="obtn obtn--accent" onClick={() => { success.next!.onClick(); close(); }}>{success.next.label}</button>
              <button type="button" className="obtn" onClick={close}>DONE</button>
            </div>
          ) : <button type="button" className="obtn obtn--accent" onClick={close}>DONE</button>}
        </div>
      ) : (
        <form className="zform-body" onSubmit={submit} noValidate={false} data-form={kicker.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
          {/* One header for every form (t314u): feature logo (or the action as
              the word-mark), event name small under it, accent line. */}
          <header className="zform-head">
            {logo ? <CardLogoMark logo={logo} /> : <p className="zform-mark">{kicker}</p>}
            <p className="zform-event">{title}</p>
            <span className="zform-rule" aria-hidden="true" />
            {logo ? <h2 className="zform-action">{kicker}</h2> : null}
            {intro ? <div className="zform-intro">{intro}</div> : null}
          </header>
          {gate ?? (
            <>
              <div className="zform-fields">
                {fields.map(f => {
                  const id = `zf-${f.name}`;
                  const v = values[f.name];
                  if (f.kind === "checkbox") return (
                    <label key={f.name} className="zform-check-row" htmlFor={id}>
                      <input id={id} type="checkbox" checked={Boolean(v)} required={f.required} onChange={e => set(f.name, e.target.checked)} />
                      <span>{f.label}</span>
                    </label>
                  );
                  return (
                    <label key={f.name} className="zform-field" htmlFor={id}>
                      <span className="zform-label">{f.label}{f.required ? "" : " (optional)"}</span>
                      {f.kind === "textarea" ? (
                        <textarea id={id} rows={f.rows ?? 5} value={String(v)} required={f.required} placeholder={f.placeholder}
                          minLength={f.minLength} maxLength={f.maxLength} onChange={e => set(f.name, e.target.value)} />
                      ) : f.kind === "select" ? (
                        <select id={id} value={String(v)} required={f.required} onChange={e => set(f.name, e.target.value)}>
                          {(f.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input id={id} type={f.kind ?? "text"} value={String(v)} required={f.required} placeholder={f.placeholder}
                          minLength={f.minLength} maxLength={f.maxLength} onChange={e => set(f.name, e.target.value)} />
                      )}
                      {f.hint ? <span className="zform-hint">{f.hint}</span> : null}
                    </label>
                  );
                })}
              </div>
              {error ? <p className="zform-err" role="alert">{error}</p> : null}
              <div className="zform-acts">
                <button type="button" className="obtn" onClick={close}>CANCEL</button>
                <button type="submit" data-action="submit" className="obtn obtn--accent" disabled={busy}>{busy ? "SENDING…" : submitLabel}</button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}

export default FormCard;
