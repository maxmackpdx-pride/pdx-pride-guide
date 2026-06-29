import { useEffect } from "react";

export type PageSeoOptions = {
  url?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Sets document.title, description, and Open Graph / Twitter tags for the current route. */
export function usePageSeo(title: string, description: string, options?: PageSeoOptions) {
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

    const url = options?.url || (typeof window !== "undefined" ? window.location.href.split("#")[0] : "");
    const image = options?.image || "https://www.prideguidepdx.com/og-preview.jpg";
    const imageAlt = options?.imageAlt || title;
    const type = options?.type || "website";

    const ogKeys = [
      ["property", "og:title", title],
      ["property", "og:description", description],
      ["property", "og:url", url],
      ["property", "og:image", image],
      ["property", "og:type", type],
    ] as const;
    const prevOg = ogKeys.map(([attr, key]) => {
      const el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      return [key, el?.getAttribute("content") ?? ""] as const;
    });

    for (const [attr, key, value] of ogKeys) {
      upsertMeta(attr, key, value);
    }
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "twitter:image:alt", imageAlt);

    return () => {
      document.title = prevTitle;
      if (meta) meta.setAttribute("content", prevDescription);
      for (const [key, value] of prevOg) {
        const el = document.querySelector(`meta[property="${key}"]`) as HTMLMetaElement | null;
        if (el && value) el.setAttribute("content", value);
      }
    };
  }, [title, description, options?.url, options?.image, options?.imageAlt, options?.type]);
}