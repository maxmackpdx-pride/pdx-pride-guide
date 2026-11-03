import { prefetchMapz } from "./prefetchMapz";
/** Warm only an actual same-origin Mapz link while Home is mounted. Never delay navigation. */
export function listenForHomeMapIntent() {
  const warm = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin === window.location.origin && url.pathname === "/map") prefetchMapz();
  };
  const types = ["pointerover", "focusin", "touchstart"] as const;
  for (const type of types) document.addEventListener(type, warm, { passive: true });
  return () => { for (const type of types) document.removeEventListener(type, warm); };
}
