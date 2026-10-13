import type { RefObject } from "react";
import HeaderDropdown from "@/components/ui/header-dropdown";
import HubReader from "./HubReader";

export default function HubPanel({ open, onOpenChange, trigger }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLElement | null>;
}) {
  return <HeaderDropdown open={open} onOpenChange={onOpenChange} trigger={trigger} triggerSelector="[data-hub-trigger]" id="hub-panel" title="Hub" description="Chronological activity from Portland people, places, events, boards, and destinations. Filter, post, or load older updates.">
    <HubReader panelOpen={open} onClose={() => onOpenChange(false)} />
  </HeaderDropdown>;
}
