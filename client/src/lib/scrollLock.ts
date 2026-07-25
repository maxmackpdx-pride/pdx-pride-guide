/**
 * iOS-safe body scroll lock.
 *
 * Do NOT use `document.body.style.overflow = "hidden"` to lock scroll: on iOS
 * Safari that detaches the portaled `position: fixed` mobile bottom nav and
 * leaves it dropped below the visual viewport after the modal closes. Instead
 * we pin the body with `position: fixed` (which does NOT create a containing
 * block for fixed descendants, so the nav stays anchored to the viewport) and
 * restore the scroll position on unlock.
 *
 * Ref-counted so nested modals/sheets lock and unlock correctly.
 */
let lockCount = 0;
let savedScrollY = 0;

export function lockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    const b = document.body;
    b.style.position = "fixed";
    b.style.top = `-${savedScrollY}px`;
    b.style.left = "0";
    b.style.right = "0";
    b.style.width = "100%";
  }
  lockCount += 1;
}

export function unlockBodyScroll(): void {
  if (typeof document === "undefined") return;
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    const b = document.body;
    b.style.position = "";
    b.style.top = "";
    b.style.left = "";
    b.style.right = "";
    b.style.width = "";
    window.scrollTo(0, savedScrollY);
  }
}
