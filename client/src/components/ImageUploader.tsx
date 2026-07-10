import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_ACCEPT = "image/jpeg,image/png,image/gif,image/webp";
const FORMAT_HINT = "JPG, PNG, WebP, or GIF, max 8MB";

interface Props {
  endpoint: string;        // e.g. "/api/upload/poster"
  fieldName?: string;      // multer field name, default "poster"
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
  accept?: string;
  hint?: string;
  className?: string;
  buttonClassName?: string;
}

export default function ImageUploader({
  endpoint,
  fieldName = "poster",
  currentUrl,
  onUploaded,
  label = "Upload Image",
  accept = DEFAULT_ACCEPT,
  hint = FORMAT_HINT,
  className = "",
  buttonClassName = "",
}: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append(fieldName, file);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd, credentials: "include" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Upload failed");
      setPreview(payload.url);
      onUploaded(payload.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast({
        title: "Upload failed",
        description: message.includes("invalid") || message.includes("8MB")
          ? message
          : `${message}. Use ${FORMAT_HINT.toLowerCase()}.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className={buttonClassName}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            fontFamily: "var(--font-display)", fontWeight: 900,
            fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase",
            background: uploading ? "#1a1a1a" : "transparent",
            color: uploading ? "var(--text-meta)" : "var(--neon-yellow)",
            border: "2px solid var(--neon-yellow)",
            padding: "8px 16px", cursor: uploading ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "UPLOADING..." : label}
        </button>
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{ maxHeight: 72, maxWidth: 120, border: "1px solid #333", objectFit: "cover" }}
            onError={e => (e.currentTarget.style.display = "none")}
          />
        )}
        {preview && (
          <button
            type="button"
            onClick={() => { setPreview(""); onUploaded(""); }}
            style={{ background: "none", border: "none", color: "var(--text-meta)", fontSize: "0.75rem", cursor: "pointer", fontFamily: "var(--font-display)" }}
          >
            REMOVE
          </button>
        )}
      </div>
      {hint && (
        <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: 6 }}>
          {hint}
        </div>
      )}
    </div>
  );
}