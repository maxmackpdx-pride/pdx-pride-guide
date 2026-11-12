import { useState } from "react";
import { ServiceNameMark } from "@/components/ServiceNameMark";
import type { NeedzRow } from "./needzDeckModel";

/** The org's reviewed logo on file; the existing NEEDZ service mark only when no logo exists or it fails to load. */
export function NeedzLogo({ row, eager = false }: { row: NeedzRow; eager?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  const logo = row.logo;
  if (logo && failed !== logo) {
    return <img className="nd-logo" src={logo} alt={`${row.org.name} logo`} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(logo)} />;
  }
  return <div className="nd-logo-fallback" data-logo-fallback="true"><ServiceNameMark source={row.org} iconOnly /></div>;
}
