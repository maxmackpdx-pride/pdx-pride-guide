import { useState } from "react";
import "./AdultContentGate.css";

const ACK_KEY = "pdx-chat-18-ack-v1";

export function hasAdultChatAck(): boolean {
  try {
    return localStorage.getItem(ACK_KEY) === "1";
  } catch {
    return false;
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
  const [acked, setAcked] = useState(hasAdultChatAck);

  if (acked) return <>{children}</>;

  const accept = () => {
    try {
      localStorage.setItem(ACK_KEY, "1");
    } catch {
      /* still allow through this session */
    }
    setAcked(true);
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
