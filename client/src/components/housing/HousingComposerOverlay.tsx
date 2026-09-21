import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import type { HousingType } from "@shared/housing";
import { HousingComposer } from "./HousingComposer";
import { useModalA11y } from "@/hooks/useModalA11y";
import { queryClient } from "@/lib/queryClient";
import "@/pages/Housing.css";

type PmMe = { approved: boolean; manager?: { id: number; name: string; company?: string | null } | null };

export default function HousingComposerOverlay({
  initialType,
  viewerDisplayName,
  onClose,
  onPosted,
}: {
  initialType: HousingType | "PM" | null;
  viewerDisplayName?: string | null;
  onClose: () => void;
  onPosted: (postId: number) => void;
}) {
  const dialogRef = useModalA11y({ onClose });
  const { data: pm } = useQuery<PmMe>({
    queryKey: ["/api/housing/pm/me"],
    queryFn: async () => {
      const response = await fetch("/api/housing/pm/me", { credentials: "include" });
      return response.ok ? response.json() : { approved: false };
    },
  });

  return createPortal(
    <div className="board-detail-backdrop" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Post to HOÜS" tabIndex={-1} className="hz hz--sheetpage pdx-glass-rebind" style={{ width: "min(880px, calc(100vw - 24px))", maxHeight: "92vh", overflow: "auto", position: "relative", borderRadius: 18 }} onClick={event => event.stopPropagation()}>
        <HousingComposer
          initialType={initialType}
          isPropertyManager={Boolean(pm?.approved)}
          managerName={pm?.manager?.company || pm?.manager?.name || null}
          viewerDisplayName={viewerDisplayName}
          onClose={onClose}
          onPosted={(postId) => {
            void queryClient.invalidateQueries({ queryKey: ["/api/housing"] });
            onPosted(postId);
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
