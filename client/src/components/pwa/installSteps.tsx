import type { ReactNode } from "react";

// Shared "Save as Web App" how-to used by the auto push/install prompt
// (PushNotificationPrompt) and the manual Install-app card (InstallAppCard).
// No screenshots — the real controls live in the browser's own chrome, so we
// point the user straight at them with on-brand glyphs.

export const CYAN = "#19E3FF";

// The iOS Share glyph (up arrow out of a tray) — the button Apple uses for
// "Add to Home Screen"; it can't be triggered from a web page.
export function ShareGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

// A rounded square with a plus — "Add to Home Screen".
export function AddGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

// Android Chrome's ⋮ overflow-menu glyph (three vertical dots).
export function MenuGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={CYAN} aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

// Download-into-tray glyph — Chrome's "Install app".
export function InstallGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function HomeIcon({ src }: { src: string }) {
  return <img src={src} alt="" width={30} height={30} style={{ borderRadius: 8, display: "block" }} />;
}

export type Step = { icon: ReactNode; title: ReactNode; sub: string };

const b = (t: string) => <strong style={{ color: "#fff" }}>{t}</strong>;

export const IOS_STEPS: Step[] = [
  { icon: <ShareGlyph />, title: <>Tap the {b("Share")} button</>, sub: "In Safari's toolbar — the ⬆️ square, usually bottom-center." },
  { icon: <AddGlyph />, title: <>Choose {b("Add to Home Screen")}</>, sub: "Scroll the share menu down a little if you don't see it." },
  { icon: <HomeIcon src="/icons/apple-touch-icon.png" />, title: <>Open it from your {b("home screen")}</>, sub: "It launches full-screen, like a real app — icon and all." },
];

export const ANDROID_STEPS: Step[] = [
  { icon: <MenuGlyph />, title: <>Tap the {b("⋮ menu")}</>, sub: "Top-right corner of Chrome." },
  { icon: <InstallGlyph />, title: <>Choose {b("Install app")}</>, sub: "Some phones label it \"Add to Home screen.\"" },
  { icon: <HomeIcon src="/icons/apple-touch-icon.png" />, title: <>Open it from your {b("home screen")}</>, sub: "It launches full-screen, like a real app — icon and all." },
];

// On-brand, self-contained visual how-to. `compact` tightens spacing so the
// modal fits smaller phones without scrolling.
export function InstallSteps({ steps, compact = false }: { steps: Step[]; compact?: boolean }) {
  const box = compact ? 38 : 44;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 10 }}>
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: compact ? 11 : 13,
            padding: compact ? "9px 11px" : "11px 13px",
            background: "#0c0c0f",
            border: "1px solid rgba(25,227,255,0.28)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              position: "relative",
              width: box,
              height: box,
              flex: "none",
              display: "grid",
              placeItems: "center",
              background: "#08080a",
              border: "1px solid #23232a",
              borderRadius: 11,
            }}
          >
            {s.icon}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -7,
                left: -7,
                width: 20,
                height: 20,
                borderRadius: 999,
                background: CYAN,
                color: "#04141a",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
              }}
            >
              {i + 1}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#e8e8ea", fontSize: compact ? "0.9rem" : "0.95rem", lineHeight: 1.3 }}>{s.title}</div>
            <div style={{ color: "#8a8a92", fontSize: compact ? "0.78rem" : "0.8rem", lineHeight: 1.4, marginTop: 2 }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
