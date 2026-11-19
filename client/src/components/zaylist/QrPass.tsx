import { useMemo } from "react";
import { qrMatrix } from "./qr";

/** Renders a QR code for a guest token as an inline SVG. */
export default function QrPass({ token, label }: { token: string; label?: string }) {
  const matrix = useMemo(() => {
    try {
      return qrMatrix(token);
    } catch {
      return null;
    }
  }, [token]);
  if (!matrix) return <p className="zl-error">This code could not be drawn. Regenerate it from your list.</p>;
  const n = matrix.length;
  const quiet = 4;
  const size = n + quiet * 2;
  const cells: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix[y][x]) cells.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label ?? "Your Zay'list entry code"}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={cells.join("")} fill="#000000" />
    </svg>
  );
}
