import { useEffect, useRef, useState } from "react";

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue?: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

/**
 * Door scanner: camera + the browser's built-in BarcodeDetector where it
 * exists, with manual code entry always available as the fallback.
 * Calls onToken once per distinct code while it stays in frame.
 */
export default function Scanner({
  onToken,
  dark = false,
}: {
  onToken: (token: string) => void;
  dark?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [manual, setManual] = useState("");
  const [cameraState, setCameraState] = useState<"starting" | "on" | "unavailable">("starting");
  const lastRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (stopped) return;
        let detector: BarcodeDetectorLike | null = null;
        try {
          if (window.BarcodeDetector) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        } catch { /* Some browsers expose a detector without QR support. */ }
        const decode = detector ? null : (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const ctx = decode ? canvas.getContext("2d", { willReadFrequently: true }) : null;
        if (!detector && !ctx) throw new Error("Camera decoder unavailable");
        if (stopped) return;
        setCameraState("on");
        const tick = async () => {
          if (stopped) return;
          try {
            let raw: string | undefined;
            if (detector) {
              raw = (await detector.detect(video))[0]?.rawValue?.trim();
            } else if (decode && ctx && video.videoWidth && video.videoHeight) {
              const ratio = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
              canvas.width = Math.round(video.videoWidth * ratio);
              canvas.height = Math.round(video.videoHeight * ratio);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              raw = decode(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data;
            }
            if (raw && !stopped) {
              const now = Date.now();
              if (raw !== lastRef.current.value || now - lastRef.current.at > 4000) {
                lastRef.current = { value: raw, at: now };
                onTokenRef.current(raw);
              }
            }
          } catch {
            /* a failed frame is not a failed scanner */
          }
          raf = window.setTimeout(tick, 350) as unknown as number;
        };
        tick();
      } catch {
        stream?.getTracks().forEach(track => track.stop());
        if (!stopped) setCameraState("unavailable");
      }
    }
    start();
    return () => {
      stopped = true;
      window.clearTimeout(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div>
      {cameraState !== "unavailable" ? (
        <video ref={videoRef} className="zl-video" playsInline muted aria-label="Camera view for scanning entry codes" />
      ) : (
        <p className={dark ? "zl-person-meta" : "zl-note"}>
          Camera scanning is not available on this device. Enter the code from the guest pass instead.
        </p>
      )}
      <form
        className="zl-row"
        style={{ marginTop: 10 }}
        onSubmit={(e) => {
          e.preventDefault();
          const value = manual.trim();
          if (value) {
            onToken(value);
            setManual("");
          }
        }}
      >
        <input
          className="zl-input"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Entry code"
          aria-label="Entry code"
          autoComplete="off"
          autoCapitalize="off"
        />
        <button className="zl-btn" type="submit">
          Check code
        </button>
      </form>
    </div>
  );
}
