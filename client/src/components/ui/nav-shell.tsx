import { forwardRef, type ReactNode } from "react";
import { Divider } from "@/components/ds";
import { navGlassPointer } from "@/components/ui/nav-glass";
import { MobileLiquidGlass } from "@/components/ui/mobile-liquid-glass";

/**
 * Board 34: the site header's shell. It owns the glass, the bottom seam and the
 * map-surface flag; Nav fills it with the row. The desktop row and the phone top
 * bar are this one shell (components/nav.css switches the layout); the dock
 * is MobileDockShell.
 */
export const NavShell = forwardRef<HTMLElement, { mapSurface?: boolean; loading?: boolean; children: ReactNode }>(
  function NavShell({ mapSurface, loading, children }, ref) {
    return (
      <header
        ref={ref}
        className="site-header site-header--real-seam site-header--compact site-header--caption-split z-glass site-header--glass"
        data-seam="bottom"
        data-map-surface={mapSurface || undefined}
        onPointerMove={navGlassPointer}
        onPointerLeave={navGlassPointer}
      >
        <MobileLiquidGlass quiet={false} />
        {children}
        <Divider seam thin loading={loading} className="site-header-rainbow-seam" />
      </header>
    );
  },
);
