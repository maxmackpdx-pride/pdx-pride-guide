import { useEffect, useRef, useState } from "react";
import { ImagePlus, Minus, Move, Plus, RotateCcw, Upload } from "lucide-react";
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
const MAX_AVATAR_BYTES = 8 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

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
  const ownedPreviewUrlRef = useRef<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState(photoUrl || "");
  const [ring, setRing] = useState(avatarRing || "none");
  const [crop, setCrop] = useState<AvatarCropData>(() => parseAvatarCrop(avatarCrop));
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const ringChanged = ring !== (avatarRing || "none");
  const canSave = !!sourceImage || !!photoUrl || ringChanged;

  useEffect(() => {
    setRing(avatarRing || "none");
    setCrop(parseAvatarCrop(avatarCrop));
    setPreviewUrl(photoUrl || "");
  }, [photoUrl, avatarRing, avatarCrop]);

  useEffect(() => () => {
    if (ownedPreviewUrlRef.current) URL.revokeObjectURL(ownedPreviewUrlRef.current);
  }, []);

  useEffect(() => {
    if (!sourceImage || !canvasRef.current) return;
    drawCropPreviewCanvas(canvasRef.current, sourceImage, crop);
  }, [sourceImage, crop]);

  const refreshPreview = async (nextCrop: AvatarCropData, img = sourceImage) => {
    if (!img) return;
    try {
      const blob = await renderCroppedAvatarBlob(img, nextCrop, 256);
      if (ownedPreviewUrlRef.current) URL.revokeObjectURL(ownedPreviewUrlRef.current);
      const nextUrl = URL.createObjectURL(blob);
      ownedPreviewUrlRef.current = nextUrl;
      setPreviewUrl(nextUrl);
    } catch { /* preview only */ }
  };

  const handleFile = async (file: File) => {
    if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
      toast({ title: "Choose a JPG, PNG, GIF, or WebP image", variant: "destructive" });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({ title: "That image is larger than 8 MB", variant: "destructive" });
      return;
    }
    try {
      const img = await loadImageFromFile(file);
      const nextCrop = { ...DEFAULT_AVATAR_CROP };
      setSourceImage(img);
      setSelectedFile(file);
      setCrop(nextCrop);
      await refreshPreview(nextCrop, img);
    } catch {
      toast({ title: "Could not load image", variant: "destructive" });
    }
  };

  const cancelSelection = () => {
    if (ownedPreviewUrlRef.current) {
      URL.revokeObjectURL(ownedPreviewUrlRef.current);
      ownedPreviewUrlRef.current = null;
    }
    setSourceImage(null);
    setSelectedFile(null);
    setCrop(parseAvatarCrop(avatarCrop));
    setPreviewUrl(photoUrl || "");
    if (inputRef.current) inputRef.current.value = "";
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

  const nudgeCrop = (x: number, y: number) => {
    applyCrop({
      ...crop,
      offsetX: Math.max(0, Math.min(1, crop.offsetX + x)),
      offsetY: Math.max(0, Math.min(1, crop.offsetY + y)),
    });
  };

  const onCropKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = e.shiftKey ? 0.05 : 0.015;
    const movement: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const next = movement[e.key];
    if (!next) return;
    e.preventDefault();
    nudgeCrop(next[0], next[1]);
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
        const uploadRes = await fetch("/api/upload/avatar", { method: "POST", body: fd, credentials: "include" });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const data = await uploadRes.json();
        url = data.url;
      }

      const profileRes = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          avatarRing: ring,
          avatarCrop: sourceImage ? serializeAvatarCrop(crop) : avatarCrop,
          photoUrl: url || null,
        }),
      });
      if (!profileRes.ok) throw new Error("Profile save failed");
      toast({ title: "Avatar saved" });
      setSourceImage(null);
      setSelectedFile(null);
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
        credentials: "include",
        body: JSON.stringify({ photoUrl: null, avatarRing: "none", avatarCrop: null }),
      });
      if (!res.ok) throw new Error("Remove failed");
      setSourceImage(null);
      setSelectedFile(null);
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
          <div className="display avatar-editor__preview-label">LIVE PREVIEW</div>
          <p className="avatar-editor__preview-copy">
            Drag to reposition. Zoom to fit your face in the circle. Rings are optional.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="avatar-editor__file-input"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.currentTarget.value = ""; }}
      />

      <button
        type="button"
        className={`avatar-editor__dropzone${dragActive ? " is-dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
      >
        <span className="avatar-editor__dropzone-icon" aria-hidden="true">
          {sourceImage ? <ImagePlus size={24} /> : <Upload size={24} />}
        </span>
        <span className="avatar-editor__dropzone-copy">
          <strong>{sourceImage ? "CHOOSE A DIFFERENT PHOTO" : "DROP A PHOTO HERE OR BROWSE"}</strong>
          <small>JPG, PNG, GIF, or WebP · 8 MB max</small>
        </span>
      </button>

      {sourceImage && (
        <div className="avatar-editor__crop-panel">
          <div className="avatar-editor__crop-heading">
            <div>
              <span className="avatar-editor__label">POSITION YOUR PHOTO</span>
              {selectedFile && <span className="avatar-editor__file-meta">{selectedFile.name} · {formatFileSize(selectedFile.size)}</span>}
            </div>
            <button type="button" className="avatar-editor__text-btn" onClick={cancelSelection}>CANCEL</button>
          </div>
          <canvas
            ref={canvasRef}
            width={CROP_CANVAS}
            height={CROP_CANVAS}
            className={`avatar-editor__crop-canvas${dragging ? " dragging" : ""}`}
            tabIndex={0}
            aria-label="Avatar crop. Drag or use the arrow keys to reposition the photo."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onCropKeyDown}
          />
          <div className="avatar-editor__crop-help"><Move size={14} aria-hidden="true" /> Drag or use arrow keys to reposition</div>
          <div className="avatar-editor__zoom-row">
            <Minus size={16} aria-hidden="true" />
            <label htmlFor="avatar-zoom" className="sr-only">Avatar zoom</label>
            <input
              id="avatar-zoom"
              type="range"
              min={1}
              max={4}
              step={0.02}
              value={crop.scale}
              onChange={e => applyCrop({ ...crop, scale: Number(e.target.value) })}
              className="avatar-editor__zoom"
            />
            <Plus size={16} aria-hidden="true" />
            <button
              type="button"
              className="avatar-editor__reset-btn"
              onClick={() => applyCrop({ ...DEFAULT_AVATAR_CROP })}
            >
              <RotateCcw size={14} aria-hidden="true" /> RESET
            </button>
          </div>
        </div>
      )}

      <label className="avatar-editor__label">PRIDE GLOW (OPTIONAL)</label>
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
      {(previewUrl || photoUrl) && !sourceImage && (
        <button type="button" className="avatar-editor__remove" disabled={saving} onClick={() => void handleRemove()}>
          REMOVE PHOTO
        </button>
      )}
    </div>
  );
}
