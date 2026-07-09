import { useState, type FormEvent } from "react";
import "./PortfolioContactModal.css";

interface PortfolioContactModalProps {
  onClose: () => void;
}

type Status = "idle" | "sending" | "sent" | "error";

const MAX_FILES = 3;

export default function PortfolioContactModal({ onClose }: PortfolioContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list).slice(0, MAX_FILES));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Name, email, and a message are required.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("email", email.trim());
      form.append("phone", phone.trim());
      form.append("message", message.trim());
      form.append("company", honeypot);
      files.forEach(f => form.append("attachments", f));

      const res = await fetch("/api/contact/message", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Could not send that. Try again in a bit.");
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send that. Try again in a bit.");
    }
  };

  return (
    <div className="pcm-overlay" onClick={onClose}>
      <div className="pcm-panel" onClick={e => e.stopPropagation()}>
        <button type="button" className="pcm-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {status === "sent" ? (
          <div className="pcm-sent">
            <h2>Message sent</h2>
            <p>It's in my inbox — I'll get back to you.</p>
            <button type="button" className="btn-neon magenta" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="pcm-title">Message me</h2>
            <p className="pcm-sub">Goes straight to my inbox — no email needed on my end.</p>

            <label className="pcm-field">
              <span>Name *</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={120}
                autoComplete="name"
              />
            </label>

            <label className="pcm-field">
              <span>Email *</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                maxLength={200}
                autoComplete="email"
              />
            </label>

            <label className="pcm-field">
              <span>Phone (optional)</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={40}
                autoComplete="tel"
              />
            </label>

            <label className="pcm-field">
              <span>Message *</span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                maxLength={4000}
                rows={5}
              />
            </label>

            <label className="pcm-field">
              <span>Attachments (optional, up to {MAX_FILES})</span>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={e => handleFiles(e.target.files)}
              />
              {files.length > 0 && (
                <div className="pcm-files">
                  {files.map(f => (
                    <span key={f.name}>{f.name}</span>
                  ))}
                </div>
              )}
            </label>

            {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
            <input
              type="text"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="pcm-honeypot"
              aria-hidden="true"
            />

            {error && <p className="pcm-error">{error}</p>}

            <button type="submit" className="btn-neon magenta" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
