import { useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MemberProfileData } from "./types";

function CloseIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export default function MessageModal({
  data,
  username,
  onClose,
}: {
  data: MemberProfileData;
  username: string;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [msgSending, setMsgSending] = useState(false);
  const displayName = data.displayName || data.username;

  const sendMessage = async () => {
    const body = msgText.trim();
    if (!body || msgSending) return;
    setMsgSending(true);
    try {
      await apiRequest("POST", `/api/users/${encodeURIComponent(username)}/message`, { body });
      setMsgSent(true);
    } catch (err) {
      toast({ title: parseApiError(err, "Could not send message"), variant: "destructive" });
    } finally {
      setMsgSending(false);
    }
  };

  return (
    <div className="mp-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Message ${displayName}`}>
      <div className="mp-modal" onClick={e => e.stopPropagation()}>
        <div className="mp-modal__head">
          <UserAvatar
            photoUrl={data.photoUrl}
            avatarChoice={data.avatarChoice}
            avatarRing={data.avatarRing}
            displayName={data.displayName}
            username={data.username}
            size={52}
          />
          <div className="mp-modal__titles">
            <div className="display mp-modal__title">Message {displayName}</div>
            <div className="mp-modal__sub">Replies land in your Hub inbox.</div>
          </div>
          <button type="button" className="mp-embed-remove" onClick={onClose} aria-label="Close">
            <CloseIcon size={16} />
          </button>
        </div>

        {!msgSent ? (
          <div>
            <textarea
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              rows={5}
              placeholder={`Say hi to ${displayName}…`}
              className="mp-modal__input"
              data-testid="profile-message-input"
            />
            <div className="mp-modal__actions">
              <button type="button" className="mp-modal__cancel" onClick={onClose}>Cancel</button>
              <button
                type="button"
                className="btn-neon solid"
                onClick={() => void sendMessage()}
                disabled={!msgText.trim() || msgSending}
                data-testid="profile-message-send"
              >
                {msgSending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mp-modal__sent">
            <div className="mp-sent-check" aria-hidden="true">✓</div>
            <div className="display mp-modal__sent-title">Message sent</div>
            <p>{displayName} will get back to you in the Hub inbox. Take care of each other.</p>
            <button type="button" className="btn-neon cyan" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
