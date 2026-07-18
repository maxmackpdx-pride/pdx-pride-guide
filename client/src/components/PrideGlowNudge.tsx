import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import { AVATAR_EMOJI_OPTIONS, AVATAR_RING_OPTIONS } from "@shared/avatarRings";
import {
  DEFAULT_AVATAR_CROP,
  drawCropPreviewCanvas,
  loadImageFromFile,
  renderCroppedAvatarBlob,
  serializeAvatarCrop,
  type AvatarCropData,
} from "@/lib/avatarCrop";
import { useToast } from "@/hooks/use-toast";

const SEEN_PREFIX = "pgpdx:glow-nudge:v1:";
const CROP_CANVAS = 240;

/** True when the ring is unset / the explicit "none" default. */
function ringMissing(ring?: string | null): boolean {
  return !ring || ring === "none";
}

/** Still on the default avatar: no uploaded photo and the default choice (1). */
function avatarMissing(photoUrl?: string | null, avatarChoice?: number): boolean {
  return !photoUrl && (!avatarChoice || avatarChoice === 1);
}

function forcedPreview(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("glowNudge") === "1";
  } catch {
    return false;
  }
}

/**
 * One-time nudge that reminds members who haven't picked a glow ring and/or a
 * non-default avatar that they can show off their pride — and lets them do it
 * right here: pick an illustrated avatar, upload a photo, and choose a pride
 * ring, then save. A profile photo counts as "has an avatar". Shows once per
 * member (localStorage); `?glowNudge=1` force-shows it for previewing.
 */
export default function PrideGlowNudge() {
  const { user, loading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Editor state.
  const [choice, setChoice] = useState(1);
  const [ring, setRing] = useState("none");
  const [mode, setMode] = useState<"avatar" | "photo">("avatar");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<AvatarCropData>({ ...DEFAULT_AVATAR_CROP });
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const needsRing = user ? ringMissing(user.avatarRing) : false;
  const needsAvatar = user ? avatarMissing(user.photoUrl, user.avatarChoice) : false;
  const seenKey = user ? `${SEEN_PREFIX}${user.id}` : null;

  // Decide whether to show, and seed the editor from the member's current state.
  useEffect(() => {
    if (loading || !user) return;
    const forced = forcedPreview();
    if (!forced) {
      if (!needsRing && !needsAvatar) return;
      if (!seenKey) return;
      let alreadySeen = false;
      try {
        alreadySeen = localStorage.getItem(seenKey) === "1";
      } catch {
        alreadySeen = false;
      }
      if (alreadySeen) return;
      // Mark seen the moment we decide to show it, so it appears only once.
      try {
        localStorage.setItem(seenKey, "1");
      } catch {
        /* ignore */
      }
    }
    setChoice(user.avatarChoice || 1);
    setRing(user.avatarRing || "none");
    setMode(user.photoUrl ? "photo" : "avatar");
    const t = window.setTimeout(() => setOpen(true), forced ? 0 : 900);
    return () => window.clearTimeout(t);
  }, [loading, user, seenKey, needsRing, needsAvatar]);

  // Escape to dismiss.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Redraw the crop canvas as the staged image / crop changes.
  useEffect(() => {
    if (mode !== "photo" || !sourceImage || !canvasRef.current) return;
    drawCropPreviewCanvas(canvasRef.current, sourceImage, crop);
  }, [mode, sourceImage, crop, open]);

  const refreshPhotoPreview = async (nextCrop: AvatarCropData, img: HTMLImageElement) => {
    try {
      const blob = await renderCroppedAvatarBlob(img, nextCrop, 256);
      setPreviewUrl(prev => {
        if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      /* preview only */
    }
  };

  const handleFile = async (file: File) => {
    try {
      const img = await loadImageFromFile(file);
      const nextCrop = { ...DEFAULT_AVATAR_CROP };
      setMode("photo");
      setSourceImage(img);
      setCrop(nextCrop);
      await refreshPhotoPreview(nextCrop, img);
    } catch {
      toast({ title: "Could not load image", variant: "destructive" });
    }
  };

  const applyCrop = (next: AvatarCropData) => {
    setCrop(next);
    if (sourceImage) void refreshPhotoPreview(next, sourceImage);
  };

  const pickAvatar = (id: number) => {
    setMode("avatar");
    setChoice(id);
    setSourceImage(null);
    setPreviewUrl(prev => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return "";
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sourceImage) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: crop.offsetX, oy: crop.offsetY };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !sourceImage) return;
    const dx = (e.clientX - dragRef.current.x) / 200;
    const dy = (e.clientY - dragRef.current.y) / 200;
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

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { avatarChoice: choice, avatarRing: ring };
      if (mode === "photo" && sourceImage) {
        const blob = await renderCroppedAvatarBlob(sourceImage, crop);
        const fd = new FormData();
        fd.append("avatar", blob, "avatar.jpg");
        const up = await fetch("/api/upload/avatar", { method: "POST", body: fd, credentials: "include" });
        if (!up.ok) throw new Error("Upload failed");
        const data = await up.json();
        body.photoUrl = data.url;
        body.avatarCrop = serializeAvatarCrop(crop);
      } else if (mode === "avatar") {
        // Picking an illustrated avatar clears any existing photo so it shows.
        body.photoUrl = null;
        body.avatarCrop = null;
      }
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      await refreshUser();
      toast({ title: "Looking good 🌈" });
      setOpen(false);
    } catch {
      toast({ title: "Could not save — try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!open || !user) return null;

  const previewPhoto = mode === "photo" ? previewUrl || user.photoUrl : null;

  return createPortal(
    <div className="glow-nudge__backdrop" role="presentation" onClick={() => !saving && setOpen(false)}>
      <div
        className="glow-nudge"
        role="dialog"
        aria-modal="true"
        aria-labelledby="glow-nudge-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="glow-nudge__x" onClick={() => setOpen(false)} aria-label="Close">✕</button>

        <div className="glow-nudge__preview" aria-hidden="true">
          <UserAvatar
            photoUrl={previewPhoto}
            avatarChoice={choice}
            avatarRing={ring}
            displayName={user.displayName}
            username={user.username}
            size={104}
          />
        </div>

        <p className="glow-nudge__kicker">Make it yours</p>
        <h2 id="glow-nudge-title" className="glow-nudge__title display">Show off your pride</h2>
        <p className="glow-nudge__body">Pick an avatar or upload a photo, then add a pride glow.</p>

        <div className="glow-nudge__scroll">
        {/* Pick an avatar */}
        <div className="glow-nudge__section">
          <span className="glow-nudge__label">Pick an avatar</span>
          <div className="glow-nudge__grid">
            {AVATAR_EMOJI_OPTIONS.map(a => (
              <button
                key={a.id}
                type="button"
                title={a.label}
                className={`glow-nudge__swatch${a.img ? " is-image" : ""}${mode === "avatar" && choice === a.id ? " is-on" : ""}`}
                style={a.img ? undefined : { background: a.bg }}
                onClick={() => pickAvatar(a.id)}
              >
                {a.img ? <img src={a.img} alt={a.label} /> : a.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Or upload */}
        <div className="glow-nudge__section">
          <span className="glow-nudge__label">…or upload your own</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />
          <button type="button" className="glow-nudge__upload" onClick={() => inputRef.current?.click()}>
            {sourceImage ? "Choose a different photo" : "Upload a photo"}
          </button>
          {mode === "photo" && sourceImage && (
            <div className="glow-nudge__crop">
              <canvas
                ref={canvasRef}
                width={CROP_CANVAS}
                height={CROP_CANVAS}
                className={`glow-nudge__canvas${dragging ? " is-drag" : ""}`}
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
                className="glow-nudge__zoom"
                aria-label="Zoom"
              />
            </div>
          )}
        </div>

        {/* Pride glow */}
        <div className="glow-nudge__section">
          <span className="glow-nudge__label">Add a pride glow</span>
          <div className="glow-nudge__rings">
            {AVATAR_RING_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                title={option.label}
                className={`glow-nudge__ring${ring === option.id ? " is-on" : ""}`}
                onClick={() => setRing(option.id)}
              >
                <UserAvatar
                  photoUrl={previewPhoto}
                  avatarChoice={choice}
                  avatarRing={option.id}
                  displayName={user.displayName}
                  username={user.username}
                  size={38}
                />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
        </div>

        <div className="glow-nudge__actions">
          <button type="button" className="glow-nudge__cta display" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save my look"}
          </button>
          <button type="button" className="glow-nudge__later" onClick={() => setOpen(false)} disabled={saving}>
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
