import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  endpoint: string;        // e.g. "/api/upload/poster"
  fieldName?: string;      // multer field name, default "poster"
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
  accept?: string;
}

export default function ImageUploader({
  endpoint,
  fieldName = "poster",
  currentUrl,
  onUploaded,
  label = "Upload Image",
  accept = "image/jpeg,image/png,image/gif,image/webp",
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
      const res = await fetch(endpoint, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setPreview(url);
      onUploaded(url);
    } catch {
      toast({ title: "Upload failed", description: "Try a jpg/png under 8MB.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
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
    </div>
  );
}
