import type { SVGProps } from "react";

/**
 * The one share glyph for Zaylist (Tucker, t267u): an open-top tray with an
 * arrow leaving it, the share mark people know from iOS. Drawn in-house on a
 * 24px grid with round caps so it sits beside lucide icons. Width/height are
 * only set when `size` is passed, so CSS-sized buttons keep control.
 */
export function ShareIcon({ size, strokeWidth = 2, ...props }: Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & { size?: number | string; strokeWidth?: number | string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      <path d="M12 3.5v11" />
      <path d="M8.25 7.25 12 3.5l3.75 3.75" />
      <path d="M8.5 10H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1.5" />
    </svg>
  );
}

export default ShareIcon;
