import { useState, type FormEvent } from "react";
import "./PortfolioContactModal.css";

export type PortfolioContactVariant = "message" | "sponsor" | "order";

interface PortfolioContactModalProps {
  onClose: () => void;
  /** Default "message" matches About "Message me". "sponsor" is the pitch form. "order" is custom disco bodies. */
  variant?: PortfolioContactVariant;
}

type Status = "idle" | "sending" | "sent" | "error";

const MAX_FILES = 3;

const SPONSORSHIP_TYPES = [
  "Event sponsor",
  "Directory / Places listing",
  "Homepage / banner",
  "Newsletter",
  "Pride Week takeover",
  "Other",
] as const;

const ORDER_SIZES = [
  { value: '14"', label: '14″' },
  { value: '18"', label: '18″' },
  { value: '24"', label: '24″' },
  { value: "Bigger (let's discuss)", label: "Bigger — let's discuss" },
] as const;

const DISCO_GALLERY = [
  {
    id: "pink",
    poster: "/about/disco/piece-pink.jpg",
    src: "/about/disco/piece-pink.mp4",
    label: "Hot pink rope · studio",
  },
  {
    id: "club",
    poster: "/about/disco/piece-club.jpg",
    src: "/about/disco/piece-club.mp4",
    label: "Club night",
  },
  {
    id: "green",
    poster: "/about/disco/piece-green.jpg",
    src: "/about/disco/piece-green.mp4",
    label: "Neon green rope",
  },
] as const;

export default function PortfolioContactModal({
  onClose,
  variant = "message",
}: PortfolioContactModalProps) {
  const isSponsor = variant === "sponsor";
  const isOrder = variant === "order";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sponsorshipType, setSponsorshipType] = useState("");
  const [lengthNeeded, setLengthNeeded] = useState("");
  const [size, setSize] = useState("");
  const [hangingSpace, setHangingSpace] = useState("");
  const [ceilingHeight, setCeilingHeight] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);

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
    if (isSponsor && (!businessName.trim() || !sponsorshipType.trim() || !lengthNeeded.trim())) {
      setError("Business name, sponsorship type, and length of time needed are required.");
      return;
    }
    if (isOrder && (!size.trim() || !hangingSpace.trim() || !ceilingHeight.trim())) {
      setError("Size, where it will hang, and ceiling height are required.");
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const form = new FormData();
      form.append("kind", isSponsor ? "sponsor" : isOrder ? "order" : "message");
      form.append("name", name.trim());
      form.append("email", email.trim());
      form.append("phone", phone.trim());
      form.append("message", message.trim());
      if (isSponsor) {
        form.append("businessName", businessName.trim());
        form.append("sponsorshipType", sponsorshipType.trim());
        form.append("lengthNeeded", lengthNeeded.trim());
      }
      if (isOrder) {
        form.append("size", size.trim());
        form.append("hangingSpace", hangingSpace.trim());
        form.append("ceilingHeight", ceilingHeight.trim());
      }
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

  const title =
    isSponsor ? "Pitch a sponsorship"
    : isOrder ? "Order a disco body"
    : "Message me";

  const sub =
    isSponsor
      ? "Goes straight to my Owner Desk. Tell me who you are and how long you want to be on the guide."
      : isOrder
        ? "Made to order, custom, about a month to finish. $1600 for 18″. Tell me the size, the room, and how high your ceiling is."
        : "Goes straight to my Owner Desk, not personal email or the shared admin queue.";

  return (
    <div className="pcm-overlay" onClick={onClose}>
      <div
        className={`pcm-panel${isSponsor ? " pcm-panel--sponsor" : ""}${isOrder ? " pcm-panel--order" : ""}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pcm-title"
      >
        <button type="button" className="pcm-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {status === "sent" ? (
          <div className="pcm-sent">
            <h2>
              {isSponsor ? "Pitch sent" : isOrder ? "Order inquiry sent" : "Message sent"}
            </h2>
            <p>
              {isSponsor
                ? "It's on my Owner Desk. I'll read it and get back to you."
                : isOrder
                  ? "It's on my Owner Desk. I'll review the space details and get back to you about timing and custom options."
                  : "It's on my Owner Desk. I'll get back to you."}
            </p>
            <button type="button" className="btn-neon magenta" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 id="pcm-title" className="pcm-title">
              {title}
            </h2>
            <p className="pcm-sub">{sub}</p>

            {isOrder && (
              <div className="pcm-gallery" aria-label="Examples of finished pieces">
                {DISCO_GALLERY.map(clip => (
                  <figure key={clip.id} className="pcm-gallery__item">
                    {playingId === clip.id ? (
                      <video
                        className="pcm-gallery__media"
                        src={clip.src}
                        poster={clip.poster}
                        controls
                        autoPlay
                        playsInline
                        muted
                        loop
                        onEnded={() => setPlayingId(null)}
                      />
                    ) : (
                      <button
                        type="button"
                        className="pcm-gallery__play"
                        onClick={() => setPlayingId(clip.id)}
                        aria-label={`Play video: ${clip.label}`}
                      >
                        <img src={clip.poster} alt="" width={280} height={360} loading="lazy" />
                        <span className="pcm-gallery__play-ico" aria-hidden="true">▶</span>
                      </button>
                    )}
                    <figcaption>{clip.label}</figcaption>
                  </figure>
                ))}
              </div>
            )}

            {isOrder && (
              <p className="pcm-order-note">
                Sizes: <strong>14″ · 18″ · 24″</strong>. Bigger is an option — we can discuss.
                Custom rope color and details welcome. Photos of your space help.
              </p>
            )}

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
              <span>{isOrder ? "Phone" : "Phone (optional)"}</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                maxLength={40}
                autoComplete="tel"
                placeholder={isOrder ? "Easier for custom follow-up" : undefined}
              />
            </label>

            {isSponsor && (
              <>
                <label className="pcm-field">
                  <span>Business name *</span>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    required
                    maxLength={160}
                    autoComplete="organization"
                    placeholder="Your business or brand"
                  />
                </label>

                <label className="pcm-field">
                  <span>Sponsorship type *</span>
                  <select
                    value={sponsorshipType}
                    onChange={e => setSponsorshipType(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose one…
                    </option>
                    {SPONSORSHIP_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pcm-field">
                  <span>Length of time needed *</span>
                  <input
                    type="text"
                    value={lengthNeeded}
                    onChange={e => setLengthNeeded(e.target.value)}
                    required
                    maxLength={120}
                    placeholder="e.g. Pride week, 3 months, year-round"
                  />
                </label>
              </>
            )}

            {isOrder && (
              <>
                <label className="pcm-field">
                  <span>Size *</span>
                  <select value={size} onChange={e => setSize(e.target.value)} required>
                    <option value="" disabled>
                      Choose a size…
                    </option>
                    {ORDER_SIZES.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="pcm-field">
                  <span>Where will it hang? *</span>
                  <textarea
                    value={hangingSpace}
                    onChange={e => setHangingSpace(e.target.value)}
                    required
                    maxLength={800}
                    rows={3}
                    placeholder="Room, over a dance floor, bedroom, bar, etc. — describe the space you see it in."
                  />
                </label>

                <label className="pcm-field">
                  <span>Ceiling height *</span>
                  <input
                    type="text"
                    value={ceilingHeight}
                    onChange={e => setCeilingHeight(e.target.value)}
                    required
                    maxLength={120}
                    placeholder="e.g. 9 ft, 12 ft, warehouse high"
                  />
                </label>
              </>
            )}

            <label className="pcm-field">
              <span>
                {isSponsor ? "Pitch notes *" : isOrder ? "Custom notes *" : "Message *"}
              </span>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                maxLength={4000}
                rows={isOrder ? 4 : 5}
                placeholder={
                  isSponsor
                    ? "What you want to sponsor, why you fit the values, budget range if you have one…"
                    : isOrder
                      ? "Rope color, vibe, deadline, budget notes, anything custom…"
                      : undefined
                }
              />
            </label>

            <label className="pcm-field">
              <span>
                {isOrder
                  ? `Photos of the space (optional, up to ${MAX_FILES})`
                  : `Attachments (optional, up to ${MAX_FILES})`}
              </span>
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

            <button
              type="submit"
              className={`btn-neon ${isSponsor ? "solid" : isOrder ? "cyan" : "magenta"}`}
              disabled={status === "sending"}
            >
              {status === "sending"
                ? "Sending…"
                : isSponsor
                  ? "Send pitch"
                  : isOrder
                    ? "Send order inquiry"
                    : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
