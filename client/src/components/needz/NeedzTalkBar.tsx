import { useId } from "react";
import { ArrowUpRight, LogOut, MessageCircle, Phone } from "lucide-react";
import { NEEDZ_QUICK_EXIT_URL, NEEDZ_SAVED_KEY, NEEDZ_TALK_LINES, formatPhone } from "./needzDeckModel";

function quickExit() {
  try { window.sessionStorage.removeItem(NEEDZ_SAVED_KEY); } catch { /* storage may be blocked */ }
  window.location.replace(NEEDZ_QUICK_EXIT_URL);
}

/** Calm, always-present support row: a talk chip that opens real lines, plus a small Quick exit. */
export function NeedzTalkBar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const panelId = useId();
  return <div className="nd-talk">
    <div className="nd-talk__row">
      <button type="button" className="nd-talk__chip pdx-glass-rebind" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <MessageCircle size={18} aria-hidden="true" />
        <span>Need to talk to someone now?</span>
      </button>
      <button type="button" className="nd-talk__exit" aria-label="Quick exit: leave this page now" title="Quick exit" onClick={quickExit}>
        <LogOut size={18} aria-hidden="true" />
      </button>
    </div>
    <section id={panelId} className="nd-talk__panel pdx-glass-rebind" hidden={!open} aria-label="People you can talk to">
      <p className="nd-talk__lede">Free and confidential. You don't need to be in crisis to reach out.</p>
      <ul className="nd-talk__lines">
        {NEEDZ_TALK_LINES.map(line => <li key={line.tel} className="nd-talk__line" data-line={line.tel}>
          <div className="nd-talk__copy">
            <strong>{line.name}</strong>
            <span>{line.detail}</span>
            <a className="nd-talk__source" href={line.source} target="_blank" rel="noopener noreferrer">Official site <ArrowUpRight size={12} aria-hidden="true" /></a>
          </div>
          <div className="nd-talk__actions">
            <a className="pdx-glass-rebind pdxBtn nd-btn" href={`tel:${line.tel}`} aria-label={`Call ${line.name}, ${formatPhone(line.tel)}`}><Phone size={16} aria-hidden="true" /> Call</a>
            {line.sms && <a className="pdx-glass-rebind pdxBtn nd-btn" href={line.sms} aria-label={`${line.smsLabel} for ${line.name}`}>{line.smsLabel}</a>}
          </div>
        </li>)}
      </ul>
      <small className="nd-talk__note">Numbers checked against each official site, September 30, 2026. Quick exit opens a weather search and removes this page from your back button.</small>
    </section>
  </div>;
}
