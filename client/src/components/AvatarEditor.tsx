import { useEffect, useRef, useState } from "react";
import { AVATAR_RING_OPTIONS } from "@shared/avatarRings";
import {
  DEFAULT_AVATAR_CROP,
  drawCropPreviewCanvas,
  loadImageFromFile,
  parseAvatarCrop,
  renderCroppedAvatarBlob,
  serializeAvatarCrop,
  type AvatarCropData,
} from "@/lib/avatarCrop";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/hooks/use-toast";

interface Props {
  photoUrl?: string | null;
  avatarRing?: string | null;
  avatarCrop?: string | null;
  avatarChoice?: number;
  displayName?: string | null;
  username?: string;
  onSaved: () => void;
}

const CROP_CANVAS = 280;

export default function AvatarEditor({
  photoUrl,
  avatarRing,
  avatarCrop,
  avatarChoice = 1,
  displayName,
  username,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState(photoUrl || "");
  const [ring, setRing] = useState(avatarRing || "none");
  const [crop, setCrop] = useState<AvatarCropData>(() => parseAvatarCrop(avatarCrop));
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const ringChanged = ring !== (avatarRing || "none");
  const canSave = !!sourceImage || !!photoUrl || ringChanged;

  useEffect(() => {
    setRing(avatarRing || "none");
    setCrop(parseAvatarCrop(avatarCrop));
    setPreviewUrl(photoUrl || "");
  }, [photoUrl, avatarRing, avatarCrop]);

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    drawCropPreviewCanvas(canvasRef.current, sourceImage, crop);
  }, [sourceImage, crop]);

  const refreshPreview = async (nextCrop: AvatarCropData, img = sourceImage) => {
    if (!img) return;
    try {
      const blob = await renderCroppedAvatarBlob(img, nextCrop, 256);
      setPreviewUrl(prev => {
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch { /* preview only */ }
  };

  const handleFile = async (file: File) => {
    try {
      const img = await loadImageFromFile(file);
      const nextCrop = { ...DEFAULT_AVATAR_CROP };
      setSourceImage(img);
      setCrop(nextCrop);
      await refreshPreview(nextCrop, img);
    } catch {
      toast({ title: "Could not load image", variant: "destructive" });
    }
  };

  const applyCrop = (next: AvatarCropData) => {
    setCrop(next);
    void refreshPreview(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sourceImage) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: crop.offsetX, oy: crop.offsetY };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !sourceImage) return;
    const dx = (e.clientX - dragRef.current.x) / 220;
    const dy = (e.clientY - dragRef.current.y) / 220;
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
    if (!sourceImage && !photoUrl && !ringChanged) {
      toast({ title: "Upload a photo or pick a ring", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let url = photoUrl || "";
      if (sourceImage) {
        const blob = await renderCroppedAvatarBlob(sourceImage, crop);
        const fd = new FormData();
        fd.append("avatar", blob, "avatar.jpg");
        const uploadRes = await fetch("/api/upload/avatar", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const data = await uploadRes.json();
        url = data.url;
      }

      const profileRes = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarRing: ring,
          avatarCrop: sourceImage ? serializeAvatarCrop(crop) : avatarCrop,
          photoUrl: url || null,
        }),
      });
      if (!profileRes.ok) throw new Error("Profile save failed");
      toast({ title: "Avatar saved" });
      setSourceImage(null);
      onSaved();
    } catch {
      toast({ title: "Could not save avatar", variant: "destructive" });
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
        body: JSON.stringify({ photoUrl: null, avatarRing: "none", avatarCrop: null }),
      });
      if (!res.ok) throw new Error("Remove failed");
      setSourceImage(null);
      setPreviewUrl("");
      setRing("none");
      setCrop({ ...DEFAULT_AVATAR_CROP });
      toast({ title: "Photo removed" });
      onSaved();
    } catch {
      toast({ title: "Could not remove photo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="avatar-editor">
      <div className="avatar-editor__preview-row">
        <UserAvatar
          photoUrl={previewUrl || photoUrl}
          avatarChoice={avatarChoice}
          displayName={displayName}
          username={username}
          avatarRing={ring}
          size={96}
        />
        <div className="avatar-editor__hint">
          <div className="display" style={{ color: "#CCFF00", fontSize: "0.9rem" }}>LIVE PREVIEW</div>
          <p style={{ color: "#666", fontSize: "0.82rem", margin: "6px 0 0", lineHeight: 1.4 }}>
            Drag to reposition. Zoom to fit your face in the circle. Rings are optional.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
      />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button type="button" className="avatar-editor__btn" onClick={() => inputRef.current?.click()}>
          CHOOSE PHOTO
        </button>
        {(previewUrl || photoUrl) && (
          <button type="button" className="avatar-editor__btn avatar-editor__btn--ghost" onClick={() => void handleRemove()}>
            REMOVE PHOTO
          </button>
        )}
      </div>

      {sourceImage && (
        <div className="avatar-editor__crop-panel">
          <label className="avatar-editor__label">CIRCLE CROP — DRAG & ZOOM</label>
          <canvas
            ref={canvasRef}
            width={CROP_CANVAS}
            height={CROP_CANVAS}
            className={`avatar-editor__crop-canvas${dragging ? " dragging" : ""}`}
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
            className="avatar-editor__zoom"
          />
        </div>
      )}

      <label className="avatar-editor__label">OUTER RING (OPTIONAL)</label>
      <div className="avatar-editor__ring-grid">
        {AVATAR_RING_OPTIONS.map(option => (
          <button
            key={option.id}
            type="button"
            className={`avatar-editor__ring-btn${ring === option.id ? " active" : ""}`}
            onClick={() => setRing(option.id)}
            title={option.label}
          >
            <UserAvatar
              photoUrl={previewUrl || photoUrl || undefined}
              avatarChoice={avatarChoice}
              displayName={displayName}
              username={username}
              avatarRing={option.id}
              size={40}
            />
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="avatar-editor__save"
        disabled={saving || !canSave}
        onClick={() => void handleSave()}
      >
        {saving ? "SAVING..." : sourceImage ? "SAVE CROPPED AVATAR" : "SAVE RING"}
      </button>
    </div>
  );
}