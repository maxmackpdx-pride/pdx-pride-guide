import { useSyncExternalStore } from "react";
import "./AdultContentGate.css";

const ACK_KEY = "pdx-chat-18-ack-v1";

let sessionOnly = false;
const ackEvent = "zaylist:adult-chat-ack";
function subscribe(listener: () => void) {
  window.addEventListener(ackEvent, listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener(ackEvent, listener); window.removeEventListener("storage", listener); };
}
export function useAdultChatAck() {
  return useSyncExternalStore(subscribe, hasAdultChatAck, () => false);
}
export function hasAdultChatAck(): boolean {
  try {
    return sessionOnly || localStorage.getItem(ACK_KEY) === "1";
  } catch {
    return sessionOnly;
  }
}

/**
 * 18+ interstitial shown the first time a group chat is opened on this
 * device. Wrap the chat body; children render once acknowledged.
 */
export default function AdultContentGate({
  children,
  onDecline,
}: {
  children: React.ReactNode;
  /** Optional: hides the "Not now" button when absent (inline panels). */
  onDecline?: () => void;
}) {
  const acked = useAdultChatAck();

  if (acked) return <>{children}</>;

  const accept = () => {
    try {
      localStorage.setItem(ACK_KEY, "1");
    } catch {
      sessionOnly = true;
    }
    window.dispatchEvent(new Event(ackEvent));
  };

  return (
    <div className="adult-gate" role="alertdialog" aria-label="18 and over only">
      <p className="adult-gate__kicker">18+ only</p>
      <h4 className="adult-gate__title display">Grown folks' chat</h4>
      <p className="adult-gate__copy">
        Group chats can include adult conversation. By entering you confirm
        you're 18 or older. Be kind - keep exact meetup details to DMs.
      </p>
      <div className="adult-gate__actions">
        <button type="button" className="adult-gate__enter display" onClick={accept}>
          I'm 18+ - enter chat
        </button>
        {onDecline && (
          <button type="button" className="adult-gate__leave" onClick={onDecline}>
            Not now
          </button>
        )}
      </div>
    </div>
  );
}
