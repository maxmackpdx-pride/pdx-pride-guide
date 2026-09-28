/** Exact paths from /brand/line-icons, sized and colored by the surrounding UI. */
type ZLineIconName = "favorite" | "message" | "add";

export default function ZLineIcon({
  name,
  size = 18,
  filled = false,
}: {
  name: ZLineIconName;
  size?: number;
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon-source={`zaylist-${name}`}
    >
      {name === "favorite" && <path d="M12 21s-7-4.5-9.5-9C.8 8.3 3 4 7 4c2.2 0 3.8 1.3 5 3 1.2-1.7 2.8-3 5-3 4 0 6.2 4.3 4.5 8 -2.5 4.5-9.5 9-9.5 9Z" />}
      {name === "message" && <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />}
      {name === "add" && <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>}
    </svg>
  );
}
