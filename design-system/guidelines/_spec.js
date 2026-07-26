/* Shared specimen kit for the guideline pages.
   - Spec.grid(el, items)  renders token swatches; every value is read back from
     the stylesheet, so a specimen can never disagree with tokens/.
   - Spec.recipe(el, css)  renders the copyable CSS that produces the effect above it.
   - Any element with data-token="--name" becomes click-to-copy for that NAME
     (the token, not the value: the token is what you paste into code).       */
(() => {
const cs = getComputedStyle(document.documentElement);
const read = n => cs.getPropertyValue(n).trim();

const CSS_TEXT = `
.sp-grid{display:flex;flex-wrap:wrap;gap:12px}
.sp-sw{width:var(--sp-w,120px);cursor:pointer;border:0;background:none;padding:0;text-align:left;font:inherit;color:inherit;display:block}
.sp-sw .chip{height:var(--sp-h,54px);border-radius:var(--radius-md,4px);border:1px solid var(--border-default,#2b2b2b);position:relative;overflow:hidden}
.sp-sw .lbl{font-family:var(--font-display,'Barlow Condensed',sans-serif);font-weight:700;text-transform:uppercase;font-size:12.5px;color:var(--text-hi,#fff);margin-top:8px;line-height:1.1}
.sp-sw .tok{font-family:var(--font-mono,ui-monospace,monospace);font-size:10px;letter-spacing:.03em;color:var(--neon-cyan,#00FFFF);margin-top:3px;word-break:break-all;line-height:1.3}
.sp-sw .val{font-family:var(--font-mono,ui-monospace,monospace);font-size:10px;color:var(--text-faint,#666);margin-top:2px;line-height:1.3}
.sp-sw:hover .tok{color:var(--neon-cyan,#00FFFF)}
.sp-sw:hover .chip{border-color:var(--neon-cyan,#00FFFF)}
.sp-sw.copied .tok{color:var(--status-good,#39FF14)}
.sp-sw.copied .tok::after{content:" copied"}
[data-token]{cursor:pointer}
.sp-recipe{margin-top:16px;border:1px solid var(--border-default,#2b2b2b);border-radius:var(--radius-md,4px);background:var(--ink-1000,#050505)}
.sp-recipe .bar{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border-faint,#1a1a1a)}
.sp-recipe .bar span{font-family:var(--font-mono,ui-monospace,monospace);font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-faint,#666)}
.sp-recipe .bar button{margin-left:auto;white-space:nowrap;font-family:var(--font-mono,ui-monospace,monospace);font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;padding:4px 9px;border:1px solid var(--border-default,#2b2b2b);background:transparent;color:var(--text-lo,#999);border-radius:3px;cursor:pointer}
.sp-recipe .bar button:hover{color:var(--neon-cyan,#00FFFF);border-color:var(--neon-cyan,#00FFFF)}
.sp-recipe .bar button.done{color:var(--status-good,#39FF14);border-color:var(--status-good,#39FF14)}
.sp-recipe pre{margin:0;padding:12px 14px;overflow-x:auto;font-family:var(--font-mono,ui-monospace,monospace);font-size:11.5px;line-height:1.65;color:var(--text-body-muted,#c8c4bb);white-space:pre}
.sp-recipe .p{color:var(--neon-cyan,#00FFFF)}
.sp-recipe .t{color:var(--green-acid,#39FF14)}
.sp-recipe .c{color:var(--text-disabled,#4a4a4a)}
`;
const style = document.createElement("style");
style.textContent = CSS_TEXT;
document.head.appendChild(style);

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function flash(el) {
  el.classList.add("copied");
  setTimeout(() => el.classList.remove("copied"), 1100);
}
function copy(text, el) {
  navigator.clipboard.writeText(text).then(() => flash(el)).catch(() => {});
}

/* items: [tokenName, label, opts?]  opts: {shape:"circle"|"bar", glow:true, on:"--bg"} */
function grid(target, items, opts) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  const o = opts || {};
  el.classList.add("sp-grid");
  if (o.w) el.style.setProperty("--sp-w", o.w + "px");
  if (o.h) el.style.setProperty("--sp-h", o.h + "px");
  el.innerHTML = items.map(([tok, label, io]) => {
    const i = io || {}, v = read(tok) || "";
    const glow = i.glow ? ";box-shadow:0 0 16px color-mix(in srgb," + v + " 34%,transparent)" : "";
    const round = i.shape === "circle" ? ";border-radius:999px;width:" + (o.h || 54) + "px;margin:0 auto" : "";
    let chip;
    if (i.text) chip = '<div class="chip" style="display:grid;place-items:center;background:var(--bg-app,#0a0a0a)"><span style="font-family:var(--font-display,sans-serif);font-weight:800;font-size:20px;color:' + v + '">Aa</span></div>';
    else if (i.shadow) chip = '<div class="chip" style="background:transparent;border:0;display:grid;place-items:center;overflow:visible"><span style="width:64%;height:60%;background:var(--ink-750,#141414);border:2px solid var(--neon-yellow,#CCFF00);border-radius:var(--radius-xs,2px);box-shadow:' + v + '"></span></div>';
    else chip = '<div class="chip" style="background:' + (v || "transparent") + round + glow + '"></div>';
    return '<button class="sp-sw" data-token="' + tok + '" title="Copy ' + tok + '">' + chip +
      '<div class="lbl">' + esc(label) + '</div><div class="tok">' + tok + '</div><div class="val">' + esc(v) + '</div></button>';
  }).join("");
}

function highlight(css) {
  return esc(css)
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="c">$1</span>')
    .replace(/(var\(--[\w-]+\))/g, '<span class="t">$1</span>')
    .replace(/^(\s*)([\w-]+)(\s*:)/gm, '$1<span class="p">$2</span>$3');
}
/* recipe(el, css, label) */
function recipe(target, css, label) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  const box = document.createElement("div");
  box.className = "sp-recipe";
  box.innerHTML = '<div class="bar"><span>' + esc(label || "The recipe") + '</span><button type="button">Copy CSS</button></div><pre>' + highlight(css.trim()) + '</pre>';
  box.querySelector("button").addEventListener("click", e => {
    navigator.clipboard.writeText(css.trim()).then(() => {
      const b = e.currentTarget, t = b.textContent;
      b.textContent = "Copied"; b.classList.add("done");
      setTimeout(() => { b.textContent = t; b.classList.remove("done"); }, 1200);
    }).catch(() => {});
  });
  el.appendChild(box);
  return box;
}

document.addEventListener("click", e => {
  const el = e.target.closest("[data-token]");
  if (!el) return;
  copy(el.dataset.token, el);
});

window.Spec = { grid, recipe, read, copy };
})();
