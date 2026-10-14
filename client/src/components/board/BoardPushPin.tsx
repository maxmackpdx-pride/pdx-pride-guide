/** Decorative hardware stays fixed while the card swings around its needle. */
export default function BoardPushPin({ postKey }: { postKey: string }) {
  const variant = Array.from(postKey).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0) % 4;
  return (
    <svg className={`ab-pin ab-pin--${variant}`} viewBox="0 0 40 48" aria-hidden="true" focusable="false">
      <ellipse className="ab-pin__contact" cx="21" cy="41" rx="6" ry="2" />
      <g className="ab-pin__hardware">
        <path className="ab-pin__needle" d="M18 27 24 29 20 40Z" />
        <path className="ab-pin__side" d="m10 24 7-8 1-8 10 3-4 9 6 10-11 4-10-5Z" />
        <path className="ab-pin__face" d="m10 24 10-3 10 9-11 4-10-5Z" />
        <path className="ab-pin__neck" d="m17 16 1-8 10 3-4 9-4 1Z" />
        <path className="ab-pin__cap-side" d="m12 7 3-4 16 5 1 6-9 4-11-5Z" />
        <path className="ab-pin__cap" d="m12 7 10-4 9 5-9 5Z" />
        <path className="ab-pin__shine" d="m14 7 8-2 6 3M11 25l8-2 5 4" />
        <g className="ab-pin__wire">
          <path d="m22 3 9 5 1 6-9 4-1-5V3Zm0 10 9-5m-8 10 1 2 6 10-11 4 1-13 4-1m-4 1 10 9m-11 4 5-14" />
          <path className="ab-pin__mesh" d="m26 6-3 12m5-9-1 7m-7 9 7 1m-7 3 9 1" />
        </g>
        <g className="ab-pin__glitch">
          <path d="M27 8h8m-13 9h8M9 26h9m7 4h9" />
          <path d="M30 11h4M7 28h5" />
        </g>
      </g>
    </svg>
  );
}
