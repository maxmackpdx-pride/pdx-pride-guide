/**
 * Scroll helpers:
 * - Hard reset to top-left only on route change / reload / orientation
 * - Horizontal re-center only after zoom settles at scale ~1 (never mid-pan)
 *
 * Do NOT:
 * - schedule multiple delayed top:0 resets (fights the user / “page scrolls itself”)
 * - zero scrollLeft on every visualViewport scroll (L/R glitch while zoomed or panning)
 * - call window.scrollTo on every resize tick during vertical scroll (U/D jank)
 */

function scrollRoots(): HTMLElement[] {
  const list: Array<HTMLElement | null> = [
    document.scrollingElement as HTMLElement | null,
    document.documentElement,
    document.body,
    document.getElementById("root"),
    document.querySelector(".app-shell"),
    document.querySelector("main"),
  ];
  const seen = new Set<HTMLElement>();
  const out: HTMLElement[] = [];
  for (const el of list) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    out.push(el);
  }
  return out;
}

function pinWindow(left: number, top: number) {
  try {
    window.scrollTo({ left, top, behavior: "auto" });
  } catch {
    window.scrollTo(left, top);
  }
}

/** Full reset to top-left (route change, hard reload). */
export function resetPageScroll() {
  pinWindow(0, 0);
  for (const el of scrollRoots()) {
    try {
      el.scrollLeft = 0;
      el.scrollTop = 0;
    } catch {
      /* ignore */
    }
  }
}

/**
 * Horizontal only - keeps vertical position.
 * Use after pinch-zoom settles back to ~1× or resize that shoves content sideways.
 */
export function reCenterHorizontalScroll() {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  // Only touch window scroll if X is actually off - avoids interrupting Y momentum
  const x =
    window.scrollX ||
    document.documentElement.scrollLeft ||
    document.body.scrollLeft ||
    0;
  if (Math.abs(x) > 0.5) {
    pinWindow(0, y);
  }
  for (const el of scrollRoots()) {
    try {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
    } catch {
      /* ignore */
    }
  }
}

/** True if the page is scrolled sideways (zoomed layout drift). */
export function isHorizontallyOffset(): boolean {
  const x =
    window.scrollX ||
    document.documentElement.scrollLeft ||
    document.body.scrollLeft ||
    0;
  if (Math.abs(x) > 0.5) return true;
  for (const el of scrollRoots()) {
    try {
      if (Math.abs(el.scrollLeft) > 0.5) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/** Current visual viewport scale (1 when not pinch-zoomed). */
function visualScale(): number {
  return window.visualViewport?.scale ?? 1;
}

/** Soft re-center: only if scrollX is non-zero and we are not mid-zoom. */
export function ensurePageCentered() {
  // While pinch-zoomed the user pans with non-zero offsets - do not fight them.
  if (visualScale() > 1.02) return;
  if (isHorizontallyOffset()) {
    reCenterHorizontalScroll();
  }
}

/**
 * Pin once to top-left, then optionally re-check horizontal only.
 * No multi-second delayed top:0 spam.
 */
export function scheduleScrollReset() {
  resetPageScroll();
  requestAnimationFrame(() => {
    resetPageScroll();
    // One short settle pass for horizontal only (layout may shift width, not scrollY)
    window.setTimeout(() => ensurePageCentered(), 80);
  });
}

/** Install global listeners once (main.tsx). */
export function installScrollRecenterListeners() {
  if (typeof window === "undefined") return;
  if ((window as Window & { __pdxScrollRecenter?: boolean }).__pdxScrollRecenter) return;
  (window as Window & { __pdxScrollRecenter?: boolean }).__pdxScrollRecenter = true;

  // Full reload + bfcache restore - once, not a cascade of top jumps
  window.addEventListener("pageshow", (e) => {
    scheduleScrollReset();
    if (e.persisted) {
      window.setTimeout(() => scheduleScrollReset(), 60);
    }
  });

  window.addEventListener("orientationchange", () => {
    window.setTimeout(() => scheduleScrollReset(), 100);
  });

  // Pinch-zoom / layout resize:
  // - Never re-center on visualViewport *scroll* (fires every pan → L/R fight)
  // - Only act after scale settles near 1×, or window resize at 1× with sideways drift
  let vvTimer: number | undefined;
  let lastScale = visualScale();

  const onViewportSettled = () => {
    window.clearTimeout(vvTimer);
    vvTimer = window.setTimeout(() => {
      const scale = visualScale();
      const wasZoomed = lastScale > 1.02;
      const isZoomed = scale > 1.02;
      lastScale = scale;

      // Mid-zoom: leave pan alone so content stays under the pinch / stays centerable
      if (isZoomed) return;

      // Zoom just ended, or plain resize left the layout sideways
      if (wasZoomed || isHorizontallyOffset()) {
        ensurePageCentered();
      }
    }, 200);
  };

  const vv = window.visualViewport;
  if (vv) {
    // resize = scale/chrome changes; scroll = pan (skip - causes glitchy L/R)
    vv.addEventListener("resize", onViewportSettled);
  }
  window.addEventListener("resize", onViewportSettled);

  // Fonts may change metrics; only fix sideways drift at 1×
  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      ensurePageCentered();
    });
  }
}
