import { useEffect } from "react";

/** Sets document.title and meta description for the current route (client-side SPA). */
export function usePageSeo(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prevDescription = meta?.getAttribute("content") ?? "";
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (meta) meta.setAttribute("content", prevDescription);
    };
  }, [title, description]);
}