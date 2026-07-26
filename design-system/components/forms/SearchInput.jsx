import React from "react";

const CSS = `
.pdxField{ display:flex; flex-direction:column; gap:6px; }
.pdxField__label{
  font-family:var(--font-mono); font-size:var(--meta-sm); font-weight:var(--fw-bold);
  letter-spacing:var(--tracking-kicker); text-transform:uppercase; color:var(--text-meta);
}
.pdxSearch{
  display:flex; align-items:center; gap:10px;
  height:48px; padding:0 16px;
  background:var(--surface-inset); color:var(--text-hi);
  border:var(--bw-bold) solid var(--border-default); border-radius:var(--radius-pill);
  transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.pdxSearch:focus-within{ border-color:var(--cyan); box-shadow:var(--glow-cyan); }
.pdxSearch__icon{ display:flex; color:var(--text-meta); flex:none; }
.pdxSearch__icon svg{ width:18px; height:18px; }
.pdxSearch input{
  flex:1; min-width:0; border:0; outline:0; background:transparent;
  font-family:var(--font-body); font-size:var(--body-md); color:var(--text-hi);
}
.pdxSearch input::placeholder{ color:var(--text-faint); }
.pdxSearch__clear{
  border:0; background:transparent; color:var(--text-meta); cursor:pointer;
  display:flex; padding:4px; border-radius:var(--radius-pill);
}
.pdxSearch__clear:hover{ color:var(--pink); }
.pdxSearch--sm{ height:40px; }
`;
if (typeof document !== "undefined" && !document.getElementById("pdx-search-css")) {
  const s = document.createElement("style");
  s.id = "pdx-search-css";
  s.textContent = CSS;
  document.head.appendChild(s);
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/** SearchInput, rounded search field for filtering the event list. */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search events, venues, DJs…",
  label,
  size = "md",
  id,
  ...rest
}) {
  const hasValue = value != null && value !== "";
  return (
    <div className="pdxField">
      {label && <label className="pdxField__label" htmlFor={id}>{label}</label>}
      <div className={`pdxSearch ${size === "sm" ? "pdxSearch--sm" : ""}`}>
        <span className="pdxSearch__icon"><SearchGlyph /></span>
        <input
          id={id}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
        />
        {hasValue && onClear && (
          <button type="button" className="pdxSearch__clear" aria-label="Clear search" onClick={onClear}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
              strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
