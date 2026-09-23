import type { ReactNode } from "react";
import "./BrowseContinuity.css";

/** Search, filters, then results: 21st's Search Toolbar pattern with Zaylist controls. */
export default function BrowseToolbar({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <div role="group" aria-label={label} className={`browse-toolbar ${className}`}>{children}</div>;
}
