/**
 * Reset page scroll so reloads and zoomed layouts don't land offset right.
 * iOS/Safari pinch-zoom and bfcache restores often leave scrollX ≠ 0.
 */

function scrollRoots(): HTMLElement[] {
  const list: Array<HTMLElement | null> = [
    document.scrollingElement as HTMLElement | null,
    document.documentElement,
    document.body,
    document.getElementById("root"),
    document.querySelector(".app-shell"),
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

/** Full reset to top-left (route change, hard reload). */
export function resetPageScroll() {
  try {
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  } catch {
    window.scrollTo(0, 0);
  }
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
 * Horizontal only — keeps vertical position.
 * Use after pinch-zoom / visualViewport shifts that shove content off-center.
 */
export function reCenterHorizontalScroll() {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  try {
    window.scrollTo({ left: 0, top: y, behavior: "auto" });
  } catch {
    window.scrollTo(0, y);
  }
  for (const el of scrollRoots()) {
    try {
      el.scrollLeft = 0;
    } catch {
      /* ignore */
    }
  }
}

/** Install global listeners once (main.tsx). */
export function installScrollRecenterListeners() {
  if (typeof window === "undefined") return;
  if ((window as Window & { __pdxScrollRecenter?: boolean }).__pdxScrollRecenter) return;
  (window as Window & { __pdxScrollRecenter?: boolean }).__pdxScrollRecenter = true;

  const hardReset = () => {
    resetPageScroll();
    requestAnimationFrame(resetPageScroll);
  };

  // Full reload + bfcache restore
  window.addEventListener("pageshow", (e) => {
    // Always re-center; persisted bfcache is a common "stuck offset" case.
    hardReset();
    if (e.persisted) {
      window.setTimeout(hardReset, 50);
    }
  });

  window.addEventListener("orientationchange", () => {
    window.setTimeout(hardReset, 80);
  });

  // Pinch-zoom / mobile visual viewport often leaves scrollX non-zero.
  let vvTimer: number | undefined;
  const onVisualViewport = () => {
    window.clearTimeout(vvTimer);
    vvTimer = window.setTimeout(() => {
      const x =
        window.scrollX ||
        document.documentElement.scrollLeft ||
        document.body.scrollLeft ||
        0;
      if (Math.abs(x) > 0.5) {
        reCenterHorizontalScroll();
      }
    }, 120);
  };

  const vv = window.visualViewport;
  if (vv) {
    vv.addEventListener("resize", onVisualViewport);
    vv.addEventListener("scroll", onVisualViewport);
  }
  window.addEventListener("resize", onVisualViewport);
}
