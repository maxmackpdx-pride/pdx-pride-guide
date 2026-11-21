const ruleId = "rule:read-me/design-guide-principles::one-glass-in-production";
const ruleUrl = new URL("https://zaylist-foundation-library.maxmackpdx.workers.dev/api/design/v1/rules");
ruleUrl.searchParams.set("id", ruleId);

export async function publishedGlass() {
  const response = await fetch(ruleUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw Error(`Foundation Library returned HTTP ${response.status}`);
  const { record, release } = await response.json();
  if (!release?.id || record?.id !== ruleId || record.kind !== "rule" || record.lifecycle !== "canonical" ||
      record.contract?.releaseId !== release.id) throw Error("Unrecognized Foundation glass record or release");
  const source = record.content.replace(/\s+/g, " ");
  if (!/edge border is the (?:piece['’]s own )?(?:accent|token colou?r) exactly, locked/i.test(source))
    throw Error("The published rule no longer specifies an exact locked token edge");
  function read(pattern) {
    const match = source.match(pattern);
    if (!match) throw Error(`Cannot read the published field ${pattern}`);
    return Number(match[1]);
  }
  return {
    release: release.id, source: ruleUrl.href,
    frost: read(/\bfrost\s+(\d+(?:\.\d+)?)/i),
    saturation: read(/saturation behind (?:the )?glass\s+(\d+(?:\.\d+)?)\s*%/i),
    tint: read(/dark tint\s+(\d+(?:\.\d+)?)\s*%/i),
  };
}

// This function executes in the browser. Read paint properties on the actual
// host or on its named pseudo-element. A token declaration alone proves nothing.
export function measureGlass({ selector, accent }) {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  function rgba(color) {
    if (!color || !CSS.supports("color", color)) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const bytes = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    const alpha = color.match(/(?:\/|rgba?\([^)]*?,[^)]*?,[^)]*?,)\s*([\d.]+)(%)?\s*\)$/);
    return [...bytes.slice(0, 3), alpha ? Number(alpha[1]) / (alpha[2] ? 100 : 1) : bytes[3] / 255];
  }
  const rows = [];
  for (const element of document.querySelectorAll(selector)) {
    if (!element.checkVisibility({ visibilityProperty: true, opacityProperty: true }) || element.closest('section[aria-hidden="true"],[inert]')) continue;
    const id = element.dataset.glassPiece || element.className || element.tagName;
    const style = getComputedStyle(element, element.dataset.glassPseudo || null);
    const borderColors = [];
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (style[`border${side}Style`] !== "none" && parseFloat(style[`border${side}Width`]) > 0)
        borderColors.push(style[`border${side}Color`]);
    }
    if (!["none", "hidden"].includes(style.outlineStyle) && parseFloat(style.outlineWidth) > 0)
      borderColors.push(style.outlineColor);
    const token = rgba(style.getPropertyValue(accent).trim());
    const same = color => token && JSON.stringify(rgba(color)) === JSON.stringify(token);
    const backdrop = style.backdropFilter || style.webkitBackdropFilter || "none";
    const frost = [...backdrop.matchAll(/blur\(([\d.]+)px\)/g)].map(match => Number(match[1]));
    const saturation = [...backdrop.matchAll(/saturate\(([\d.]+)(%)?\)/g)]
      .reduce((product, match) => product * Number(match[1]) / (match[2] ? 100 : 1), 1) * 100;
    const fill = rgba(style.backgroundColor);
    // A gradient or image can supply a separate tint. Its alpha is unproven
    // until its actual tint layer is selected.
    const tint = fill && Math.max(...fill.slice(0, 3)) <= 32 && style.backgroundImage === "none" ? fill[3] * 100 : null;
    rows.push({ piece: String(id), accent: token, borders: [...new Set(borderColors)], edge: id === "scrim" ? !borderColors.length : !!token && !!borderColors.length && borderColors.every(same),
      frost: frost.length > 1 ? null : frost[0] ?? 0, saturation, tint, backdrop, background: style.backgroundColor });
  }
  return rows;
}

export function glassFlags(rows, standard) {
  return rows.flatMap(row => {
    const flags = [];
    if (!row.edge) flags.push(`edge mismatch or unmeasurable (${row.borders.join(", ") || "no painted border"}; token ${row.accent || "absent"})`);
    for (const key of ["frost", "saturation", "tint"]) {
      const measured = row[key];
      if (measured == null || Math.abs(measured - standard[key]) > 0.0001)
        flags.push(`${key} expected ${standard[key]}, measured ${measured ?? "unavailable"}`);
    }
    return flags.map(flag => `${row.piece}: ${flag}`);
  });
}
