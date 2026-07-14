import { useEffect, useRef, useState } from "react";
import {
  COVER_PREVIEW_HEIGHT,
  COVER_PREVIEW_WIDTH,
  DEFAULT_COVER_CROP,
  coverCropToImgStyle,
  drawCoverPreviewCanvas,
  loadImageFromFile,
  loadImageFromUrl,
  parseCoverCrop,
  serializeCoverCrop,
  type CoverCropData,
} from "@/lib/coverCrop";
import { useToast } from "@/hooks/use-toast";

interface Props {
  coverImageUrl?: string | null;
  coverCrop?: string | null;
  onSaved: () => void;
}

export default function CoverEditor({ coverImageUrl, coverCrop, onSaved }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [isNewImage, setIsNewImage] = useState(false);
  const [crop, setCrop] = useState<CoverCropData>(() => parseCoverCrop(coverCrop));
  const [saving, setSaving] = useState(false);
  const [loadingAdjust, setLoadingAdjust] = useState(false);
  const [dragging, setDragging] = useState(false);

  const initialCrop = parseCoverCrop(coverCrop);
  const cropChanged =
    crop.offsetX !== initialCrop.offsetX ||
    crop.offsetY !== initialCrop.offsetY ||
    crop.scale !== initialCrop.scale;
  const canSave = (isNewImage && !!sourceImage) || (!!sourceImage && cropChanged);

  useEffect(() => {
    setCrop(parseCoverCrop(coverCrop));
    setSourceImage(null);
    setIsNewImage(false);
  }, [coverImageUrl, coverCrop]);

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    drawCoverPreviewCanvas(canvasRef.current, sourceImage, crop);
  }, [sourceImage, crop]);

  const handleFile = async (file: File) => {
    try {
      const img = await loadImageFromFile(file);
      const nextCrop = { ...DEFAULT_COVER_CROP };
      setSourceImage(img);
      setCrop(nextCrop);
      setIsNewImage(true);
    } catch {
      toast({ title: "Could not load image", variant: "destructive" });
    }
  };

  const handleAdjust = async () => {
    if (!coverImageUrl || sourceImage) return;
    setLoadingAdjust(true);
    try {
      const img = await loadImageFromUrl(coverImageUrl);
      setSourceImage(img);
      setCrop(parseCoverCrop(coverCrop));
      setIsNewImage(false);
    } catch {
      toast({ title: "Could not load cover image", variant: "destructive" });
    } finally {
      setLoadingAdjust(false);
    }
  };

  const applyCrop = (next: CoverCropData) => setCrop(next);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sourceImage) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: crop.offsetX, oy: crop.offsetY };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !sourceImage) return;
    const dx = (e.clientX - dragRef.current.x) / COVER_PREVIEW_WIDTH;
    const dy = (e.clientY - dragRef.current.y) / COVER_PREVIEW_HEIGHT;
    applyCrop({
      ...crop,
      offsetX: Math.max(0, Math.min(1, dragRef.current.ox - dx)),
      offsetY: Math.max(0, Math.min(1, dragRef.current.oy - dy)),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleSave = async () => {
    if (!sourceImage) {
      toast({ title: "Upload a cover image first", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let url = coverImageUrl || "";
      if (isNewImage) {
        const fd = new FormData();
        fd.append("cover", await imageToUploadBlob(sourceImage), "cover.jpg");
        const uploadRes = await fetch("/api/upload/cover", { method: "POST", body: fd, credentials: "include" });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const data = await uploadRes.json();
        url = data.url;
      }

      const profileRes = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          coverImageUrl: url || null,
          coverCrop: serializeCoverCrop(crop),
        }),
      });
      if (!profileRes.ok) throw new Error("Profile save failed");
      toast({ title: "Cover saved" });
      setSourceImage(null);
      setIsNewImage(false);
      onSaved();
    } catch {
      toast({ title: "Could not save cover", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ coverImageUrl: null, coverCrop: null }),
      });
      if (!res.ok) throw new Error("Remove failed");
      setSourceImage(null);
      setIsNewImage(false);
      setCrop({ ...DEFAULT_COVER_CROP });
      toast({ title: "Cover removed" });
      onSaved();
    } catch {
      toast({ title: "Could not remove cover", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cover-editor">
      {coverImageUrl && !sourceImage ? (
        <div className="cover-editor__preview">
          <img
            src={coverImageUrl}
            alt=""
            className="cover-editor__preview-img"
            style={coverCropToImgStyle(coverCrop)}
          />
        </div>
      ) : (
        <div className="cover-editor__preview cover-editor__preview--empty" aria-hidden="true">
          <div className="cover-editor__preview-dots" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button type="button" className="cover-editor__btn" onClick={() => inputRef.current?.click()}>
          CHOOSE COVER
        </button>
        {coverImageUrl && !sourceImage ? (
          <button
            type="button"
            className="cover-editor__btn cover-editor__btn--ghost"
            onClick={() => void handleAdjust()}
            disabled={loadingAdjust}
          >
            {loadingAdjust ? "LOADING..." : "ADJUST POSITION"}
          </button>
        ) : null}
        {coverImageUrl ? (
          <button type="button" className="cover-editor__btn cover-editor__btn--ghost" onClick={() => void handleRemove()}>
            REMOVE COVER
          </button>
        ) : null}
      </div>

      {sourceImage ? (
        <div className="cover-editor__crop-panel">
          <label className="cover-editor__label">BANNER CROP: DRAG & ZOOM</label>
          <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "var(--text-meta)", lineHeight: 1.4 }}>
            Drag to reposition the image behind your profile photo. Zoom to frame the shot.
          </p>
          <canvas
            ref={canvasRef}
            width={COVER_PREVIEW_WIDTH}
            height={COVER_PREVIEW_HEIGHT}
            className={`cover-editor__crop-canvas${dragging ? " dragging" : ""}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <input
            type="range"
            min={1}
            max={3}
            step={0.02}
            value={crop.scale}
            onChange={e => applyCrop({ ...crop, scale: Number(e.target.value) })}
            className="cover-editor__zoom"
          />
        </div>
      ) : null}

      <button
        type="button"
        className="cover-editor__save"
        disabled={saving || !canSave}
        onClick={() => void handleSave()}
      >
        {saving ? "SAVING..." : "SAVE COVER"}
      </button>
    </div>
  );
}

async function imageToUploadBlob(image: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(image, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      "image/jpeg",
      0.92,
    );
  });
}